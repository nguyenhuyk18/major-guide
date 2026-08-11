import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';
import Stripe from 'stripe';
import { ReverseService } from '../../reserve/services/reverse.service';

export interface StripeWebhookPayload {
    type: string;
    sessionId: string;
    paymentStatus: string;
    paymentIntentId?: string;
    amountTotal?: number;
    currency?: string;
    bookingId?: string;
    memberId?: string;
}

@Injectable()
export class PaymentService {
    private readonly stripe: Stripe;
    private readonly currency: string;
    private readonly platformFee: number;
    private readonly successUrl: string;
    private readonly cancelUrl: string;

    constructor(private readonly config: ConfigService, private readonly reverseService: ReverseService) {
        this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_CONFIG.SECRET_KEY'));
        this.currency = this.config.get<string>('STRIPE_CONFIG.CURRENCY') || 'vnd';
        this.platformFee = Number(this.config.get<number>('STRIPE_CONFIG.PLATFORM_FEE') || 45000);
        this.successUrl = this.config.getOrThrow<string>('STRIPE_CONFIG.SUCCESS_URL');
        this.cancelUrl = this.config.getOrThrow<string>('STRIPE_CONFIG.CANCEL_URL');
    }

    async createCheckoutSession(data: { orderId: string; memberId: string }) {
        const booking = await this.reverseService.getBookingByOrderId(data.orderId);
        if (!booking) throw new NotFoundException('Không tìm thấy lịch đặt');
        if (booking.id_member !== data.memberId) throw new ForbiddenException('Bạn không có quyền thanh toán lịch đặt này');

        const validity = await this.reverseService.checkBookingCanPay(data.orderId);
        if (!validity.canPay) {
            const messages: Record<string, string> = {
                'Booking not found': 'Không tìm thấy lịch đặt',
                'Booking has been cancelled': 'Lịch đặt đã bị huỷ',
                'Booking has already been paid': 'Lịch đặt đã được thanh toán',
                'Payment link has expired': 'Thời gian giữ lịch đã hết hạn',
            };
            throw new BadRequestException(messages[validity.reason || ''] || validity.reason || 'Không thể thanh toán lịch đặt');
        }

        const amount = Math.round(Number(booking.price_support || 0) + this.platformFee);
        if (amount <= 0) throw new BadRequestException('Số tiền thanh toán không hợp lệ');

        if (booking.stripe_session_id) {
            const current = await this.stripe.checkout.sessions.retrieve(booking.stripe_session_id);
            if (current.status === 'open' && current.url) {
                return { checkoutUrl: current.url, sessionId: current.id };
            }
        }

        const session = await this.stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: booking.email_customer || undefined,
            client_reference_id: booking.id_reverse,
            metadata: { bookingId: booking.id_reverse, memberId: booking.id_member },
            payment_intent_data: { metadata: { bookingId: booking.id_reverse, memberId: booking.id_member } },
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: this.currency,
                    unit_amount: amount,
                    product_data: { name: `Lịch tư vấn với ${booking.name_expert || 'chuyên gia'}` },
                },
            }],
            success_url: this.successUrl,
            cancel_url: `${this.cancelUrl}${this.cancelUrl.includes('?') ? '&' : '?'}booking=${encodeURIComponent(booking.id_reverse)}`,
        }, { idempotencyKey: `booking-checkout-${booking.id_reverse}` });

        const saved = await this.reverseService.updateStripeSession(
            booking.id_reverse,
            booking.id_member,
            session.id,
            session.url || '',
            booking.payment_expires_at
        );
        if (!saved) throw new BadRequestException('Lịch đặt không còn khả dụng để thanh toán');
        return { checkoutUrl: session.url, sessionId: session.id };
    }

    async getCheckoutStatus(sessionId: string, memberId: string) {
        const booking = await this.reverseService.getBookingByStripeSessionId(sessionId);
        if (!booking) throw new NotFoundException('Không tìm thấy phiên thanh toán');
        if (booking.id_member !== memberId) throw new ForbiddenException('Bạn không có quyền xem phiên thanh toán này');

        let status: 'processing' | 'paid' | 'failed' | 'expired' = 'processing';
        if (booking.status === STATUS_BOOKING.PAIED) status = 'paid';
        else if (booking.payment_expires_at && new Date() > new Date(booking.payment_expires_at)) status = 'expired';
        else if (booking.status === STATUS_BOOKING.FAILED || booking.status === STATUS_BOOKING.CANCLE) status = 'failed';
        return { status, orderId: booking.id_reverse };
    }

    async processWebhook(event: StripeWebhookPayload) {
        if (!event.bookingId || !event.sessionId) return { processed: false };
        const booking = await this.reverseService.getBookingByOrderId(event.bookingId);
        if (!booking || booking.id_member !== event.memberId || booking.stripe_session_id !== event.sessionId) {
            throw new BadRequestException('Stripe metadata không khớp booking');
        }

        const expectedAmount = Math.round(Number(booking.price_support || 0) + this.platformFee);
        if (event.currency !== this.currency || event.amountTotal !== expectedAmount) {
            throw new BadRequestException('Số tiền hoặc tiền tệ Stripe không khớp booking');
        }

        const successful = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)
            && event.paymentStatus === 'paid';
        if (successful) {
            if (booking.status === STATUS_BOOKING.PAIED) return { processed: true, idempotent: true };
            const validity = await this.reverseService.checkBookingCanPay(event.bookingId);
            if (!validity.canPay) {
                if (event.paymentIntentId) {
                    await this.stripe.refunds.create({ payment_intent: event.paymentIntentId }, { idempotencyKey: `expired-booking-refund-${event.sessionId}` });
                }
                await this.reverseService.failStripePayment(event.bookingId, event.sessionId);
                return { processed: true, refunded: true };
            }
            await this.reverseService.completeStripePayment(event.bookingId, event.sessionId, event.paymentIntentId || event.sessionId);
            return { processed: true };
        }

        if (['checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) {
            if (booking.status === STATUS_BOOKING.PAIED) return { processed: true, idempotent: true };
            await this.reverseService.failStripePayment(event.bookingId, event.sessionId);
            return { processed: true };
        }
        return { processed: false };
    }
}
