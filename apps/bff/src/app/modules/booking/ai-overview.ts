/**
 * Older bookings were saved without the member/expert names. Fill them in from the
 * user records so the assistant can answer "who just booked", then drop the internal ids.
 */
export interface OverviewRow {
  memberId?: string | null;
  expertId?: string | null;
  memberName?: string | null;
  memberEmail?: string | null;
  expertName?: string | null;
  [key: string]: unknown;
}

export function idsMissingNames(rows: OverviewRow[], role: string): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row.expertName && row.expertId) ids.add(row.expertId);
    if (role !== 'member' && !row.memberName && row.memberId) ids.add(row.memberId);
  }
  return [...ids];
}

export function withNames(rows: OverviewRow[], users: Record<string, any>, role: string) {
  return rows.map(({ memberId, expertId, memberName, memberEmail, ...row }) => {
    const member = memberId ? users[memberId] : undefined;
    const expert = expertId ? users[expertId] : undefined;
    // Contact fields are rebuilt per role, so nothing upstream can widen what a role sees.
    const filled: OverviewRow = { ...row, expertName: row.expertName || expert?.name || null };
    if (role !== 'member') filled.memberName = memberName || member?.name || null;
    if (role === 'admin') filled.memberEmail = memberEmail || member?.email || null;
    return filled;
  });
}
