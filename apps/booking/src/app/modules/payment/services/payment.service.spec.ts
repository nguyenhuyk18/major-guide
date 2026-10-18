import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';
import { PaymentService, StripeWebhookPayload } from './payment.service';

describe('PaymentService Stripe webhook', () => {
    const config = {
        getOrThrow: jest.fn((key: string) => ({
            'STRIPE_CONFIG.SECRET_KEY': 'sk_test_unit',
            'STRIPE_CONFIG.SUCCESS_URL': 'http://localhost/success?session_id={CHECKOUT_SESSION_ID}',
            'STRIPE_CONFIG.CANCEL_URL': 'http://localhost/cancel',
        }[key])),
        get: jest.fn((key: string) => ({
            'STRIPE_CONFIG.CURRENCY': 'vnd',
            'STRIPE_CONFIG.PLATFORM_FEE': 45000,
        }[key])),
    } as unknown as ConfigService;

    const event: StripeWebhookPayload = {
        type: 'checkout.session.completed',
        sessionId: 'cs_test_1',
        paymentStatus: 'paid',
        paymentIntentId: 'pi_test_1',
        amountTotal: 145000,
        currency: 'vnd',
        bookingId: 'booking-1',
        memberId: 'member-1',
    };

    const makeReverseService = (status: STATUS_BOOKING = STATUS_BOOKING.RESERVED) => ({
        getBookingByOrderId: jest.fn().mockResolvedValue({
            id_reverse: 'booking-1', id_member: 'member-1', stripe_session_id: 'cs_test_1',
            price_support: 100000, status,
        }),
        checkBookingCanPay: jest.fn().mockResolvedValue({ canPay: true }),
        completeStripePayment: jest.fn().mockResolvedValue({}),
        failStripePayment: jest.fn().mockResolvedValue({}),
    });

    const makeAccounting = () => ({
        recordBookingPayment: jest.fn().mockResolvedValue({}),
        recordBookingRefund: jest.fn().mockResolvedValue({}),
    });

    it('completes a valid paid checkout', async () => {
        const reverse = makeReverseService();
        const service = new PaymentService(config, reverse as any, makeAccounting() as any);
        await expect(service.processWebhook(event)).resolves.toEqual({ processed: true });
        expect(reverse.completeStripePayment).toHaveBeenCalledTimes(1);
    });

    it('snapshots the charge and writes the payment to the ledger', async () => {
        const reverse = makeReverseService();
        const paidBooking = { id_reverse: 'booking-1', price_support: 100000, status: STATUS_BOOKING.PAIED };
        reverse.getBookingByOrderId
            .mockResolvedValueOnce({ id_reverse: 'booking-1', id_member: 'member-1', stripe_session_id: 'cs_test_1', price_support: 100000, status: STATUS_BOOKING.RESERVED })
            .mockResolvedValueOnce(paidBooking);
        const accounting = makeAccounting();
        const service = new PaymentService(config, reverse as any, accounting as any);
        await service.processWebhook(event);
        expect(reverse.completeStripePayment).toHaveBeenCalledWith('booking-1', 'cs_test_1', 'pi_test_1', { amountPaid: 145000, platformFee: 45000 });
        expect(accounting.recordBookingPayment).toHaveBeenCalledWith(paidBooking, { reference: 'pi_test_1' });
    });

    it('does not fail the payment when the ledger write fails', async () => {
        const reverse = makeReverseService(STATUS_BOOKING.PAIED);
        const accounting = makeAccounting();
        accounting.recordBookingPayment.mockRejectedValue(new Error('mongo down'));
        const service = new PaymentService(config, reverse as any, accounting as any);
        await expect(service.processWebhook(event)).resolves.toEqual({ processed: true, idempotent: true });
        expect(accounting.recordBookingPayment).toHaveBeenCalledTimes(1);
    });

    it('records both the charge and the refund for a late payment', async () => {
        const reverse = makeReverseService(STATUS_BOOKING.FAILED);
        const accounting = makeAccounting();
        const service = new PaymentService(config, reverse as any, accounting as any);
        (service as any).stripe = { refunds: { create: jest.fn().mockResolvedValue({}) } };
        await expect(service.processWebhook(event)).resolves.toEqual({ processed: true, refunded: true });
        expect(accounting.recordBookingPayment).toHaveBeenCalledTimes(1);
        expect(accounting.recordBookingRefund).toHaveBeenCalledWith(
            expect.objectContaining({ id_reverse: 'booking-1' }),
            expect.objectContaining({ amountPaid: 145000, platformFee: 45000, reference: 'pi_test_1' }),
        );
    });

    it('is idempotent when Stripe retries a completed event', async () => {
        const reverse = makeReverseService(STATUS_BOOKING.PAIED);
        const service = new PaymentService(config, reverse as any, makeAccounting() as any);
        await expect(service.processWebhook(event)).resolves.toEqual({ processed: true, idempotent: true });
        expect(reverse.completeStripePayment).not.toHaveBeenCalled();
    });

    it('rejects a mismatched amount', async () => {
        const reverse = makeReverseService();
        const service = new PaymentService(config, reverse as any, makeAccounting() as any);
        await expect(service.processWebhook({ ...event, amountTotal: 1 })).rejects.toBeInstanceOf(BadRequestException);
    });
});
