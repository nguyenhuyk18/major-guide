import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CareerAssessmentRepository } from './career-assessment.repository';
import {
  BankQuestion,
  CAREER_PROFILES,
  CareerProfile,
  QUESTION_BANK,
} from './career-assessment.data';
import { CAREER_FAMILIES, RIASEC_LABELS } from './career-families';
import {
  AcademicInput,
  FAMILY_ACADEMICS,
  SUBJECTS,
  academicFit,
  fuse,
  validateAcademic,
} from './academic';
import { ACADEMIC_REFERENCE } from './academic-reference';

const ACADEMIC_COMBINATIONS = ACADEMIC_REFERENCE.combinations as unknown as Record<
  string,
  string[]
>;
import {
  CareerModelClient,
  CareerModelScore,
  InterestAnswers,
} from './career-model.client';

const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'];

// Subject areas that support each RIASEC interest (used to check whether interests
// and grades point the same way).
const SUBJECT_AREAS: Record<string, { label: string; subjects: string[] }> = {
  science: { label: 'khối tự nhiên (Toán, Lý, Hóa, Sinh)', subjects: ['toan', 'vat_li', 'hoa_hoc', 'sinh_hoc'] },
  social: { label: 'khối xã hội (Văn, Sử, Địa)', subjects: ['ngu_van', 'lich_su', 'dia_li'] },
  economics: { label: 'Toán và Tiếng Anh', subjects: ['toan', 'ngoai_ngu'] },
  language: { label: 'Văn và Tiếng Anh', subjects: ['ngu_van', 'ngoai_ngu'] },
};
const SCALE_AREA: Record<string, string> = {
  R: 'science',
  I: 'science',
  A: 'language',
  S: 'social',
  E: 'economics',
  C: 'economics',
};

// Current test: a fixed set of 30 interest items, 5 per RIASEC scale, interleaved
// R, I, A, S, E, C so consecutive questions cover different interests. The ML
// simulation (agentic-ai/ml/README.md, section 7) showed that balanced coverage
// is as accurate as adaptive selection, and a fixed set lets users navigate freely.
export const FIXED_VERSION = 'career-v6';
const ITEMS_PER_SCALE = 5;
export const FIXED_QUESTION_CODES = Array.from({ length: ITEMS_PER_SCALE }, (_, i) =>
  RIASEC.map(
    (scale) =>
      QUESTION_BANK.filter((q) => q.dimension === 'interest' && q.facet === scale)[i].code
  )
).flat();
const LIKERT_OPTIONS = [
  { value: 1, label: 'Rất không thích' },
  { value: 2, label: 'Không thích' },
  { value: 3, label: 'Bình thường' },
  { value: 4, label: 'Thích' },
  { value: 5, label: 'Rất thích' },
];
// Share of the ranking driven by the ML career-family model; the remainder
// only orders careers inside a family using values and work styles.
const ML_WEIGHT = Math.min(
  0.9,
  Math.max(0, Number(process.env['CAREER_MODEL_WEIGHT'] ?? 0.8))
);

type AnswerInput = {
  code: string;
  value: number | null;
  responseTimeMs?: number;
};

@Injectable()
export class CareerAssessmentService {
  constructor(
    private readonly repository: CareerAssessmentRepository,
    private readonly careerModel?: CareerModelClient
  ) {}

  private interestAnswers(session: any): InterestAnswers {
    const grouped: InterestAnswers = Object.fromEntries(
      RIASEC.map((scale) => [scale, [] as number[]])
    );
    for (const answer of session.answers || []) {
      const question = QUESTION_BANK.find((item) => item.code === answer.code);
      if (question?.dimension === 'interest' && answer.value !== null)
        grouped[question.facet]?.push(answer.value);
    }
    return grouped;
  }

  private async modelScore(session: any) {
    return (await this.careerModel?.score(this.interestAnswers(session))) ?? null;
  }

  async start(userId: string, context: Record<string, unknown> = {}) {
    const active = await this.repository.findActive(userId, FIXED_VERSION);
    if (active) return this.toClient(active);
    const created = await this.repository.create({
      userId,
      context,
      assessmentVersion: FIXED_VERSION,
      status: 'in_progress',
      issuedQuestionCodes: FIXED_QUESTION_CODES,
      answers: [],
      rankingHistory: [],
    });
    return this.toClient(created.toObject());
  }

  async next(id: string, userId: string) {
    const session = await this.owned(id, userId);
    if (session.status === 'completed')
      return { done: true, canComplete: true, result: session.result };
    const unanswered = session.issuedQuestionCodes.find(
      (code: string) =>
        !session.answers.some((answer: any) => answer.code === code)
    );
    if (unanswered) return this.questionPayload(unanswered, session);
    if (this.canComplete(session))
      return {
        done: true,
        canComplete: true,
        progress: this.progress(session),
      };
    const question = await this.selectNext(session);
    if (!question)
      return {
        done: true,
        canComplete: session.answers.length >= 12,
        progress: this.progress(session),
      };
    const issuedQuestionCodes = [...session.issuedQuestionCodes, question.code];
    const updated = await this.repository.update(id, { issuedQuestionCodes });
    return this.questionPayload(question.code, updated);
  }

