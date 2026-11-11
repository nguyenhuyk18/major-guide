import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';
import { ownerFilter, overviewQuery, toOverviewRow, vietnamToday } from './booking-overview';
import { ReverseService } from './reverse.service';

const booking = {
  id_reverse: 'b-1',
  id_member: 'member-1',
  id_expert: 'expert-1',
  day_support: '2026-11-12',
  time_start: '2026-11-12T02:00:00.000Z',
  time_end: '2026-11-12T03:30:00.000Z',
  status: STATUS_BOOKING.PAIED,
  name_customer: 'Học viên A',
  email_customer: 'a@example.com',
  name_expert: 'Chuyên gia B',
  price_support: 200000,
  stripe_session_id: 'cs_secret',
  stripe_payment_intent_id: 'pi_secret',
  payment_link: 'https://pay.example/secret',
  transaction_id: 'tx_secret',
  createdAt: '2026-11-10T00:00:00.000Z',
};

describe('booking overview for the AI assistant', () => {
  it('uses the Vietnam calendar day', () => {
    // 18:30 UTC on the 11th is already 01:30 on the 12th in Vietnam.
    expect(vietnamToday(new Date('2026-11-11T18:30:00Z'))).toBe('2026-11-12');
  });

  it('scopes rows to the signed-in owner', () => {
    expect(ownerFilter({ role: 'admin', userId: 'x' })).toEqual({});
    expect(ownerFilter({ role: 'expert', userId: 'expert-1' })).toEqual({ id_expert: 'expert-1' });
    expect(ownerFilter({ role: 'member', userId: 'member-1' })).toEqual({ id_member: 'member-1' });
    expect(() => ownerFilter({ role: 'member', userId: '' })).toThrow();
  });

  it('lists only upcoming paid sessions for staff, plus held slots for members', () => {
    const now = new Date('2026-11-11T05:00:00Z');
    const expert = overviewQuery({ role: 'expert', userId: 'expert-1' }, now);
    expect(expert.filter).toEqual({
      id_expert: 'expert-1',
      day_support: { $gte: '2026-11-11' },
      status: { $in: [STATUS_BOOKING.PAIED] },
    });
    expect(expert.sort).toEqual({ day_support: 1, time_start: 1 });
    const member = overviewQuery({ role: 'member', userId: 'member-1' }, now);
    expect(member.filter.status).toEqual({ $in: [STATUS_BOOKING.PAIED, STATUS_BOOKING.RESERVED] });
  });

  it('sorts recent bookings newest first and clamps the limit', () => {
    const recent = overviewQuery({ role: 'admin', userId: 'a', scope: 'recent', limit: 500 });
    expect(recent).toEqual({ filter: {}, sort: { createdAt: -1 }, limit: 20 });
    expect(overviewQuery({ role: 'admin', userId: 'a', limit: -3 }).limit).toBe(1);
  });

  it('never returns payment secrets and hides contact data from non-admins', () => {
    const admin = toOverviewRow(booking, { role: 'admin', userId: 'a' });
    const expert = toOverviewRow(booking, { role: 'expert', userId: 'expert-1' });
    const member = toOverviewRow(booking, { role: 'member', userId: 'member-1' });
    for (const row of [admin, expert, member]) {
      const text = JSON.stringify(row);
      expect(text).not.toContain('secret');
      expect(row).toMatchObject({ bookingId: 'b-1', day: '2026-11-12', start: '09:00', end: '10:30', statusLabel: 'Đã thanh toán' });
    }
    expect(admin).toMatchObject({ memberName: 'Học viên A', memberEmail: 'a@example.com' });
    expect(expert).toMatchObject({ memberName: 'Học viên A' });
    expect(expert).not.toHaveProperty('memberEmail');
    expect(member).not.toHaveProperty('memberName');
    expect(member).not.toHaveProperty('memberEmail');
  });

  it('service passes the scoped query to the repository', async () => {
    const repository = { findForOverview: jest.fn().mockResolvedValue([booking]) };
    const service = Object.create(ReverseService.prototype);
    (service as any).reverseRepository = repository;
    const result = await service.getBookingOverview({ role: 'member', userId: 'member-1', scope: 'recent', limit: 5 });
    expect(repository.findForOverview).toHaveBeenCalledWith({ id_member: 'member-1' }, { createdAt: -1 }, 5);
    expect(result.scope).toBe('recent');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).not.toHaveProperty('memberEmail');
  });
});
