/**
 * Matches experts to a career-test result.
 *
 * Each expert advises on up to 3 career families (expertProfile.careerFamilies). Experts
 * created before that field existed get families inferred from their major / workplace /
 * bio text, so every expert can be matched without manual data entry.
 *
 * Ranking: an expert scores weight(rank of the student's family) x similarity, keeping the
 * best pair. Same family = 1. A different family counts only when the two families have a
 * similar Holland profile (Pearson r of their RIASEC vectors >= RELATED_MIN), scaled down
 * so an exact match always wins.
 */
import { CAREER_FAMILY_CODES, MAX_EXPERT_CAREER_FAMILIES } from '@common/constant/enum/career-family.constant';
import { CAREER_FAMILIES, RIASEC_LABELS } from './career-families';

const SCALES = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
const RANK_WEIGHTS = [1, 0.75, 0.55];
const RELATED_MIN = 0.5;
const RELATED_SCALE = 0.45;
const MAJOR_WEIGHT = 3;

/** Keywords (lower case, no diacritics) that signal a family in an expert's profile text. */
const KEYWORDS: Record<string, string[]> = {
  it_software: ['cong nghe thong tin', 'cntt', 'khoa hoc may tinh', 'phan mem', 'lap trinh', 'he thong thong tin', 'khoa hoc du lieu', 'tri tue nhan tao', 'an toan thong tin', 'an ninh mang', 'developer', 'software'],
  engineering: ['ky thuat', 'co khi', 'dien tu', 'tu dong hoa', 'co dien tu', 'o to', 'ky su', 'nang luong', 'hang khong'],
  architecture_construction: ['kien truc', 'xay dung', 'quy hoach', 'noi that', 'cong trinh'],
  business_management: ['quan tri', 'kinh doanh', 'khoi nghiep', 'nhan su', 'logistics', 'chuoi cung ung', 'thuong mai', 'doanh nhan', 'giam doc', 'ceo'],
  marketing_communication: ['marketing', 'truyen thong', 'quan he cong chung', 'pr', 'bao chi', 'thuong hieu', 'quang cao', 'su kien', 'content'],
  finance_economics: ['tai chinh', 'ke toan', 'kiem toan', 'kinh te', 'ngan hang', 'dau tu', 'chung khoan'],
  arts_design: ['nghe thuat', 'thiet ke', 'do hoa', 'my thuat', 'am nhac', 'dien anh', 'nhiep anh', 'hoi hoa', 'thoi trang', 'design'],
  humanities_language: ['ngon ngu', 'ngoai ngu', 'tieng anh', 'tieng nhat', 'tieng han', 'tieng trung', 'van hoc', 'lich su', 'triet hoc', 'bien phien dich', 'nhan van'],
  psychology_counseling: ['tam ly', 'tham van', 'tri lieu'],
  education: ['giao duc', 'giao vien', 'su pham', 'giang vien', 'giang day', 'day hoc'],
  social_work: ['xa hoi hoc', 'cong tac xa hoi', 'phat trien cong dong', 'nhan dao'],
  law_public: ['luat', 'luat su', 'phap ly', 'phap luat', 'hanh chinh', 'chinh tri', 'quan he quoc te', 'cong an', 'toa an'],
  health_medicine: ['y khoa', 'y te', 'y hoc', 'bac si', 'duoc si', 'duoc hoc', 'dieu duong', 'nha khoa', 'rang ham mat', 'benh vien', 'dinh duong'],
  life_sciences: ['sinh hoc', 'cong nghe sinh hoc', 'moi truong', 'nong nghiep', 'thuy san', 'thu y', 'cong nghe thuc pham'],
  physical_sciences_math: ['toan hoc', 'giao vien toan', 'toan ung dung', 'vat ly', 'hoa hoc', 'thong ke', 'khoa hoc tu nhien', 'thien van', 'dia chat'],
  hospitality_tourism: ['du lich', 'khach san', 'nha hang', 'lu hanh', 'am thuc', 'dau bep', 'hang khong dan dung'],
  sports_fitness: ['the thao', 'the duc', 'huan luyen vien', 'gym', 'bong da', 'van dong'],
};

const FAMILY = new Map(CAREER_FAMILIES.map((family) => [family.code, family]));

