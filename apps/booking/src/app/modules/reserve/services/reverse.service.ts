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



@Injectable()
export class ReverseService {
    constructor(private readonly reverseRepository: ReverseRepository,
        @Inject(RABBIT_SERVICE.BOOKING_STATUS_SUCCESS) private readonly successBooking: TcpClient,
        private readonly googleCalendarService: GoogleCalendarService,
    ) { }

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

        // Set payment expiration to 5 minutes from now (matching delay queue TTL)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
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
        // Set payment expiration to 5 minutes from now (matching delay queue TTL)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

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
}