  async answer(id: string, userId: string, input: AnswerInput) {
    const session = await this.owned(id, userId);
    if (session.status !== 'in_progress')
      throw new BadRequestException('Bài đánh giá đã hoàn thành');
    if (!session.issuedQuestionCodes.includes(input.code))
      throw new BadRequestException('Câu hỏi chưa được cấp cho phiên này');
    if (
      input.value !== null &&
      (!Number.isInteger(input.value) || input.value < 1 || input.value > 5)
    )
      throw new BadRequestException('Giá trị phải từ 1 đến 5 hoặc null');
    const answers = session.answers.filter(
      (answer: any) => answer.code !== input.code
    );
    answers.push({
      code: input.code,
      value: input.value,
      responseTimeMs: Math.max(0, Number(input.responseTimeMs) || 0),
      answeredAt: new Date(),
    });
    if (this.isFixed(session)) {
      if (input.value === null)
        throw new BadRequestException('Vui lòng chọn một mức từ 1 đến 5');
      const updated = await this.repository.update(id, { answers });
      return {
        assessment: this.toClient(updated),
        canComplete: this.canComplete(updated),
      };
    }
    const scores = this.rank(
      { ...session, answers },
      await this.modelScore({ ...session, answers })
    );
    const rankingHistory = [
      ...(session.rankingHistory || []),
      scores.slice(0, 3).map((item) => item.code),
    ].slice(-3);
    const updated = await this.repository.update(id, {
      answers,
      rankingHistory,
    });
    return {
      assessment: this.toClient(updated),
      canComplete: this.canComplete(updated),
    };
  }

