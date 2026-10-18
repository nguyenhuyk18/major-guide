import { Module, Controller, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Model, Schema } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  ACCOUNTING,
  AccountingEntryDto,
  AccountingQueryDto,
} from '@common/interfaces/accounting/accounting.dto';
import {
  ReverseDestination,
  ReverseModelName,
} from '@common/schemas/booking/reverse.schema';
import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';
import {
  BOOKING_CATEGORY,
  PAYOUT_CATEGORY,
  REFUND_CATEGORY,
  SYSTEM_ACTOR,
  bookingAmounts,
  vnDate,
} from './booking-ledger';

const EntrySchema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    requestId: { type: String, required: true, unique: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    date: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1, max: 1_000_000_000_000 },
    category: { type: String, required: true },
    counterparty: { type: String, required: true },
    description: { type: String, required: true },
    reference: String,
    createdBy: { type: String, required: true },
    // Entries generated from bookings carry the fee split.
    source: { type: String, enum: ['manual', 'booking'], default: 'manual' },
    bookingId: { type: String, index: true },
    expertId: String,
    platformFee: Number,
    expertAmount: Number,
  },
  { timestamps: true, collection: 'accounting_entries', versionKey: false }
);
const InvoiceSchema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    number: { type: String, required: true, unique: true },
    entryId: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    amount: Number,
    counterparty: String,
    description: String,
    currency: { type: String, default: 'VND' },
    createdBy: String,
  },
  { timestamps: true, collection: 'accounting_invoices', versionKey: false }
);

