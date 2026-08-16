import { Inject, Injectable } from '@nestjs/common';
import { ReverseRepository } from '../repositories/reverse.repository';
import { ReverseTcpRequest } from '@common/interfaces/tcp/booking/reverse-tcp-request.interface';
import { CreateBookingTcpRequest } from '@common/interfaces/tcp/booking/create-booking-tcp-request.interface';
import { mappingToReverse } from '../mappers';
import { Reverse } from '@common/schemas/booking/reverse.schema';
import { STATUS_BOOKING, STATUS_SLOT } from '@common/constant/enum/status_slot.contant';
import { RABBIT_SERVICE } from '@common/configuration/rabbit.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { BOOKING_SERVICE_RABBIT_MESSAGE } from '@common/constant/enum/rabbitmq-message.constant';
import { GoogleCalendarService } from './google-calendar.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TCP_CHAT_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';



@Injectable()
export class ReverseService {
    private readonly stripe: Stripe;

    constructor(private readonly reverseRepository: ReverseRepository,
        @Inject(RABBIT_SERVICE.BOOKING_STATUS_SUCCESS) private readonly successBooking: TcpClient,
        @Inject(TCP_SERVICE.CHAT_SERVICE) private readonly notificationClient: TcpClient,
        private readonly googleCalendarService: GoogleCalendarService,
        config: ConfigService,
    ) {
        this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_CONFIG.SECRET_KEY'));
    }

    // check reverse có trùng hay không
    private async checkTheReverseExist(date_sup: string, id_expert: string, id_shift: string) {
        const rs = await this.reverseRepository.checkDateSupport(date_sup, id_expert, id_shift);
        if (!rs) {
            return false;
        }

        if (rs.status === STATUS_BOOKING.CANCLE) {
            return false;
        }
        return true;
    }

    async addReverse(data: ReverseTcpRequest, id_reverse: string) {
        const newData: Partial<Reverse> = mappingToReverse(data, id_reverse);

        // Hold the booking for 30 minutes while the member completes payment.
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        newData.payment_expires_at = expiresAt;

        // check xem lịch này có bị ai đặt chưa 
        const rs = await this.checkTheReverseExist(data.day_support, data.id_expert, data.id_shift_in_day);

        // check lich co con hop le kh (dat co trong ngay quy dinh kh)

        // if (!rs) {
        //     throw new BadRequestException('Trùng lịch đăng ký rồi ');
        // }

        return this.reverseRepository.saveReverse(newData);
    }


    async updateReverseStatusReverse(uuid_reverse: string, status: STATUS_BOOKING) {
        const tmp = await this.reverseRepository.findByUUid(uuid_reverse);

        if (tmp.status === STATUS_BOOKING.PAIED || tmp.status === STATUS_BOOKING.CANCLE) {
            return;
        }

        return this.reverseRepository.updateReverseByuuid(uuid_reverse, { status })
    }


    async updateReverseSuccess(uuid_reverse: string) {
        this.successBooking.emit<void, { uuid_reverse: string, status_hold: STATUS_SLOT }>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_SUCCESS_STATUS, { data: { uuid_reverse, status_hold: STATUS_SLOT.AVAILABLE }, processId: 'xxxxx' });

