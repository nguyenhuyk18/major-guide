import { STATUS_BOOKING } from '@common/constant/enum/status_slot.contant';

/** Who is asking. The BFF fills this from the verified token, never from the request body. */
export interface BookingOverviewViewer {
  role: 'admin' | 'expert' | 'member';
  userId: string;
}

export interface BookingOverviewRequest extends BookingOverviewViewer {
  scope?: 'upcoming' | 'recent';
  limit?: number;
}

/** Today in Vietnam as YYYY-MM-DD, the format `day_support` is stored in. */
export function vietnamToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Mongo filter that limits rows to what this viewer owns (admins see everything). */
export function ownerFilter(viewer: BookingOverviewViewer): Record<string, string> {
  if (viewer.role === 'admin') return {};
  if (!viewer.userId) throw new Error('Missing user id');
  return viewer.role === 'expert' ? { id_expert: viewer.userId } : { id_member: viewer.userId };
}

export function overviewQuery(request: BookingOverviewRequest, now = new Date()) {
  const owner = ownerFilter(request);
  const limit = Math.min(Math.max(Number(request.limit) || 10, 1), 20);
  if (request.scope === 'recent') {
    return { filter: owner, sort: { createdAt: -1 } as Record<string, 1 | -1>, limit };
  }
  // Upcoming: today onwards. Members also see slots they hold but have not paid yet.
  const statuses = request.role === 'member'
    ? [STATUS_BOOKING.PAIED, STATUS_BOOKING.RESERVED]
    : [STATUS_BOOKING.PAIED];
  return {
    filter: { ...owner, day_support: { $gte: vietnamToday(now) }, status: { $in: statuses } },
    sort: { day_support: 1, time_start: 1 } as Record<string, 1 | -1>,
    limit,
  };
}

const STATUS_LABEL: Record<string, string> = {
  [STATUS_BOOKING.PAIED]: 'Đã thanh toán',
  [STATUS_BOOKING.RESERVED]: 'Đang giữ chỗ, chờ thanh toán',
  [STATUS_BOOKING.CANCLE]: 'Đã huỷ',
  [STATUS_BOOKING.FAILED]: 'Thanh toán thất bại',
};

function clock(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Row shape for the AI assistant: no payment ids, session ids or links, and contact data only for admins. */
export function toOverviewRow(booking: any, viewer: BookingOverviewViewer) {
  return {
    bookingId: booking.id_reverse,
    day: booking.day_support,
    start: clock(booking.time_start),
    end: clock(booking.time_end),
    status: booking.status,
    statusLabel: STATUS_LABEL[booking.status] || booking.status,
    expertName: booking.name_expert || null,
    ...(viewer.role !== 'member' ? { memberName: booking.name_customer || null } : {}),
    ...(viewer.role === 'admin' ? { memberEmail: booking.email_customer || null } : {}),
    price: booking.price_support ?? null,
    note: booking.note ? String(booking.note).slice(0, 200) : null,
    bookedAt: booking.createdAt || null,
    paidAt: booking.payment_date || null,
    paymentExpiresAt: booking.status === STATUS_BOOKING.RESERVED ? booking.payment_expires_at || null : null,
    isDemo: Boolean(booking.is_demo),
  };
}
