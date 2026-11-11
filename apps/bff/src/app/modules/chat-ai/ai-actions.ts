/**
 * The member assistant can attach buttons (internal links) and expert cards to its answer.
 * Everything coming back from the AI service is re-validated here before it reaches the browser.
 */
export interface MemberAiLinkAction {
  type: 'link';
  label: string;
  href: string;
}

export interface MemberAiExpert {
  id: string;
  name: string;
  major?: string;
  teachAt?: string;
  level?: string;
  price?: number;
  avatar?: string;
  matchReason?: string;
}

export interface MemberAiExpertsAction {
  type: 'experts';
  experts: MemberAiExpert[];
}

export type MemberAiAction = MemberAiLinkAction | MemberAiExpertsAction;

const ALLOWED_PATHS = ['/quiz', '/quiz-history', '/my-bookings', '/experts', '/choose-schedule', '/hold-slot', '/blog', '/contact', '/messages'];
const OBJECT_ID = /^[a-f0-9]{24}$/;

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : undefined;

/** Same-origin path on an allow-listed page; rejects protocol-relative, absolute and script URLs. */
export function safeInternalHref(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 300) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  let url: URL;
  try {
    url = new URL(value, 'https://majorguide.local');
  } catch {
    return null;
  }
  if (url.origin !== 'https://majorguide.local') return null;
  const allowed = ALLOWED_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
  return allowed ? `${url.pathname}${url.search}` : null;
}

function safeAvatar(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString().slice(0, 500) : undefined;
  } catch {
    return undefined;
  }
}

export function sanitizeMemberActions(actions: unknown): MemberAiAction[] {
  if (!Array.isArray(actions)) return [];
  const result: MemberAiAction[] = [];
  for (const action of actions.slice(0, 8)) {
    if (!action || typeof action !== 'object') continue;
    const item = action as Record<string, unknown>;
    if (item['type'] === 'link') {
      const href = safeInternalHref(item['href']);
      const label = text(item['label'], 80);
      if (href && label) result.push({ type: 'link', label, href });
    } else if (item['type'] === 'experts' && Array.isArray(item['experts'])) {
      const experts = item['experts']
        .slice(0, 6)
        .filter((expert: any) => expert && OBJECT_ID.test(String(expert.id)))
        .map((expert: any) => ({
          id: String(expert.id),
          name: text(expert.name, 120) || 'Chuyên gia',
          major: text(expert.major, 160),
          teachAt: text(expert.teachAt, 160),
          level: text(expert.level, 80),
          price: Number.isFinite(Number(expert.price)) ? Number(expert.price) : undefined,
          avatar: safeAvatar(expert.avatar),
          matchReason: text(expert.matchReason, 240),
        }));
      if (experts.length) result.push({ type: 'experts', experts });
    }
  }
  return result.slice(0, 6);
}
