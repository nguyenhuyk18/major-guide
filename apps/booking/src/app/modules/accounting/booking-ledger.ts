// Ledger rules for consultation bookings.
// A member pays `price_support` (owed to the expert) + platform fee (MajorGuide revenue).
export const BOOKING_CATEGORY = 'Thanh toán lịch tư vấn';
export const REFUND_CATEGORY = 'Hoàn tiền lịch tư vấn';
export const PAYOUT_CATEGORY = 'Chi trả chuyên gia';
export const SYSTEM_ACTOR = 'system:booking';

export const DEFAULT_PLATFORM_FEE = 45000;

export type BookingAmounts = {
  amountPaid: number;
  platformFee: number;
  expertAmount: number;
};

/**
 * Amounts actually charged for a booking. Uses the snapshot stored at payment
 * time and only falls back to the current fee for bookings paid before the
 * snapshot existed.
 */
export function bookingAmounts(
  booking: { price_support?: number; amount_paid?: number; platform_fee?: number },
  defaultPlatformFee = DEFAULT_PLATFORM_FEE
): BookingAmounts {
  const expertAmount = Math.max(0, Math.round(Number(booking.price_support || 0)));
  const platformFee = Number.isFinite(Number(booking.platform_fee)) && booking.platform_fee != null
    ? Math.round(Number(booking.platform_fee))
    : Math.round(defaultPlatformFee);
  const amountPaid = booking.amount_paid != null && Number(booking.amount_paid) > 0
    ? Math.round(Number(booking.amount_paid))
    : expertAmount + platformFee;
  return { amountPaid, platformFee: amountPaid - expertAmount, expertAmount };
}

/** Calendar date (YYYY-MM-DD) in Vietnam time. */
export function vnDate(value: Date | string | undefined) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(value ? new Date(value) : new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