  /** Optional step: subject scores (thi thử or học bạ) used to adjust the result. */
  async setAcademic(id: string, userId: string, input: unknown) {
    const session = await this.owned(id, userId);
    if (session.status !== 'in_progress')
      throw new BadRequestException('Bài đánh giá đã hoàn thành');
    let academic: AcademicInput;
    try {
      academic = validateAcademic(input);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const value = Object.keys(academic.scores).length
      ? { ...academic, updatedAt: new Date() }
      : null;
    const updated = await this.repository.update(id, { academic: value } as any);
    return this.toClient(updated);
  }

  async complete(id: string, userId: string) {
    const session = await this.owned(id, userId);
    if (session.status === 'completed') return session.result;
    if (!this.canComplete(session))
      throw new BadRequestException(
        'Cần trả lời thêm câu hỏi trước khi hoàn thành'
      );
    const ml = await this.modelScore(session);
    const result = {
      ...this.buildResult(session, ml),
      careerMatch: this.careerMatch(session, ml),
    };
    await this.repository.update(id, {
      status: 'completed',
      result,
      completedAt: new Date(),
    });
    return result;
  }

  async get(id: string, userId: string) {
    return this.toClient(await this.owned(id, userId));
  }
  async history(userId: string) {
    return (await this.repository.findByUser(userId)).map((item) =>
      this.toClient(item)
    );
  }
  async feedback(
    id: string,
    userId: string,
    feedback: Record<string, unknown>
  ) {
    const session = await this.owned(id, userId);
    if (session.status !== 'completed')
      throw new BadRequestException('Chỉ phản hồi sau khi hoàn thành');
    const allowed = ['helpful', 'unsure', 'not_helpful'];
    if (!allowed.includes(String(feedback.rating)))
      throw new BadRequestException('Phản hồi không hợp lệ');
    await this.repository.update(id, {
      feedback: {
        rating: feedback.rating,
        selectedGroups: Array.isArray(feedback.selectedGroups)
          ? feedback.selectedGroups.slice(0, 5)
          : [],
        note: String(feedback.note || '').slice(0, 500),
        createdAt: new Date(),
      },
    });
    return { saved: true };
  }
  async saveAiReview(id: string, userId: string, input: any) {
    const session = await this.owned(id, userId);
    if (session.status !== 'completed' || !session.result)
      throw new BadRequestException('Kết quả chưa hoàn thành');
    const allowed = new Set(
      (session.result.topGroups || []).map((item: any) => item.code)
    );
    const rankedCandidates = Array.isArray(input?.rankedCandidates)
      ? input.rankedCandidates
          .filter((item: any) => allowed.has(item.code))
          .slice(0, 5)
          .map((item: any) => ({
            code: String(item.code),
            reasoning: String(item.reasoning || '').slice(0, 600),
          }))
      : [];
    if (input?.status === 'completed' && rankedCandidates.length < 2)
      throw new BadRequestException('AI review không có bảng xếp hạng hợp lệ');
    const cleanList = (value: any, limit = 5) =>
      Array.isArray(value)
        ? value.slice(0, limit).map((item) => String(item).slice(0, 500))
        : [];
    const aiReview = {
      status: input?.status === 'completed' ? 'completed' : 'unavailable',
      provider: 'groq',
      model: String(input?.model || '').slice(0, 100),
      summary: String(input?.summary || '').slice(0, 1200),
      rankedCandidates,
      agreements: cleanList(input?.agreements),
      cautions: cleanList(input?.cautions),
      validationQuestions: cleanList(input?.validationQuestions),
      nextActions: cleanList(input?.nextActions),
      reason: String(input?.reason || '').slice(0, 120),
      reviewedAt: new Date(),
      privacy: 'anonymous_derived_signals_only',
    };
    const result = { ...session.result, aiReview };
    await this.repository.update(id, { result });
    return result;
  }

  private async owned(id: string, userId: string): Promise<any> {
    const session: any = await this.repository.findById(id);
    if (!session) throw new NotFoundException('Không tìm thấy phiên đánh giá');
    if (session.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền truy cập phiên này');
    return session;
  }

  private async selectNext(session: any): Promise<BankQuestion | undefined> {
    const best = this.selectNextByRules(session);
    if (!best || best.isCore || !this.careerModel) return best;
    // Adaptive phase: alternate rule-chosen value/style items with up to
    // ADAPTIVE_INTEREST_ITEMS interest items whose RIASEC scale is picked by the
    // ML model (largest expected reduction of uncertainty about the career family).
    const ADAPTIVE_INTEREST_ITEMS = 6;
    const issued = new Set<string>(session.issuedQuestionCodes || []);
    const adaptive = [...issued]
      .map((code) => QUESTION_BANK.find((q) => q.code === code))
      .filter((q) => q && !q.isCore);
    const adaptiveInterest = adaptive.filter((q) => q!.dimension === 'interest').length;
    const interestTurn = best.dimension === 'interest' || adaptive.length % 2 === 0;
    if (!interestTurn || adaptiveInterest >= ADAPTIVE_INTEREST_ITEMS) return best;
    const openByScale = (scale: string) =>
      QUESTION_BANK.find(
        (q) => q.dimension === 'interest' && q.facet === scale && !issued.has(q.code)
      );
    const allowed = RIASEC.filter((scale) => openByScale(scale));
    const scale = await this.careerModel.nextScale(
      this.interestAnswers(session),
      allowed
    );
    return (scale && openByScale(scale)) || best;
  }

  private selectNextByRules(session: any): BankQuestion | undefined {
    const issued = new Set(session.issuedQuestionCodes || []);
    const core = QUESTION_BANK.filter(
      (question) => question.isCore && !issued.has(question.code)
    );
    if (core.length) return core[0];
    const top = this.rank(session)
      .slice(0, 3)
      .map(
        (item) => CAREER_PROFILES.find((profile) => profile.code === item.code)!
      );
    const counts: Record<string, number> = {};
    for (const answer of session.answers || []) {
      const question = QUESTION_BANK.find((item) => item.code === answer.code);
      if (question && answer.value !== null)
        counts[`${question.dimension}:${question.facet}`] =
          (counts[`${question.dimension}:${question.facet}`] || 0) + 1;
    }
    return QUESTION_BANK.filter((question) => !issued.has(question.code)).sort(
      (a, b) =>
        this.informationScore(b, top, counts) -
        this.informationScore(a, top, counts)
    )[0];
  }

  private informationScore(
    question: BankQuestion,
    top: CareerProfile[],
    counts: Record<string, number>
  ) {
    const values = top.map((profile) => this.profileValue(profile, question));
    const mean =
      values.reduce((sum, value) => sum + value, 0) /
      Math.max(values.length, 1);
    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(values.length, 1);
    const count = counts[`${question.dimension}:${question.facet}`] || 0;
    const familyBonus =
      question.dimension === 'workValue'
        ? 0.025
        : question.dimension === 'workStyle'
        ? 0.02
        : 0;
    return variance + familyBonus + 0.04 / (count + 1);
  }

  private profileValue(profile: CareerProfile, question: BankQuestion) {
    return question.dimension === 'interest'
      ? profile.interests[question.facet]
      : question.dimension === 'workValue'
      ? profile.values[question.facet]
      : profile.styles[question.facet];
  }

  private vectors(session: any) {
    const grouped: Record<string, number[]> = {};
    for (const answer of session.answers || []) {
      const question = QUESTION_BANK.find((item) => item.code === answer.code);
      if (!question || answer.value === null) continue;
      const key = `${question.dimension}:${question.facet}`;
      grouped[key] ||= [];
      grouped[key].push((answer.value - 1) / 4);
    }
    const values = (dimension: string, facets: string[]) =>
      Object.fromEntries(
        facets
          .map((facet) => {
            const list = grouped[`${dimension}:${facet}`] || [];
            return list.length
              ? [facet, list.reduce((a, b) => a + b, 0) / list.length]
              : null;
          })
          .filter(Boolean) as [string, number][]
      );
    return {
      interests: values('interest', ['R', 'I', 'A', 'S', 'E', 'C']),
      values: values('workValue', [
        'achievement',
        'independence',
        'relationships',
        'support',
        'recognition',
        'workingConditions',
      ]),
      styles: values('workStyle', [
        'analytical',
        'creative',
        'communication',
        'organization',
        'persistence',
        'detail',
        'adaptability',
      ]),
      grouped,
    };
  }

  private cosine(a: Record<string, number>, b: Record<string, number>) {
    const keys = Object.keys(a);
    const dot = keys.reduce((s, k) => s + a[k] * (b[k] ?? 0.5), 0);
    const na = Math.sqrt(keys.reduce((s, k) => s + a[k] ** 2, 0));
    const nb = Math.sqrt(keys.reduce((s, k) => s + (b[k] ?? 0.5) ** 2, 0));
    return na && nb ? dot / (na * nb) : 0;
  }
  private rank(session: any, ml: CareerModelScore | null = null) {
    const v = this.vectors(session);
    return CAREER_PROFILES.map((profile) => {
      const parts = [
        {
          key: 'interests',
          weight: 0.6,
          user: v.interests,
          target: profile.interests,
        },
        { key: 'values', weight: 0.25, user: v.values, target: profile.values },
        { key: 'styles', weight: 0.15, user: v.styles, target: profile.styles },
      ].filter((part) => Object.keys(part.user).length > 0);
      const weight = parts.reduce((sum, part) => sum + part.weight, 0) || 1;
      const signals = Object.fromEntries(
        parts.map((part) => [
          part.key,
          Number((this.cosine(part.user, part.target) * 100).toFixed(0)),
        ])
      );
      const ruleScore =
        parts.reduce(
          (sum, part) => sum + part.weight * this.cosine(part.user, part.target),
          0
        ) / weight;
      const mlScore = ml?.profiles?.[profile.code];
      if (typeof mlScore === 'number') signals['ml'] = Math.round(mlScore * 100);
      return {
        code: profile.code,
        name: profile.name,
        // ML reweights the rule score: a profile whose career family is the most
        // likely keeps its full score, an unlikely family loses up to ML_WEIGHT.
        score:
          typeof mlScore === 'number'
            ? ruleScore * (1 - ML_WEIGHT + ML_WEIGHT * mlScore)
            : ruleScore,
        ruleScore,
        signals,
      };
    }).sort((a, b) => b.score - a.score);
  }
  private isFixed(session: any) {
    return session.assessmentVersion === FIXED_VERSION;
  }

  private unansweredCodes(session: any): string[] {
    const answered = new Set(
      (session.answers || [])
        .filter((a: any) => a.value !== null)
        .map((a: any) => a.code)
    );
    return (session.issuedQuestionCodes || []).filter((code: string) => !answered.has(code));
  }

  /** Main result: the 3 most suitable career families with a plain explanation. */
  careerMatch(session: any, ml: CareerModelScore | null) {
    const interests = this.vectors(session).interests as Record<string, number>;
    const score = (scale: string) => Math.round((interests[scale] ?? 0) * 100);
    const riasec = Object.fromEntries(RIASEC.map((scale) => [scale, score(scale)]));
    const riasecCode = [...RIASEC]
      .sort((a, b) => (interests[b] ?? 0) - (interests[a] ?? 0))
      .slice(0, 3)
      .join('');

    // 1) Interest: ML probabilities, or a softmax over profile similarity as fallback.
    let interestProb: Record<string, number>;
    if (ml) {
      interestProb = Object.fromEntries(ml.families.map((f) => [f.code, f.probability]));
    } else {
      const sims = CAREER_FAMILIES.map((f) => [f.code, this.cosine(interests, f.riasec)] as const);
      const max = Math.max(...sims.map(([, s]) => s));
      const exp = sims.map(([code, s]) => [code, Math.exp((s - max) * 20)] as const);
      const sum = exp.reduce((acc, [, v]) => acc + v, 0);
      interestProb = Object.fromEntries(exp.map(([code, v]) => [code, v / sum]));
    }

    // 2) Grades: academic fit per family, fused log-linearly with the interest part.
    const academic: AcademicInput | null =
      session.academic && Object.keys(session.academic.scores || {}).length
        ? session.academic
        : null;
    const fits = academic ? academicFit(academic) : {};
    const finalProb =
      academic && Object.keys(fits).length ? fuse(interestProb, fits) : interestProb;

    const fitLevels = ['Phù hợp nhất', 'Rất phù hợp', 'Phù hợp'];
    const subjectNames = (codes: string[]) => codes.map((c) => SUBJECTS[c]).join(', ');
    const groups = Object.entries(finalProb)
      .sort((a, b) => b[1] - a[1])
      .map(([code, probability]) => ({
        code,
        probability,
        family: CAREER_FAMILIES.find((f) => f.code === code),
      }))
      .filter((entry) => entry.family)
      .slice(0, 3)
      .map(({ code, probability, family }, index) => {
        const info = family!;
        const drivers = RIASEC.filter((s) => (interests[s] ?? 0) >= 0.5)
          .sort(
            (a, b) =>
              (interests[b] ?? 0) * info.riasec[b as 'R'] -
              (interests[a] ?? 0) * info.riasec[a as 'R']
          )
          .slice(0, 2);
        const gap = RIASEC.filter(
          (s) => info.riasec[s as 'R'] >= 0.75 && (interests[s] ?? 0) < 0.45
        )[0];
        const label = (s: string) => `${RIASEC_LABELS[s]} (${score(s)}/100)`;
        const why = drivers.length
          ? `Bạn có điểm sở thích cao ở ${drivers.map(label).join(' và ')}. Đây cũng là ${
              drivers.length === 2 ? 'hai nhóm' : 'nhóm'
            } sở thích nổi bật của những người theo học ${info.name}.`
          : `Các nhóm sở thích của bạn khá cân bằng; ${info.name} là hướng có hồ sơ gần với bạn nhất.`;
        const evidence = ml
          ? ` Xét riêng sở thích, mô hình ước tính khoảng ${Math.round(
              interestProb[code] * 100
            )}% người có hồ sơ giống bạn đang theo học nhóm ngành này.`
          : '';

        // Academic part of the explanation.
        const fit = fits[code];
        const rules = FAMILY_ACADEMICS[code];
        let grades = '';
        let academicInfo: any = null;
        if (academic && fit) {
          const core = rules?.core || [];
          const strong = core.filter((s) => (academic.scores[s] ?? -1) >= 8);
          const weak = core.filter(
            (s) => typeof academic.scores[s] === 'number' && academic.scores[s] < 6.5
          );
          if (fit.combo) {
            grades = ` Về học lực, tổ hợp ${fit.combo} (${subjectNames(
              ACADEMIC_COMBINATIONS[fit.combo]
            )}) của bạn đạt ${fit.total}/30${
              academic.source === 'thi_thu' && fit.percentile !== null
                ? `, cao hơn khoảng ${Math.round(
                    fit.percentile * 100
                  )}% thí sinh thi tổ hợp này năm 2024`
                : ''
            }.`;
            if (strong.length)
              grades += ` ${subjectNames(strong)} là lợi thế cho nhóm ngành này.`;
            if (weak.length)
              grades += ` Môn trọng tâm ${subjectNames(weak)} còn thấp, bạn nên cải thiện.`;
          } else {
            grades = ` Bạn chưa nhập đủ môn của các tổ hợp xét tuyển phổ biến của nhóm ngành này (${(
              rules?.combos || []
            ).join(', ')}).`;
          }
          if (rules?.aptitude) grades += ' Ngành này thường thi thêm môn năng khiếu.';
          academicInfo = {
            percent: Math.round(fit.fit * 100),
            combo: fit.combo,
            comboSubjects: fit.combo
              ? ACADEMIC_COMBINATIONS[fit.combo].map((s) => SUBJECTS[s])
              : [],
            total: fit.total,
            nationalPercentile:
              academic.source === 'thi_thu' && fit.percentile !== null
                ? Math.round(fit.percentile * 100)
                : null,
            strongSubjects: strong.map((s) => SUBJECTS[s]),
            weakSubjects: weak.map((s) => SUBJECTS[s]),
            aptitude: Boolean(rules?.aptitude),
          };
        }

        const check = gap
          ? ` Lưu ý: nhóm ngành này thường cần sở thích ${RIASEC_LABELS[gap]}, trong khi điểm của bạn là ${score(
              gap
            )}/100. Hãy thử ${info.tryFirst} trước khi quyết định.`
          : ` Để kiểm chứng, bạn có thể ${info.tryFirst}.`;
        return {
          rank: index + 1,
          code: info.code,
          name: info.name,
          fitLevel: fitLevels[index],
          probability,
          percent: Math.round(probability * 100),
          interestPercent: Math.round(interestProb[code] * 100),
          academic: academicInfo,
          description: info.description,
          explanation: (why + evidence + grades + check).trim(),
          drivers: drivers.map((s) => ({ scale: s, label: RIASEC_LABELS[s], score: score(s) })),
          majors: info.majors,
          jobs: info.jobs,
        };
      });
    // What the top 3 would be from interests alone, to show the effect of grades.
    const interestOnly = Object.entries(interestProb)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, p]) => ({
        code,
        name: CAREER_FAMILIES.find((f) => f.code === code)?.name || code,
        percent: Math.round(p * 100),
      }));
    const rankingChanged =
      Boolean(academic) &&
      interestOnly.map((g) => g.code).join() !== groups.map((g) => g.code).join();

