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
        const config = { getOrThrow: jest.fn().mockReturnValue('sk_test_unit') } as unknown as ConfigService;
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
});
