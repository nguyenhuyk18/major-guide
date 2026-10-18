/**
 * Academic fit of each career family from the student's subject scores.
 * TypeScript port of agentic-ai/ml/career/academic.py — keep both in sync; the
 * parity test (academic.spec.ts) checks this file against vectors exported by Python.
 */
import { ACADEMIC_REFERENCE } from './academic-reference';

export type ScoreSource = 'thi_thu' | 'hoc_ba';
export type AcademicInput = {
  source: ScoreSource;
  scores: Record<string, number>;
};
export type FamilyAcademicFit = {
  fit: number;
  combo: string | null;
  total: number | null;
  percentile: number | null;
};

const REF = ACADEMIC_REFERENCE as unknown as {
  subjects: Record<string, string>;
  combinations: Record<string, string[]>;
  families: Record<string, { combos: string[]; core: string[]; aptitude?: boolean }>;
  absWeight: Record<ScoreSource, number>;
  coreWeight: number;
  gamma: number;
  quantiles: Record<string, number[]>;
};

export const SUBJECTS = REF.subjects;
export const FAMILY_ACADEMICS = REF.families;
export const FUSION_GAMMA = REF.gamma;

const round = (value: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

/** Same as numpy.interp(total, quantiles, linspace(0, 1, 101)). */
export function nationalPercentile(combo: string, total: number): number {
  const q = REF.quantiles[combo];
  const last = q.length - 1;
  if (total <= q[0]) return 0;
  if (total >= q[last]) return 1;
  let j = 0;
  while (j < last && q[j + 1] <= total) j++;
  const span = q[j + 1] - q[j];
  const t = span > 0 ? (total - q[j]) / span : 0;
  return Math.min(1, Math.max(0, (j + t) / last));
}

export function comboTotals(scores: Record<string, number>) {
  const totals: Record<string, number> = {};
  for (const [code, subjects] of Object.entries(REF.combinations)) {
    if (subjects.every((s) => typeof scores[s] === 'number'))
      totals[code] = round(subjects.reduce((sum, s) => sum + scores[s], 0), 2);
  }
  return totals;
}

export function academicFit(input: AcademicInput): Record<string, FamilyAcademicFit> {
  const totals = comboTotals(input.scores);
  const present = Object.values(input.scores).filter((v) => typeof v === 'number');
  if (!Object.keys(totals).length || !present.length) return {};
  const ownMean = present.reduce((a, b) => a + b, 0) / present.length;
  const wAbs = REF.absWeight[input.source] ?? REF.absWeight.thi_thu;
  const result: Record<string, FamilyAcademicFit> = {};
  for (const [family, info] of Object.entries(REF.families)) {
    let best: string | null = null;
    for (const combo of info.combos)
      if (combo in totals && (best === null || totals[combo] > totals[best])) best = combo;
    if (!best) {
      result[family] = { fit: 0, combo: null, total: null, percentile: null };
      continue;
    }
    const pct = nationalPercentile(best, totals[best]);
    const relative = Math.min(1, Math.max(0, 0.5 + (totals[best] / 3 - ownMean) / 4));
    let fit = wAbs * pct + (1 - wAbs) * relative;
    // Core subjects separate families that share the same best combination.
    const core = info.core.filter((s) => typeof input.scores[s] === 'number').map((s) => input.scores[s]);
    if (core.length) {
      const coreMean = core.reduce((a, b) => a + b, 0) / core.length;
      const coreStrength = Math.min(1, Math.max(0, 0.5 + (coreMean - ownMean) / 4));
      fit = (1 - REF.coreWeight) * fit + REF.coreWeight * coreStrength;
    }
    result[family] = {
      fit: round(fit, 4),
      combo: best,
      total: totals[best],
      percentile: round(pct, 4),
    };
  }
  return result;
}

/** p(f) ∝ P_interest(f) · exp(γ · (fit(f) − 0.5)); aptitude families use γ/2. */
export function fuse(interest: Record<string, number>, fits: Record<string, FamilyAcademicFit>) {
  const logits: Record<string, number> = {};
  for (const [family, p] of Object.entries(interest)) {
    const fit = fits[family];
    const gamma = FAMILY_ACADEMICS[family]?.aptitude ? FUSION_GAMMA / 2 : FUSION_GAMMA;
    logits[family] = Math.log(Math.max(p, 1e-12)) + (fit ? gamma * (fit.fit - 0.5) : 0);
  }
  const max = Math.max(...Object.values(logits));
  const exp = Object.fromEntries(Object.entries(logits).map(([f, z]) => [f, Math.exp(z - max)]));
  const sum = Object.values(exp).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(exp).map(([f, v]) => [f, v / sum]));
}

export function validateAcademic(input: any): AcademicInput {
  const source = input?.source === 'hoc_ba' ? 'hoc_ba' : input?.source === 'thi_thu' ? 'thi_thu' : null;
  if (!source) throw new Error('Nguồn điểm phải là "thi_thu" hoặc "hoc_ba"');
  const scores: Record<string, number> = {};
  for (const [subject, raw] of Object.entries(input?.scores || {})) {
    if (!(subject in REF.subjects)) throw new Error(`Môn học không hợp lệ: ${subject}`);
    if (raw === null || raw === '' || raw === undefined) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 10)
      throw new Error(`Điểm ${REF.subjects[subject]} phải từ 0 đến 10`);
    scores[subject] = round(value, 2);
  }
  if (Object.keys(scores).length && !Object.keys(comboTotals(scores)).length)
    throw new Error('Cần nhập đủ 3 môn của ít nhất một tổ hợp (ví dụ Toán, Văn, Anh)');
  return { source, scores };
}