export function accountingFilter(query: AccountingQueryDto = {}) {
  const filter: any = {};
  for (const value of [query.start, query.end].filter(Boolean)) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value!) ||
      Number.isNaN(Date.parse(value!)) ||
      new Date(value!).toISOString().slice(0, 10) !== value
    )
      throw new Error('Ngày lọc không hợp lệ.');
  }
  if (query.start && query.end && query.start > query.end)
    throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
  if (query.start || query.end)
    filter.date = {
      ...(query.start ? { $gte: query.start } : {}),
      ...(query.end ? { $lte: query.end } : {}),
    };
  if (query.type) {
    if (!['income', 'expense'].includes(query.type))
      throw new Error('Loại giao dịch không hợp lệ.');
    filter.type = query.type;
  }
  return filter;
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    @InjectModel('AccountingEntry') private entries: Model<any>,
    @InjectModel('AccountingInvoice') private invoices: Model<any>,
    @InjectModel(ReverseModelName) private bookings?: Model<any>,
    private config?: ConfigService
  ) {}

  private defaultPlatformFee() {
    return Number(this.config?.get('STRIPE_CONFIG.PLATFORM_FEE') || 45000);
  }

  /** Insert-once write keyed by requestId; safe under retries and concurrent webhooks. */
  private async upsertSystemEntry(entry: Record<string, unknown>) {
    try {
      await this.entries.updateOne(
        { requestId: entry.requestId },
        { $setOnInsert: entry },
        { upsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    return this.entries.findOne({ requestId: entry.requestId }).lean();
  }

  /** Records the cash received for a booking (income, with fee split). */
  async recordBookingPayment(
    booking: any,
    charge: { amountPaid?: number; platformFee?: number; paidAt?: Date; reference?: string } = {}
  ) {
    if (!booking?.id_reverse) throw new Error('Booking không hợp lệ.');
    const amounts = bookingAmounts(
      {
        price_support: booking.price_support,
        amount_paid: charge.amountPaid ?? booking.amount_paid,
        platform_fee: charge.platformFee ?? booking.platform_fee,
      },
      this.defaultPlatformFee()
    );
    if (amounts.amountPaid <= 0) return null;
    return this.upsertSystemEntry({
      requestId: `booking-payment:${booking.id_reverse}`,
      type: 'income',
      date: vnDate(charge.paidAt || booking.payment_date || booking.createdAt),
      amount: amounts.amountPaid,
      category: BOOKING_CATEGORY,
      counterparty: booking.name_customer || booking.email_customer || 'Học viên',
      description: `Thanh toán lịch tư vấn với ${booking.name_expert || 'chuyên gia'} ngày ${booking.day_support || ''}`.trim(),
      reference: charge.reference || booking.stripe_payment_intent_id || booking.transaction_id || booking.id_reverse,
      createdBy: SYSTEM_ACTOR,
      source: 'booking',
      bookingId: booking.id_reverse,
      expertId: booking.id_expert,
      platformFee: amounts.platformFee,
      expertAmount: amounts.expertAmount,
    });
  }

  /** Records a refund issued for a booking (expense mirroring the payment split). */
  async recordBookingRefund(
    booking: any,
    charge: { amountPaid?: number; platformFee?: number; refundedAt?: Date; reference?: string } = {}
  ) {
    if (!booking?.id_reverse) throw new Error('Booking không hợp lệ.');
    const amounts = bookingAmounts(
      {
        price_support: booking.price_support,
        amount_paid: charge.amountPaid ?? booking.amount_paid,
        platform_fee: charge.platformFee ?? booking.platform_fee,
      },
      this.defaultPlatformFee()
    );
    if (amounts.amountPaid <= 0) return null;
    return this.upsertSystemEntry({
      requestId: `booking-refund:${booking.id_reverse}`,
      type: 'expense',
      date: vnDate(charge.refundedAt),
      amount: amounts.amountPaid,
      category: REFUND_CATEGORY,
      counterparty: booking.name_customer || booking.email_customer || 'Học viên',
      description: `Hoàn tiền lịch tư vấn ngày ${booking.day_support || ''} (thanh toán đến sau khi hết hạn giữ chỗ)`.trim(),
      reference: charge.reference || booking.id_reverse,
      createdBy: SYSTEM_ACTOR,
      source: 'booking',
      bookingId: booking.id_reverse,
      expertId: booking.id_expert,
      platformFee: amounts.platformFee,
      expertAmount: amounts.expertAmount,
    });
  }

  /** Imports every paid booking that has no ledger entry yet (idempotent backfill). */
  async syncBookings() {
    if (!this.bookings) throw new Error('Chưa cấu hình nguồn dữ liệu booking.');
    const paid = await this.bookings.find({ status: STATUS_BOOKING.PAIED, is_demo: { $ne: true } }).lean();
    const existing = new Set(
      (await this.entries
        .find({ source: 'booking', type: 'income' }, { bookingId: 1 })
        .lean()).map((item: any) => item.bookingId)
    );
    let created = 0;
    let failed = 0;
    let alreadyRecorded = 0;
    for (const booking of paid as any[]) {
      if (existing.has(booking.id_reverse)) {
        alreadyRecorded += 1;
        continue;
      }
      try {
        if (await this.recordBookingPayment(booking)) created += 1;
      } catch (error) {
        failed += 1;
        this.logger.error(`Ledger sync failed for booking ${booking.id_reverse}: ${error.message}`);
      }
    }
    return { scanned: paid.length, created, alreadyRecorded, failed };
  }

  async list(query: AccountingQueryDto) {
    const filter = accountingFilter(query);
    const [items, total] = await Promise.all([
      this.entries
        .find(filter)
        .sort({ date: -1, createdAt: -1 })
        .limit(1000)
        .lean(),
      this.entries.countDocuments(filter),
    ]);
    return { items, total, truncated: total > items.length };
  }

  async summary(query: AccountingQueryDto) {
    const sumIf = (condition: any, field = '$amount') => ({
      $sum: { $cond: [condition, { $ifNull: [field, 0] }, 0] },
    });
    const isType = (type: string) => ({ $eq: ['$type', type] });
    const isBooking = { $eq: ['$source', 'booking'] };
    const isBookingIncome = { $and: [isBooking, isType('income')] };
    const isRefund = { $and: [isBooking, isType('expense')] };
    const isPayout = {
      $and: [isType('expense'), { $eq: ['$category', PAYOUT_CATEGORY] }],
    };
    const [row = {}] = await this.entries.aggregate([
      { $match: accountingFilter(query) },
      {
        $group: {
          _id: null,
          income: sumIf(isType('income')),
          expense: sumIf(isType('expense')),
          count: { $sum: 1 },
          bookingGross: sumIf(isBookingIncome),
          bookingCount: sumIf(isBookingIncome, 1 as any),
          bookingFees: sumIf(isBookingIncome, '$platformFee'),
          bookingExpert: sumIf(isBookingIncome, '$expertAmount'),
          refunds: sumIf(isRefund),
          refundFees: sumIf(isRefund, '$platformFee'),
          refundExpert: sumIf(isRefund, '$expertAmount'),
          payouts: sumIf(isPayout),
        },
      },
    ]);
    const n = (key: string) => Number((row as any)[key] || 0);
    const income = n('income');
    const expense = n('expense');
    const platformRevenue = n('bookingFees') - n('refundFees');
    const expertEarnings = n('bookingExpert') - n('refundExpert');
    const otherIncome = income - n('bookingGross');
    // Refunds and expert payouts are pass-through cash, not operating costs.
    const operatingExpense = expense - n('refunds') - n('payouts');
    return {
      income,
      expense,
      balance: income - expense,
      count: n('count'),
      currency: 'VND',
      booking: {
        count: n('bookingCount'),
        gross: n('bookingGross'),
        refunds: n('refunds'),
        platformRevenue,
        expertEarnings,
        expertPayouts: n('payouts'),
        expertPayable: expertEarnings - n('payouts'),
      },
      otherIncome,
      operatingExpense,
      profit: platformRevenue + otherIncome - operatingExpense,
    };
  }

  async create(data: AccountingEntryDto, actor: string) {
    accountingFilter({ start: data.date });
    if (
      !actor ||
      !['income', 'expense'].includes(data.type) ||
      !Number.isSafeInteger(data.amount) ||
      data.amount <= 0 ||
      data.amount > 1_000_000_000_000
    )
      throw new Error('Thông tin thu chi không hợp lệ.');
    if (
      ![data.category, data.counterparty, data.description].every(
        (v) => typeof v === 'string' && v.trim()
      )
    )
      throw new Error('Vui lòng nhập đầy đủ thông tin.');
    const entry = {
      requestId: data.requestId,
      type: data.type,
      date: data.date,
      amount: data.amount,
      category: data.category.trim(),
      counterparty: data.counterparty.trim(),
      description: data.description.trim(),
      reference: data.reference?.trim() || '',
      createdBy: actor,
    };
    try {
      return await this.entries.create(entry);
    } catch (error) {
      if (error.code !== 11000) throw error;
      const existing = (await this.entries
        .findOne({ requestId: data.requestId })
        .lean()) as any;
      if (
        !existing ||
        Object.entries(entry).some(([key, value]) => existing[key] !== value)
      )
        throw new Error('Mã yêu cầu đã được dùng cho giao dịch khác.');
      return existing;
    }
  }

  async invoice(entryId: string, actor: string) {
    const entry = (await this.entries.findById(entryId).lean()) as any;
    if (!entry || entry.type !== 'income')
      throw new Error('Chỉ lập hóa đơn cho phiếu thu đã ghi nhận.');
    const existing = await this.invoices.findOne({ entryId }).lean();
    if (existing) return existing;
    try {
      return await this.invoices.create({
        entryId,
        number: `MG-${entry.date.replace(/-/g, '')}-${randomUUID()
          .slice(0, 8)
          .toUpperCase()}`,
        date: entry.date,
        amount: entry.amount,
        counterparty: entry.counterparty,
        description: entry.description,
        createdBy: actor,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const invoice = await this.invoices.findOne({ entryId }).lean();
      if (!invoice) throw error;
      return invoice;
    }
  }

  async listInvoices(query: AccountingQueryDto) {
    const filter = accountingFilter({ start: query.start, end: query.end });
    const [items, total] = await Promise.all([
      this.invoices.find(filter).sort({ createdAt: -1 }).limit(1000).lean(),
      this.invoices.countDocuments(filter),
    ]);
    return { items, total, truncated: total > items.length };
  }
}

@Controller()
export class AccountingRpcController {
  constructor(private service: AccountingService) {}
  private async result(run: () => Promise<any>) {
    try {
      return { data: await run(), statusCode: 200 };
    } catch (error) {
      return { data: null, statusCode: 400, message: error.message };
    }
  }
  @MessagePattern(ACCOUNTING.LIST) list(@Payload() payload: any) {
    return this.result(() => this.service.list(payload.data));
  }
  @MessagePattern(ACCOUNTING.SUMMARY) summary(@Payload() payload: any) {
    return this.result(() => this.service.summary(payload.data));
  }
  @MessagePattern(ACCOUNTING.CREATE) create(@Payload() payload: any) {
    return this.result(() => this.service.create(payload.data, payload.actor));
  }
  @MessagePattern(ACCOUNTING.INVOICES) invoices(@Payload() payload: any) {
    return this.result(() => this.service.listInvoices(payload.data));
  }
  @MessagePattern(ACCOUNTING.SYNC_BOOKINGS) syncBookings() {
    return this.result(() => this.service.syncBookings());
  }
  @MessagePattern(ACCOUNTING.CREATE_INVOICE) invoice(@Payload() payload: any) {
    return this.result(() =>
      this.service.invoice(payload.data.entryId, payload.actor)
    );
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AccountingEntry', schema: EntrySchema },
      { name: 'AccountingInvoice', schema: InvoiceSchema },
      ReverseDestination,
    ]),
  ],
  controllers: [AccountingRpcController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
