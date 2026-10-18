import { ConfigService } from '@nestjs/config';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';
import { ReverseService } from './reverse.service';

describe('ReverseService video call access', () => {
    const todayBangkok = () => {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const get = (type: string) => parts.find(part => part.type === type)?.value;
        return `${get('year')}-${get('month')}-${get('day')}`;
    };

    const booking = {
        id_reverse: 'booking-1', id_member: 'member-1', id_expert: 'expert-1',
        status: STATUS_BOOKING.PAIED, day_support: todayBangkok(),
        time_start: new Date(), time_end: new Date(), name_customer: 'Member', name_expert: 'Expert',
    };

    const makeService = (overrides = {}) => {
        const repository = { findByUUid: jest.fn().mockResolvedValue({ ...booking, ...overrides }) };
        const config = {
            getOrThrow: jest.fn().mockReturnValue('sk_test_unit'),
            get: jest.fn().mockReturnValue(45000),
        } as unknown as ConfigService;
        return new ReverseService(repository as any, { emit: jest.fn() } as any, { emit: jest.fn() } as any, {} as any, config);
    };

    it('allows the paid member on the booked day', async () => {
        const result = await makeService().getVideoCallAccess('booking-1', 'member-1', 'member');
        expect(result.canJoin).toBe(true);
        expect(result.participantRole).toBe('member');
    });

    it('rejects a user outside the booking', async () => {
        const result = await makeService().getVideoCallAccess('booking-1', 'stranger', 'member');
        expect(result).toMatchObject({ canJoin: false, reason: 'Bạn không thuộc lịch tư vấn này' });
    });

    it('rejects an unpaid booking', async () => {
        const result = await makeService({ status: STATUS_BOOKING.RESERVED }).getVideoCallAccess('booking-1', 'member-1', 'member');
        expect(result).toMatchObject({ canJoin: false, reason: 'Lịch tư vấn chưa được thanh toán' });
    });

    it('rejects a booking outside its support day', async () => {
        const result = await makeService({ day_support: '2099-01-01' }).getVideoCallAccess('booking-1', 'member-1', 'member');
        expect(result).toMatchObject({ canJoin: false, reason: 'Chưa đến ngày tư vấn' });
    });

    it('opens a demo booking on any day, still only for its own participants', async () => {
        const service = makeService({ is_demo: true, day_support: '2020-01-01' });
        expect(await service.getVideoCallAccess('booking-1', 'expert-1', 'expert')).toMatchObject({ canJoin: true, isDemo: true });
        expect(await service.getVideoCallAccess('booking-1', 'stranger', 'member')).toMatchObject({ canJoin: false });
    });

    it('keeps an unpaid demo booking closed', async () => {
        const result = await makeService({ is_demo: true, status: STATUS_BOOKING.RESERVED }).getVideoCallAccess('booking-1', 'member-1', 'member');
        expect(result.canJoin).toBe(false);
    });

    describe('dashboard revenue', () => {
        const paid = [
            // Paid after the fee snapshot existed: 200k expert + 50k platform fee.
            { ...booking, id_reverse: 'b1', price_support: 200000, amount_paid: 250000, platform_fee: 50000, payment_date: new Date() },
            // Legacy booking without snapshot: falls back to the configured 45k fee.
            { ...booking, id_reverse: 'b2', price_support: 100000, payment_date: new Date() },
            // Demo booking for video-call testing: never counted.
            { ...booking, id_reverse: 'demo', is_demo: true, price_support: 999000, amount_paid: 999000, payment_date: new Date() },
        ];
        const makeDashboardService = () => {
            const repository = { findForDashboard: jest.fn().mockResolvedValue(paid) };
            const config = { getOrThrow: jest.fn().mockReturnValue('sk_test_unit'), get: jest.fn().mockReturnValue(45000) } as unknown as ConfigService;
            return new ReverseService(repository as any, { emit: jest.fn() } as any, { emit: jest.fn() } as any, {} as any, config);
        };

        it('reports cash collected and the platform fee separately for admins', async () => {
            const result: any = await makeDashboardService().getDashboardData();
            expect(result.totalRevenue).toBe(395000);
            expect(result.platformRevenue).toBe(95000);
            expect(result.expertEarnings).toBe(300000);
            expect(result.monthlyRevenue).toBe(395000);
        });

        it('shows an expert only their own earnings', async () => {
            const result: any = await makeDashboardService().getDashboardData('expert-1');
            expect(result.totalRevenue).toBe(300000);
            expect(result.platformRevenue).toBeUndefined();
        });
    });
});