export function normalizeText(text: string | undefined | null): string {
  return ` ${(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

/** Families an expert most likely advises on: the major counts 3x, workplace / bio text adds secondary families. */
export function inferCareerFamilies(major?: string, ...otherTexts: (string | undefined)[]): string[] {
  const majorText = normalizeText(major);
  const otherText = normalizeText(otherTexts.filter(Boolean).join(' '));
  const scores = Object.entries(KEYWORDS)
    .map(([code, words]) => {
      const hits = (text: string) => words.filter((word) => text.includes(` ${word} `)).length;
      return { code, score: MAJOR_WEIGHT * hits(majorText) + hits(otherText) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scores.length) return [];
  const best = scores[0].score;
  return scores
    .filter((item) => item.score >= best / 4)
    .slice(0, MAX_EXPERT_CAREER_FAMILIES)
    .map((item) => item.code);
}

/** Keeps known codes only, without duplicates, at most MAX_EXPERT_CAREER_FAMILIES. */
export function cleanCareerFamilies(codes: unknown): string[] {
  if (!Array.isArray(codes)) return [];
  const known = new Set<string>(CAREER_FAMILY_CODES);
  return [...new Set(codes.filter((code): code is string => typeof code === 'string' && known.has(code)))].slice(
    0,
    MAX_EXPERT_CAREER_FAMILIES
  );
}

function pearson(a: string, b: string): number {
  const x = SCALES.map((s) => FAMILY.get(a)!.riasec[s]);
  const y = SCALES.map((s) => FAMILY.get(b)!.riasec[s]);
  const mx = x.reduce((sum, v) => sum + v, 0) / x.length;
  const my = y.reduce((sum, v) => sum + v, 0) / y.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  x.forEach((v, i) => {
    num += (v - mx) * (y[i] - my);
    dx += (v - mx) ** 2;
    dy += (y[i] - my) ** 2;
  });
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

/** Similarity of two families in [0, 1]: 1 for the same family, 0 when unrelated. */
export function familySimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!FAMILY.has(a) || !FAMILY.has(b)) return 0;
  const r = pearson(a, b);
  return r >= RELATED_MIN ? RELATED_SCALE * r : 0;
}

const topScales = (code: string) =>
  [...SCALES].sort((p, q) => FAMILY.get(code)!.riasec[q] - FAMILY.get(code)!.riasec[p]).slice(0, 2);

export type ExpertRecord = {
  _id: any;
  name?: string;
  fileAvartarUrl?: string;
  expertProfile?: {
    major?: string;
    teachAt?: string;
    information?: string;
    level?: string;
    price?: number;
    careerFamilies?: string[];
  };
};

export type ExpertRecommendation = {
  id: string;
  name: string;
  avatar?: string;
  major?: string;
  teachAt?: string;
  level?: string;
  price?: number;
  families: { code: string; name: string }[];
  familiesInferred: boolean;
  matchType: 'exact' | 'related';
  matchedGroup: { rank: number; code: string; name: string };
  /** The expert's own family that produced the match. */
  expertFamily: { code: string; name: string };
  score: number;
  reason: string;
};

/** Experts best suited to a student whose top families are `studentFamilies` (best first). */
export function rankExperts(studentFamilies: string[], experts: ExpertRecord[], limit = 4): ExpertRecommendation[] {
  const targets = studentFamilies.filter((code) => FAMILY.has(code)).slice(0, RANK_WEIGHTS.length);
  const ranked: ExpertRecommendation[] = [];
  for (const expert of experts) {
    const profile = expert.expertProfile ?? {};
    const stored = cleanCareerFamilies(profile.careerFamilies);
    const families = stored.length ? stored : inferCareerFamilies(profile.major, profile.teachAt, profile.information);
    let best: { score: number; rank: number; target: string; own: string } | null = null;
    targets.forEach((target, index) => {
      for (const own of families) {
        const score = RANK_WEIGHTS[index] * familySimilarity(target, own);
        if (score > 0 && (!best || score > best.score)) best = { score, rank: index + 1, target, own };
      }
    });
    if (!best) continue;
    const match = best as { score: number; rank: number; target: string; own: string };
    const targetName = FAMILY.get(match.target)!.name;
    const exact = match.target === match.own;
    const shared = topScales(match.target).filter((s) => topScales(match.own).includes(s));
    ranked.push({
      id: String(expert._id),
      name: expert.name ?? 'Chuyên gia',
      avatar: expert.fileAvartarUrl,
      major: profile.major,
      teachAt: profile.teachAt,
      level: profile.level,
      price: profile.price,
      families: families.map((code) => ({ code, name: FAMILY.get(code)!.name })),
      familiesInferred: !stored.length,
      matchType: exact ? 'exact' : 'related',
      matchedGroup: { rank: match.rank, code: match.target, name: targetName },
      expertFamily: { code: match.own, name: FAMILY.get(match.own)!.name },
      score: Math.round(match.score * 100) / 100,
      reason: exact
        ? `Chuyên môn đúng nhóm ngành #${match.rank} của bạn: ${targetName}.`
        : `Chuyên môn ${FAMILY.get(match.own)!.name} gần với nhóm #${match.rank} ${targetName}` +
          (shared.length ? ` (cùng thiên hướng ${shared.map((s) => RIASEC_LABELS[s]).join(', ')}).` : '.'),
    });
  }
  return ranked.sort((a, b) => b.score - a.score || (a.price ?? 0) - (b.price ?? 0)).slice(0, limit);
}