    return {
      source: ml ? 'ml' : 'rules',
      model: ml?.model ?? null,
      interestOnly: academic ? interestOnly : null,
      rankingChanged,
      alignment: academic ? this.interestGradeAlignment(interests, academic) : null,
      academicUsed: Boolean(academic),
      academicSource: academic?.source ?? null,
      percentMeaning: academic
        ? 'Mức phù hợp tổng hợp: sở thích (mô hình học máy) điều chỉnh theo học lực'
        : ml
        ? 'Xác suất theo mô hình học máy'
        : 'Mức phù hợp theo hồ sơ sở thích',
      riasec,
      riasecCode,
      riasecLabels: RIASEC_LABELS,
      groups,
    };
  }

  /** Do the strongest interest and the strongest subjects point the same way? */
  private interestGradeAlignment(interests: Record<string, number>, academic: AcademicInput) {
    const scores = academic.scores;
    const present = Object.values(scores);
    const ownMean = present.reduce((a, b) => a + b, 0) / present.length;
    const areaMean = (area: string) => {
      const values = SUBJECT_AREAS[area].subjects
        .filter((s) => typeof scores[s] === 'number')
        .map((s) => scores[s]);
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    };
    const round1 = (v: number) => Math.round(v * 10) / 10;
    const scale = [...RIASEC].sort((a, b) => (interests[b] ?? 0) - (interests[a] ?? 0))[0];
    const area = SCALE_AREA[scale];
    const mean = areaMean(area);
    const strongest = Object.keys(SUBJECT_AREAS)
      .map((key) => ({ key, mean: areaMean(key) }))
      .filter((a) => a.mean !== null)
      .sort((a, b) => (b.mean as number) - (a.mean as number))[0];
    const base = {
      scale,
      scaleLabel: RIASEC_LABELS[scale],
      area,
      areaLabel: SUBJECT_AREAS[area].label,
      areaMean: mean === null ? null : round1(mean),
      ownMean: round1(ownMean),
      strongestArea: strongest ? SUBJECT_AREAS[strongest.key].label : null,
    };
    if ((interests[scale] ?? 0) < 0.5 || mean === null)
      return {
        ...base,
        status: 'unclear',
        message:
          mean === null
            ? `Bạn chưa nhập điểm ${SUBJECT_AREAS[area].label}, nên chưa so được với sở thích nổi bật nhất (${RIASEC_LABELS[scale]}).`
            : 'Sở thích của bạn chưa có nhóm nào thật sự nổi bật, nên học lực đóng vai trò lớn hơn trong việc sắp xếp.',
      };
    const diff = mean - ownMean;
    if (diff >= 0.25)
      return {
        ...base,
        status: 'aligned',
        message: `Sở thích nổi bật nhất của bạn là ${RIASEC_LABELS[scale]}, và ${SUBJECT_AREAS[area].label} cũng là thế mạnh học lực của bạn (TB ${round1(mean)} so với TB chung ${round1(ownMean)}). Hai yếu tố đồng thuận nên kết quả đáng tin cậy hơn.`,
      };
    if (diff <= -0.5)
      return {
        ...base,
        status: 'mismatch',
        message: `Bạn rất thích ${RIASEC_LABELS[scale]} nhưng ${SUBJECT_AREAS[area].label} của bạn (TB ${round1(mean)}) thấp hơn mức chung (${round1(ownMean)}). Thế mạnh học lực hiện tại nằm ở ${base.strongestArea}. Hãy cân nhắc cả các ngành tận dụng thế mạnh này, hoặc đầu tư cải thiện ${SUBJECT_AREAS[area].label} nếu bạn quyết tâm theo sở thích.`,
      };
    return {
      ...base,
      status: 'neutral',
      message: `Học lực ở ${SUBJECT_AREAS[area].label} (TB ${round1(mean)}) tương đương mức chung của bạn (${round1(ownMean)}); sở thích là yếu tố chính quyết định kết quả.`,
    };
  }

  private canComplete(session: any) {
    if (this.isFixed(session)) return this.unansweredCodes(session).length === 0;
    const answered = (session.answers || []).length;
    if (answered >= 24) return true;
    if (answered < 18) return false;
    const dimensions = new Set(
      (session.answers || []).map(
        (a: any) => QUESTION_BANK.find((q) => q.code === a.code)?.dimension
      )
    );
    const history = session.rankingHistory || [];
    const stable =
      history.length === 3 &&
      history.every((row: string[]) => row.join('|') === history[0].join('|'));
    return dimensions.size === 3 && stable;
  }
  private progress(session: any) {
    if (this.isFixed(session)) {
      const total = (session.issuedQuestionCodes || []).length;
      const remaining = this.unansweredCodes(session).length;
      return { answered: total - remaining, total, remaining };
    }
    const answered = (session.answers || []).length;
    return {
      answered,
      min: 18,
      max: 24,
      remainingMin: Math.max(0, 18 - answered),
      remainingMax: Math.max(0, 24 - answered),
    };
  }
  private quality(session: any) {
    const valid = (session.answers || []).filter((a: any) => a.value !== null);
    const unique = new Set(valid.map((a: any) => a.value)).size;
    const uncertain = (session.answers || []).filter(
      (a: any) => a.value === null
    ).length;
    const straightline = valid.length >= 12 && unique === 1;
    const timings = valid
      .map((a: any) => Number(a.responseTimeMs) || 0)
      .filter((time: number) => time > 0)
      .sort((a: number, b: number) => a - b);
    const medianTime = timings.length
      ? timings[Math.floor(timings.length / 2)]
      : 0;
    const tooFast = timings.length >= 10 && medianTime < 800;
    const score = Math.max(
      0.4,
      1 -
        (straightline ? 0.35 : 0) -
        (tooFast ? 0.2 : 0) -
        Math.min(0.3, uncertain * 0.03)
    );
    return {
      score: Number(score.toFixed(2)),
      flags: [
        ...(straightline ? ['straight_lining'] : []),
        ...(tooFast ? ['too_fast'] : []),
        ...(uncertain > 5 ? ['many_uncertain'] : []),
      ],
    };
  }
  private buildResult(session: any, ml: CareerModelScore | null = null) {
    const ranking = this.rank(session, ml);
    const quality = this.quality(session);
    const valid = (session.answers || []).filter(
      (a: any) => a.value !== null
    ).length;
    const coverage = Math.min(1, valid / 18);
    const vectors = this.vectors(session);
    const topGroups = ranking.slice(0, 5).map((item, index) => {
      const profile = CAREER_PROFILES.find((p) => p.code === item.code)!;
      const matchScore = Math.round(
        item.score * coverage * quality.score * 100
      );
      return {
        ...item,
        rank: index + 1,
        matchScore,
        fitReasons: this.fitReasons(profile, vectors),
        relatedMajors: profile.relatedMajors,
        explorationActivities: profile.activities,
      };
    });
    const gap =
      topGroups.length > 1
        ? topGroups[0].matchScore - topGroups[1].matchScore
        : 100;
    const strengths = Object.entries({
      ...vectors.interests,
      ...vectors.values,
      ...vectors.styles,
    })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([facet, score]) => ({ facet, score: Math.round(score * 100) }));
    const personalProfile = this.personalize(ranking, vectors, strengths);
    const hybridPaths = this.hybridPaths(ranking);
    return {
      assessmentVersion: ml ? 'career-v5-ml' : 'career-v4',
      mlModel: this.mlSummary(ml),
      matchMeaning:
        'Mức tương hợp để khám phá, không phải độ chính xác hay kết luận cuối cùng.',
      topGroups,
      parallelTop: gap < 5,
      evidenceLevel:
        quality.score < 0.65
          ? 'exploratory'
          : coverage >= 1
          ? 'strong'
          : 'moderate',
      uncertainty: Math.round((1 - coverage * quality.score) * 100),
      responseQuality: quality,
      strengths,
      personalProfile,
      hybridPaths,
      decisionSupport: this.decisionSupport(ranking),
      preferredEnvironments: this.environmentSignals(vectors, true),
      watchOuts: this.environmentSignals(vectors, false),
      feasibility: this.feasibility(session.context),
      personalizedRoadmap: this.roadmap(topGroups, hybridPaths),
      context: session.context,
      explanation: this.fallbackExplanation(topGroups, strengths),
    };
  }
  private mlSummary(ml: CareerModelScore | null) {
    if (!ml) return { used: false };
    return {
      used: true,
      model: ml.model,
      weight: ML_WEIGHT,
      // Main result: the career families predicted by the ML model.
      topFamilies: ml.families.slice(0, 5).map((family) => {
        const profiles = CAREER_PROFILES.filter((profile) =>
          (family.profiles || []).includes(profile.code)
        );
        return {
          code: family.code,
          name: family.name,
          probability: family.probability,
          percent: Math.round(family.probability * 100),
          careers: profiles.map((profile) => profile.name),
          majors: [...new Set(profiles.flatMap((profile) => profile.relatedMajors))].slice(0, 8),
        };
      }),
    };
  }

  private fallbackExplanation(groups: any[], strengths: any[]) {
    return `Các hướng nổi bật là ${groups
      .slice(0, 3)
      .map((g) => g.name)
      .join(', ')}. Kết quả được suy ra từ những đặc điểm mạnh như ${strengths
      .slice(0, 3)
      .map((s) => s.facet)
      .join(', ')} và nên được kiểm chứng qua trải nghiệm thực tế.`;
  }
  private facetLabel(facet: string) {
    const labels: Record<string, string> = {
      R: 'thực hành',
      I: 'khám phá và nghiên cứu',
      A: 'sáng tạo',
      S: 'hỗ trợ con người',
      E: 'dẫn dắt và ảnh hưởng',
      C: 'tổ chức và chính xác',
      achievement: 'thành tựu',
      independence: 'tự chủ',
      relationships: 'quan hệ tích cực',
      support: 'sự hỗ trợ',
      recognition: 'sự ghi nhận',
      workingConditions: 'điều kiện ổn định',
      analytical: 'phân tích',
      creative: 'sáng tạo',
      communication: 'giao tiếp',
      organization: 'tổ chức',
      persistence: 'kiên trì',
      detail: 'chú ý chi tiết',
      adaptability: 'thích ứng',
    };
    return labels[facet] || facet;
  }
  private fitReasons(profile: any, vectors: any) {
    const candidates = [
      ...Object.entries(vectors.interests).map(([facet, value]) => ({
        facet,
        value: Number(value),
        target: profile.interests[facet] ?? 0.5,
      })),
      ...Object.entries(vectors.values).map(([facet, value]) => ({
        facet,
        value: Number(value),
        target: profile.values[facet] ?? 0.5,
      })),
      ...Object.entries(vectors.styles).map(([facet, value]) => ({
        facet,
        value: Number(value),
        target: profile.styles[facet] ?? 0.5,
      })),
    ];
    return candidates
      .filter((item) => item.value >= 0.55)
      .sort((a, b) => b.value * b.target - a.value * a.target)
      .slice(0, 3)
      .map((item) => ({
        facet: item.facet,
        label: this.facetLabel(item.facet),
        userScore: Math.round(item.value * 100),
        profileNeed: Math.round(item.target * 100),
        reason: `Bạn thể hiện ${this.facetLabel(
          item.facet
        )} ở mức cao, phù hợp với cách học và làm việc thường gặp trong hướng này.`,
      }));
  }
  private decisionSupport(ranking: any[]) {
    const first = CAREER_PROFILES.find(
      (profile) => profile.code === ranking[0]?.code
    );
    const second = CAREER_PROFILES.find(
      (profile) => profile.code === ranking[1]?.code
    );
    if (!first || !second) return null;
    const dimensions = [
      ...Object.keys(first.interests).map((facet) => ({
        facet,
        a: first.interests[facet],
        b: second.interests[facet],
      })),
      ...Object.keys(first.values).map((facet) => ({
        facet,
        a: first.values[facet],
        b: second.values[facet],
      })),
      ...Object.keys(first.styles).map((facet) => ({
        facet,
        a: first.styles[facet],
        b: second.styles[facet],
      })),
    ]
      .sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b))
      .slice(0, 3);
    return {
      between: [first.name, second.name],
      decisiveFactors: dimensions.map((item) => ({
        facet: item.facet,
        label: this.facetLabel(item.facet),
        leansTo: item.a > item.b ? first.name : second.name,
        question: `Trong trải nghiệm thực tế, bạn muốn ưu tiên ${this.facetLabel(
          item.facet
        )} đến mức nào?`,
      })),
    };
  }
  private environmentSignals(vectors: any, positive: boolean) {
    const entries = [
      ...Object.entries(vectors.values),
      ...Object.entries(vectors.styles),
    ].map(([facet, value]) => ({ facet, value: Number(value) }));
    return entries
      .filter((item) => (positive ? item.value >= 0.7 : item.value <= 0.3))
      .sort((a, b) => (positive ? b.value - a.value : a.value - b.value))
      .slice(0, 4)
      .map((item) =>
        positive
          ? `Môi trường đề cao ${this.facetLabel(item.facet)}`
          : `Cân nhắc môi trường đòi hỏi ${this.facetLabel(
              item.facet
            )} liên tục`
      );
  }
  private feasibility(context: any = {}) {
    const notes = [] as string[];
    if (context.strongSubjects)
      notes.push(
        `Đối chiếu các hướng trên với thế mạnh môn học bạn khai báo: ${context.strongSubjects}.`
      );
    if (context.preferredEnvironment)
      notes.push(
        `Ưu tiên kiểm chứng trong môi trường: ${context.preferredEnvironment}.`
      );
    if (context.budget)
      notes.push(
        `Khi tìm chương trình học, sử dụng mức ngân sách “${context.budget}” như một bộ lọc, không phải tiêu chí loại ngành.`
      );
    if (context.location)
      notes.push(
        `Có thể ưu tiên trường, hoạt động và chuyên gia tại ${context.location}.`
      );
    return { affectsMatchScore: false, notes };
  }
  private roadmap(groups: any[], hybridPaths: any[]) {
    const steps: any[] = [];
    if (groups[0])
      steps.push({
        step: 1,
        title: 'Thử một trải nghiệm nhỏ',
        action: groups[0].explorationActivities[0],
        forGroup: groups[0].code,
      });
    if (hybridPaths[0])
      steps.push({
        step: 2,
        title: 'Kiểm chứng hướng giao thoa',
        action: `Tìm hiểu ${hybridPaths[0].examples.join(
          ' hoặc '
        )} và ghi lại điều khiến bạn hứng thú.`,
        forGroup: hybridPaths[0].sourceGroups,
      });
    if (groups[1])
      steps.push({
        step: 3,
        title: 'So sánh bằng trải nghiệm',
        action: `Thực hiện một hoạt động của ${groups[1].name}, sau đó so sánh năng lượng và mức tò mò với hướng đầu tiên.`,
        forGroup: groups[1].code,
      });
    steps.push({
      step: steps.length + 1,
      title: 'Trao đổi với chuyên gia',
      action:
        'Mang kết quả và ghi chú trải nghiệm vào buổi tư vấn; không chỉ hỏi “nên học ngành nào”.',
    });
    return steps;
  }
  private personalize(ranking: any[], vectors: any, strengths: any[]) {
    const riasec = Object.entries(
      vectors.interests as Record<string, number>
    ).sort((a, b) => b[1] - a[1]);
    const code = riasec
      .slice(0, 3)
      .map(([facet]) => facet)
      .join('');
    const pair = code.slice(0, 2);
    const titles: Record<string, string> = {
      IA: 'Nhà khám phá sáng tạo',
      AI: 'Người sáng tạo có chiều sâu',
      IS: 'Nhà phân tích hướng con người',
      SI: 'Người đồng hành dựa trên hiểu biết',
      RC: 'Người kiến tạo thực tế có hệ thống',
      CR: 'Người vận hành chính xác',
      IE: 'Nhà chiến lược khám phá',
      EI: 'Người dẫn dắt bằng dữ liệu',
      AS: 'Người kể chuyện giàu đồng cảm',
      SA: 'Người kết nối bằng sáng tạo',
      EC: 'Người tổ chức và thúc đẩy',
      CE: 'Người vận hành định hướng kết quả',
    };
    const title = titles[pair] || 'Hồ sơ đa tiềm năng';
    return {
      riasecCode: code,
      title,
      dominantSignals: strengths.slice(0, 5),
      summary: `Bạn không bị đóng vào một khuôn duy nhất. Hồ sơ ${
        code || 'đang khám phá'
      } cho thấy sự kết hợp giữa ${strengths
        .slice(0, 3)
        .map((item) => item.facet)
        .join(', ')}. Hai hướng đang cạnh tranh mạnh nhất là ${ranking
        .slice(0, 2)
        .map((item) => item.name)
        .join(' và ')}.`,
    };
  }
  private hybridPaths(ranking: any[]) {
    const top = new Set(ranking.slice(0, 8).map((item) => item.code));
    const rules = [
      [
        ['software_it', 'design_multimedia'],
        'Sản phẩm số & UX Engineering',
        ['Frontend UX', 'Design Technologist'],
      ],
      [
        ['software_it', 'engineering_electrical'],
        'Hệ thống nhúng & IoT',
        ['IoT Engineer', 'Embedded Software'],
      ],
      [
        ['ai_data', 'business_management'],
        'Phân tích kinh doanh & sản phẩm',
        ['Business Intelligence', 'Product Analytics'],
      ],
      [
        ['ai_data', 'healthcare_biology'],
        'Tin sinh học & dữ liệu sức khỏe',
        ['Bioinformatics', 'Health Data'],
      ],
      [
        ['ai_data', 'logistics_supplychain'],
        'Phân tích chuỗi cung ứng',
        ['Supply Chain Analytics', 'Operations Research'],
      ],
      [
        ['marketing_media', 'ai_data'],
        'Marketing tăng trưởng dựa trên dữ liệu',
        ['Growth Analytics', 'Marketing Technology'],
      ],
      [
        ['law_publicservice', 'cybersecurity_network'],
        'Pháp lý công nghệ & quyền riêng tư',
        ['Data Privacy', 'Technology Compliance'],
      ],
      [
        ['psychology_education', 'business_management'],
        'Tâm lý tổ chức & phát triển nhân tài',
        ['Learning & Development', 'People Analytics'],
      ],
      [
        ['language_international', 'marketing_media'],
        'Truyền thông quốc tế',
        ['Global Communication', 'Localization'],
      ],
      [
        ['construction_architecture', 'environment_agriculture'],
        'Công trình xanh & đô thị bền vững',
        ['Green Building', 'Sustainable Urban Design'],
      ],
      [
        ['content_media', 'design_multimedia'],
        'Sản xuất nội dung đa phương tiện',
        ['Motion Design', 'Creative Production'],
      ],
      [
        ['finance_accounting', 'software_it'],
        'Công nghệ tài chính',
        ['FinTech Product', 'Financial Systems'],
      ],
    ] as [string[], string, string[]][];
    const matches = rules
      .filter(([codes]) => codes.every((code) => top.has(code)))
      .slice(0, 3)
      .map(([sourceGroups, name, examples]) => ({
        name,
        examples,
        sourceGroups,
        reason:
          'Hướng giao thoa được tạo từ nhiều xu hướng mạnh cùng xuất hiện trong câu trả lời của bạn.',
      }));
    if (matches.length) return matches;
    const first = CAREER_PROFILES.find(
      (profile) => profile.code === ranking[0]?.code
    );
    const second = CAREER_PROFILES.find(
      (profile) => profile.code === ranking[1]?.code
    );
    return first && second
      ? [
          {
            name: `${first.name} × ${second.name}`,
            examples: [
              ...first.relatedMajors.slice(0, 1),
              ...second.relatedMajors.slice(0, 1),
            ],
            sourceGroups: [first.code, second.code],
            reason:
              'Đây là vùng giao thoa cá nhân hóa giữa hai hướng nổi bật nhất của bạn.',
          },
        ]
      : [];
  }
  private questionPayload(code: string, session: any) {
    const question = QUESTION_BANK.find((item) => item.code === code)!;
    const currentTop = this.rank(session).slice(0, 2);
    return {
      done: false,
      canComplete: false,
      question: {
        code: question.code,
        type: 'likert',
        dimension: question.dimension,
        text: question.text,
        reason:
          (session.answers || []).length < 12
            ? 'Câu lõi giúp xây nền tảng cân bằng cho hồ sơ RIASEC của bạn.'
            : `Câu này được chọn để làm rõ sự khác biệt giữa ${currentTop
                .map((item) => item.name)
                .join(' và ')} ở khía cạnh ${question.facet}.`,
        options: [
          { value: 1, label: 'Hoàn toàn không đúng' },
          { value: 2, label: 'Không đúng lắm' },
          { value: 3, label: 'Phân vân' },
          { value: 4, label: 'Khá đúng' },
          { value: 5, label: 'Rất đúng với tôi' },
          { value: null, label: 'Chưa chắc / chưa trải nghiệm' },
        ],
      },
      progress: this.progress(session),
    };
  }
  private toClient(session: any) {
    return {
      id: String(session._id || session.id),
      status: session.status,
      assessmentVersion: session.assessmentVersion,
      questionBankVersion: session.questionBankVersion,
      context: session.context,
      answers: session.answers,
      result: session.result,
      progress: this.progress(session),
      canComplete: this.canComplete(session),
      ...(this.isFixed(session)
        ? {
            academic: session.academic ?? null,
            subjects: Object.entries(SUBJECTS).map(([code, label]) => ({ code, label })),
            combinations: ACADEMIC_COMBINATIONS,
            options: LIKERT_OPTIONS,
            questions: (session.issuedQuestionCodes || []).map(
              (code: string, index: number) => ({
                number: index + 1,
                code,
                text: QUESTION_BANK.find((q) => q.code === code)?.text,
              })
            ),
          }
        : {}),
    };
  }
}