        return this.reverseRepository.updateReverseByuuid(uuid_reverse, { status: STATUS_BOOKING.PAIED })

    }

    async updatePaymentSuccess(uuid_reverse: string, paymentData: { payment_date?: Date; transaction_id?: string; payment_link?: string }) {
        const booking = await this.reverseRepository.findByUUid(uuid_reverse);
        if (!booking) {
            return;
        }

        let meetLink = '';
        try {
            const { meetLink: link } = await this.googleCalendarService.createMeetEvent({
                summary: `Tư vấn với ${booking.name_expert}`,
                description: `Booking ID: ${booking.id_reverse}`,
                startDateTime: booking.time_start.toISOString().replace('Z', '+07:00').split('.')[0],
                endDateTime: booking.time_end.toISOString().replace('Z', '+07:00').split('.')[0],
                attendeeEmail: booking.email_customer,
            });
            meetLink = link;
        } catch (error) {
            console.error('Failed to create Google Meet:', error);
        }

        this.successBooking.emit<void, { uuid_reverse: string, status_hold: STATUS_SLOT }>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_SUCCESS_STATUS, { data: { uuid_reverse, status_hold: STATUS_SLOT.ORDERED }, processId: 'xxxxx' });

        return this.reverseRepository.updateReverseByuuid(uuid_reverse, {
            status: STATUS_BOOKING.PAIED,
            payment_date: paymentData.payment_date || new Date(),
            transaction_id: paymentData.transaction_id,
            payment_link: paymentData.payment_link,
            meet_link: meetLink,
        });
    }

    getBookingByOrderId(orderId: string) {
        return this.reverseRepository.findByUUid(orderId);
    }

    getBookingByStripeSessionId(sessionId: string) {
        return this.reverseRepository.findByStripeSessionId(sessionId);
    }

    async expireOpenStripeSession(orderId: string) {
        const booking = await this.reverseRepository.findByUUid(orderId);
        if (!booking?.stripe_session_id) return;
        try {
            const session = await this.stripe.checkout.sessions.retrieve(booking.stripe_session_id);
            if (session.status === 'open') await this.stripe.checkout.sessions.expire(session.id);
        } catch (error) {
            console.error('Failed to expire Stripe Checkout Session:', error);
        }
    }

    updateStripeSession(orderId: string, memberId: string, sessionId: string, checkoutUrl: string, expiresAt: Date) {
        return this.reverseRepository.updateStripeSession(orderId, memberId, {
            stripe_session_id: sessionId,
            payment_link: checkoutUrl,
            payment_expires_at: expiresAt,
        });
    }

    async completeStripePayment(orderId: string, sessionId: string, paymentIntentId: string) {
        const booking = await this.reverseRepository.markStripePaymentPaid(orderId, sessionId, {
            payment_date: new Date(),
            transaction_id: paymentIntentId,
            stripe_payment_intent_id: paymentIntentId,
        });
        if (!booking) return null;

        this.successBooking.emit<void, { uuid_reverse: string; status_hold: STATUS_SLOT }>(
            BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_SUCCESS_STATUS,
            { data: { uuid_reverse: booking.id_reverse, status_hold: STATUS_SLOT.ORDERED }, processId: 'stripe-webhook' }
        );
        this.notificationClient.emit(TCP_CHAT_SERVICE_MESSAGE.CREATE_NOTIFICATION, {
            processId: 'stripe-webhook', data: {
                eventId: `booking-paid:${booking.id_reverse}`,
                recipientId: booking.id_expert,
                type: 'booking_paid', title: 'Lịch tư vấn mới',
                message: `${booking.name_customer || 'Một học viên'} đã đặt và thanh toán lịch tư vấn ngày ${booking.day_support}.`,
                entityType: 'booking', entityId: booking.id_reverse,
                actionUrl: `/admin/expert-bookings?bookingId=${booking.id_reverse}`,
                actorId: booking.id_member, actorName: booking.name_customer,
                metadata: { bookingId: booking.id_reverse, memberId: booking.id_member, expertId: booking.id_expert, daySupport: booking.day_support, timeStart: booking.time_start, price: booking.price_support }
            }
        }).subscribe({ error: error => console.error('Failed to publish booking notification:', error) });
        return booking;
    }

    async failStripePayment(orderId: string, sessionId: string) {
        const booking = await this.reverseRepository.markStripePaymentFailed(orderId, sessionId);
        if (!booking) return null;
        this.successBooking.emit<void, { uuid_reverse: string; status_hold: STATUS_SLOT }>(
            BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_SUCCESS_STATUS,
            { data: { uuid_reverse: booking.id_reverse, status_hold: STATUS_SLOT.CANCLE }, processId: 'stripe-webhook' }
        );
        return booking;
    }

    async updateReverseFail(uuid_reverse: string) {

        this.successBooking.emit<void, { uuid_reverse: string, status_hold: STATUS_SLOT }>(BOOKING_SERVICE_RABBIT_MESSAGE.BOOKING_SUCCESS_STATUS, { data: { uuid_reverse, status_hold: STATUS_SLOT.CANCLE }, processId: 'xxxxx' });

        return this.reverseRepository.updateReverseByuuid(uuid_reverse, { status: STATUS_BOOKING.FAILED })
    }

    async getBookingsByMemberId(memberId: string) {
        return this.reverseRepository.findByMemberId(memberId);
    }

    /**
     * Check if booking can still be paid
     * Returns { canPay: true } if booking is valid and not expired
     * Returns { canPay: false, reason: string } if booking cannot be paid
     */
    async checkBookingCanPay(uuid_reverse: string): Promise<{ canPay: boolean; reason?: string }> {
        const booking = await this.reverseRepository.findByUUid(uuid_reverse);

        if (!booking) {
            return { canPay: false, reason: 'Booking not found' };
        }

        // Check if already cancelled
        if (booking.status === STATUS_BOOKING.CANCLE) {
            return { canPay: false, reason: 'Booking has been cancelled' };
        }

        // Check if already paid
        if (booking.status === STATUS_BOOKING.PAIED) {
            return { canPay: false, reason: 'Booking has already been paid' };
        }

        // Check if payment has expired
        if (booking.payment_expires_at && new Date() > new Date(booking.payment_expires_at)) {
            return { canPay: false, reason: 'Payment link has expired' };
        }

        return { canPay: true };
    }

    async checkIsReversed() {
        return true;
    }

    /**
     * Create new booking (v2 flow - separate from payment)
     */
    async createBooking(data: CreateBookingTcpRequest, id_reverse: string) {
        // Hold the booking for 30 minutes while the member completes payment.
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);

        const newData: Partial<Reverse> = {
            id_member: data.id_member,
            id_expert: data.id_expert,
            id_shift_in_day: data.id_shift_in_day,
            day_support: data.day_support, // Already in YYYY-MM-DD format from BFF
            time_start: data.time_start,
            time_end: data.time_end,
            price_support: data.price_support,
            name_customer: data.name_customer,
            name_expert: data.name_expert,
            avatar_expert: data.avatar_expert,
            email_customer: data.email_customer,
            note: data.note,
            id_reverse: id_reverse,
            status: STATUS_BOOKING.RESERVED,
            payment_expires_at: expiresAt,
        };

        return this.reverseRepository.saveReverse(newData);
    }

    async getBookingsByExpertId(expertId: string, page: number = 1, limit: number = 10) {
        const [bookings, total] = await Promise.all([
            this.reverseRepository.findByExpertIdWithPagination(expertId, page, limit),
            this.reverseRepository.countByExpertId(expertId)
        ]);

        const totalPage = Math.ceil(total / limit);

        return {
            result: bookings,
            totalPage
        };
    }

    async expertJoinBooking(expertId: string, bookingId: string) {
        const booking = await this.reverseRepository.findByUUid(bookingId);

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.id_expert !== expertId) {
            throw new Error('Unauthorized: Expert does not own this booking');
        }

        if (booking.status !== STATUS_BOOKING.PAIED) {
            throw new Error('Booking must be paid before expert can join');
        }

        const result = await this.reverseRepository.updateJoinAt(bookingId, new Date());
        return result;
    }

    async getDashboardData(expertId?: string) {
        const bookings: any[] = await this.reverseRepository.findForDashboard(expertId);
        const paid = bookings.filter(item => item.status === STATUS_BOOKING.PAIED);
        const now = new Date();
        const monthKeys = Array.from({ length: 7 }, (_, offset) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (6 - offset), 1);
            return {
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                month: `T${date.getMonth() + 1}`,
                revenue: 0,
                bookings: 0,
            };
        });
        const revenueByMonth = new Map(monthKeys.map(item => [item.key, item]));

        for (const booking of paid) {
            const paymentDate = booking.payment_date || booking.createdAt;
            if (!paymentDate) continue;
            const date = new Date(paymentDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const bucket = revenueByMonth.get(key);
            if (bucket) {
                bucket.revenue += Number(booking.price_support || 0);
                bucket.bookings += 1;
            }
        }

        const expertStats = new Map<string, any>();
        for (const booking of paid) {
            const id = booking.id_expert || 'unknown';
            const current = expertStats.get(id) || {
                id, name: booking.name_expert || 'Chuyên gia', avatar: booking.avatar_expert || null,
                bookings: 0, revenue: 0,
            };
            current.bookings += 1;
            current.revenue += Number(booking.price_support || 0);
            expertStats.set(id, current);
        }

        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const statusCounts = bookings.reduce((result, item) => {
            result[item.status] = (result[item.status] || 0) + 1;
            return result;
        }, {} as Record<string, number>);

        return {
            totalBookings: bookings.length,
            paidBookings: paid.length,
            pendingBookings: statusCounts[STATUS_BOOKING.RESERVED] || 0,
            cancelledBookings: (statusCounts[STATUS_BOOKING.CANCLE] || 0) + (statusCounts[STATUS_BOOKING.FAILED] || 0),
            totalRevenue: paid.reduce((sum, item) => sum + Number(item.price_support || 0), 0),
            monthlyRevenue: revenueByMonth.get(currentMonthKey)?.revenue || 0,
            revenueData: monthKeys,
            recentBookings: bookings.slice(0, 6),
            topExperts: [...expertStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        };
    }

    async getVideoCallAccess(bookingId: string, userId: string, roleName?: string) {
        const booking = await this.reverseRepository.findByUUid(bookingId);
        if (!booking) return { canJoin: false, reason: 'Không tìm thấy lịch tư vấn' };
        if (booking.status !== STATUS_BOOKING.PAIED) return { canJoin: false, reason: 'Lịch tư vấn chưa được thanh toán' };

        const participantRole = booking.id_member === userId ? 'member' : booking.id_expert === userId ? 'expert' : null;
        if (!participantRole || (roleName && roleName !== participantRole)) {
            return { canJoin: false, reason: 'Bạn không thuộc lịch tư vấn này' };
        }

        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(new Date());
        const get = (type: string) => parts.find(part => part.type === type)?.value;
        const today = `${get('year')}-${get('month')}-${get('day')}`;
        if (booking.day_support !== today) {
            return {
                canJoin: false,
                reason: booking.day_support > today ? 'Chưa đến ngày tư vấn' : 'Ngày tư vấn đã kết thúc',
                daySupport: booking.day_support,
            };
        }

        return {
            canJoin: true,
            bookingId: booking.id_reverse,
            participantRole,
            memberId: booking.id_member,
            expertId: booking.id_expert,
            daySupport: booking.day_support,
            timeStart: booking.time_start,
            timeEnd: booking.time_end,
            nameCustomer: booking.name_customer,
            nameExpert: booking.name_expert,
        };
    }
}
