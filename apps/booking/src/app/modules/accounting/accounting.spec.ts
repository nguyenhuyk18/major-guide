import { AccountingService, accountingFilter } from './accounting.module';
import { bookingAmounts } from './booking-ledger';

describe('Accounting', () => {
  test('rejects invalid calendar dates and reversed periods', () => {
    expect(() => accountingFilter({ start: '2026-02-30' })).toThrow();
    expect(() =>
      accountingFilter({ start: '2026-09-30', end: '2026-09-01' })
    ).toThrow();
    expect(
      accountingFilter({ start: '2026-09-01', end: '2026-09-30' })
    ).toEqual({ date: { $gte: '2026-09-01', $lte: '2026-09-30' } });
  });
  test('splits booking revenue into platform fee and expert payable', async () => {
    const service = new AccountingService(
      {
        aggregate: jest.fn().mockResolvedValue([
          {
            income: 600000, // 2 bookings (290k) + 310k other income
            expense: 345000, // 145k refund + 100k payout + 100k rent
            count: 6,
            bookingGross: 290000,
            bookingCount: 2,
            bookingFees: 90000,
            bookingExpert: 200000,
            refunds: 145000,
            refundFees: 45000,
            refundExpert: 100000,
            payouts: 100000,
          },
        ]),
      } as any,
      {} as any
    );
    expect(await service.summary({})).toEqual({
      income: 600000,
      expense: 345000,
      balance: 255000,
      count: 6,
      currency: 'VND',
      booking: {
        count: 2,
        gross: 290000,
        refunds: 145000,
        platformRevenue: 45000,
        expertEarnings: 100000,
        expertPayouts: 100000,
        expertPayable: 0,
      },
      otherIncome: 310000,
      operatingExpense: 100000,
      profit: 255000,
    });
  });
  test('returns zeros for an empty period', async () => {
    const service = new AccountingService(
      { aggregate: jest.fn().mockResolvedValue([]) } as any,
      {} as any
    );
    const summary = await service.summary({});
    expect(summary.income).toBe(0);
    expect(summary.booking.platformRevenue).toBe(0);
    expect(summary.profit).toBe(0);
  });
  test('records a booking payment once with the fee split', async () => {
    const stored: any[] = [];
    const entries = {
      updateOne: jest.fn(async (filter: any, update: any) => {
        if (!stored.some((item) => item.requestId === filter.requestId))
          stored.push(update.$setOnInsert);
      }),
      findOne: (filter: any) => ({
        lean: async () => stored.find((item) => item.requestId === filter.requestId),
      }),
    };
    const service = new AccountingService(entries as any, {} as any);
    const booking = {
      id_reverse: 'b1',
      id_expert: 'e1',
      price_support: 200000,
      amount_paid: 245000,
      platform_fee: 45000,
      payment_date: new Date('2026-09-30T18:30:00Z'), // 01:30 on Oct 1 in Vietnam
      name_customer: 'An',
    };
    await service.recordBookingPayment(booking);
    const entry = await service.recordBookingPayment(booking);
    expect(stored).toHaveLength(1);
    expect(entry).toMatchObject({
      requestId: 'booking-payment:b1',
      type: 'income',
      date: '2026-10-01',
      amount: 245000,
      platformFee: 45000,
      expertAmount: 200000,
      source: 'booking',
    });
  });
  test('rejects expense invoices before creating any document', async () => {
    const invoices = { create: jest.fn() };
    const service = new AccountingService(
      { findById: () => ({ lean: async () => ({ type: 'expense' }) }) } as any,
      invoices as any
    );
    await expect(service.invoice('entry', 'admin')).rejects.toThrow();
    expect(invoices.create).not.toHaveBeenCalled();
  });
  test('rejects fractional money and blank descriptions', async () => {
    const entries = { create: jest.fn() };
    const service = new AccountingService(entries as any, {} as any);
    await expect(
      service.create(
        { date: '2026-09-01', type: 'income', amount: 1.5 } as any,
        'admin'
      )
    ).rejects.toThrow();
    await expect(
      service.create(
        {
          date: '2026-09-01',
          type: 'income',
          amount: 100,
          category: 'a',
          counterparty: 'b',
          description: ' ',
        } as any,
        'admin'
      )
    ).rejects.toThrow();
    expect(entries.create).not.toHaveBeenCalled();
  });
  test('returns existing invoice when retried', async () => {
    const invoice = { number: 'MG-EXISTING', entryId: 'entry' };
    const invoices = {
      findOne: () => ({ lean: async () => invoice }),
      create: jest.fn(),
    };
    const service = new AccountingService(
      { findById: () => ({ lean: async () => ({ type: 'income' }) }) } as any,
      invoices as any
    );
    expect(await service.invoice('entry', 'admin')).toEqual(invoice);
    expect(invoices.create).not.toHaveBeenCalled();
  });
  test('uses the payment snapshot and falls back to the default fee for legacy bookings', () => {
    expect(bookingAmounts({ price_support: 100000, amount_paid: 150000, platform_fee: 50000 }, 45000)).toEqual({
      amountPaid: 150000, platformFee: 50000, expertAmount: 100000,
    });
    expect(bookingAmounts({ price_support: 100000 }, 45000)).toEqual({
      amountPaid: 145000, platformFee: 45000, expertAmount: 100000,
    });
  });
});
