import {
  CareerAssessmentService,
  FIXED_QUESTION_CODES,
} from './career-assessment.service';
import { CAREER_PROFILES, QUESTION_BANK } from './career-assessment.data';
import { CAREER_FAMILIES } from './career-families';

describe('CareerAssessmentService', () => {
  let state: any;
  const repository: any = {
    findActive: jest.fn(async () => null),
    create: jest.fn(async (data: any) => {
      state = { ...data, _id: 'session-1' };
      return { ...state, toObject: () => state };
    }),
    findById: jest.fn(async () => state),
    findByUser: jest.fn(async () => [state]),
    update: jest.fn(async (_: string, data: any) => {
      state = { ...state, ...data };
      return state;
    }),
  };
  const scaleOf = (code: string) =>
    QUESTION_BANK.find((q) => q.code === code)!.facet;
  // Strong Investigative + Realistic interests, low Social/Enterprising.
  const investigative: Record<string, number> = { R: 4, I: 5, A: 2, S: 1, E: 1, C: 3 };
  const answerAll = async (svc: CareerAssessmentService, skip = 0) => {
    const started: any = await svc.start('member-1', {});
    for (const question of started.questions.slice(skip)) {
      await svc.answer('session-1', 'member-1', {
        code: question.code,
        value: investigative[scaleOf(question.code)],
        responseTimeMs: 1500,
      });
    }
    return started;
  };

  beforeEach(() => {
    state = undefined;
    jest.clearAllMocks();
  });

  it('ships a 100-item versioned bank and 40 career profiles', () => {
    expect(QUESTION_BANK).toHaveLength(100);
    expect(new Set(CAREER_PROFILES.map((p) => p.code)).size).toBe(40);
  });

  it('every career profile belongs to a career family', () => {
    const covered = new Set(CAREER_FAMILIES.flatMap((f) => f.profiles));
    expect(CAREER_PROFILES.every((p) => covered.has(p.code))).toBe(true);
    expect(CAREER_FAMILIES).toHaveLength(17);
  });

  it('uses a fixed set of 30 interest questions, 5 per RIASEC scale, interleaved', () => {
    expect(FIXED_QUESTION_CODES).toHaveLength(30);
    expect(new Set(FIXED_QUESTION_CODES).size).toBe(30);
    const perScale: Record<string, number> = {};
    FIXED_QUESTION_CODES.forEach((code) => {
      perScale[scaleOf(code)] = (perScale[scaleOf(code)] || 0) + 1;
    });
    expect(perScale).toEqual({ R: 5, I: 5, A: 5, S: 5, E: 5, C: 5 });
    expect(FIXED_QUESTION_CODES.slice(0, 6).map(scaleOf)).toEqual(['R', 'I', 'A', 'S', 'E', 'C']);
  });

  it('starts a session with every question, its text and the answer options', async () => {
    const started: any = await new CareerAssessmentService(repository).start('member-1', {});
    expect(started.questions).toHaveLength(30);
    expect(started.questions[0]).toMatchObject({ number: 1, code: FIXED_QUESTION_CODES[0] });
    expect(started.questions[0].text).toContain('Tôi thích');
    expect(started.options.map((o: any) => o.value)).toEqual([1, 2, 3, 4, 5]);
    expect(started.progress).toEqual({ answered: 0, total: 30, remaining: 30 });
  });

  it('lets the user change an answer and refuses to submit while questions remain', async () => {
    const svc = new CareerAssessmentService(repository);
    await answerAll(svc, 1);
    await svc.answer('session-1', 'member-1', { code: FIXED_QUESTION_CODES[5], value: 1 });
    await svc.answer('session-1', 'member-1', { code: FIXED_QUESTION_CODES[5], value: 4 });
    expect(state.answers.filter((a: any) => a.code === FIXED_QUESTION_CODES[5])).toHaveLength(1);
    expect((await svc.get('session-1', 'member-1') as any).progress.remaining).toBe(1);
    await expect(svc.complete('session-1', 'member-1')).rejects.toThrow('Cần trả lời thêm');
  });

  it('rejects an empty answer and a question outside the test', async () => {
    const svc = new CareerAssessmentService(repository);
    await svc.start('member-1', {});
    await expect(
      svc.answer('session-1', 'member-1', { code: FIXED_QUESTION_CODES[0], value: null })
    ).rejects.toThrow('từ 1 đến 5');
    await expect(
      svc.answer('session-1', 'member-1', { code: 'VALUE_SUPPORT_001', value: 3 })
    ).rejects.toThrow('chưa được cấp');
  });

  it('returns the 3 ML career families with an explanation', async () => {
    const model = {
      score: jest.fn(async () => ({
        model: { name: 'majorguide-career-family', version: 'test', type: 'mlp' },
        families: [
          { code: 'physical_sciences_math', name: 'x', probability: 0.31 },
          { code: 'engineering', name: 'x', probability: 0.22 },
          { code: 'it_software', name: 'x', probability: 0.15 },
          { code: 'psychology_counseling', name: 'x', probability: 0.02 },
        ],
        profiles: {},
        explanations: [],
      })),
      nextScale: jest.fn(),
    };
    const svc = new CareerAssessmentService(repository, model as any);
    await answerAll(svc);
    const result: any = await svc.complete('session-1', 'member-1');
    const match = result.careerMatch;
    expect(match.source).toBe('ml');
    expect(match.groups.map((g: any) => g.code)).toEqual(['physical_sciences_math', 'engineering', 'it_software']);
    expect(match.groups[0]).toMatchObject({ rank: 1, percent: 31, fitLevel: 'Phù hợp nhất' });
    expect(match.groups[0].explanation).toContain('Nghiên cứu - Phân tích (100/100)');
    expect(match.groups[0].explanation).toContain('31%');
    expect(match.groups[0].majors.length).toBeGreaterThan(0);
    expect(match.riasecCode.startsWith('I')).toBe(true);
    expect(model.score).toHaveBeenCalledTimes(1); // only on submit, not on every answer
  });

  it('falls back to interest-profile similarity when the model is unavailable', async () => {
    const offline = { score: jest.fn(async () => null), nextScale: jest.fn() };
    const svc = new CareerAssessmentService(repository, offline as any);
    await answerAll(svc);
    const match = ((await svc.complete('session-1', 'member-1')) as any).careerMatch;
    expect(match.source).toBe('rules');
    expect(match.groups).toHaveLength(3);
    expect(['engineering', 'physical_sciences_math', 'life_sciences', 'it_software']).toContain(match.groups[0].code);
    expect(match.groups.every((g: any) => g.explanation.length > 40)).toBe(true);
  });

  it('rejects an AI review containing fewer than two allowed candidates', async () => {
    await new CareerAssessmentService(repository).start('member-1', {});
    state.status = 'completed';
    state.result = { topGroups: [{ code: 'software_it' }] };
    await expect(
      new CareerAssessmentService(repository).saveAiReview('session-1', 'member-1', {
        status: 'completed',
        rankedCandidates: [{ code: 'invented_major', reasoning: 'Không hợp lệ' }],
      })
    ).rejects.toThrow('không có bảng xếp hạng hợp lệ');
  });

  describe('academic profile', () => {
    // Interest model that cannot decide between law and medicine.
    const tiedModel = {
      score: jest.fn(async () => ({
        model: { name: 'm', version: 't', type: 'mlp' },
        families: [
          { code: 'law_public', name: 'x', probability: 0.2 },
          { code: 'health_medicine', name: 'x', probability: 0.2 },
          { code: 'education', name: 'x', probability: 0.19 },
          { code: 'business_management', name: 'x', probability: 0.1 },
        ],
        profiles: {},
        explanations: [],
      })),
      nextScale: jest.fn(),
    };
    const science = { source: 'thi_thu', scores: { toan: 9, hoa_hoc: 9, sinh_hoc: 9.25, ngu_van: 5.5, ngoai_ngu: 6, lich_su: 4, dia_li: 5 } };

    it('saves validated scores and rejects invalid ones', async () => {
      const svc = new CareerAssessmentService(repository);
      await svc.start('member-1', {});
      await expect(svc.setAcademic('session-1', 'member-1', { source: 'thi_thu', scores: { toan: 12 } })).rejects.toThrow('từ 0 đến 10');
      const saved: any = await svc.setAcademic('session-1', 'member-1', science);
      expect(saved.academic.scores.sinh_hoc).toBe(9.25);
      expect(saved.subjects).toHaveLength(9);
      const cleared: any = await svc.setAcademic('session-1', 'member-1', { source: 'hoc_ba', scores: {} });
      expect(cleared.academic).toBeNull();
    });

    it('lets strong science grades lift medicine above law and explains why', async () => {
      const svc = new CareerAssessmentService(repository, tiedModel as any);
      await answerAll(svc);
      await svc.setAcademic('session-1', 'member-1', science);
      const match = ((await svc.complete('session-1', 'member-1')) as any).careerMatch;
      expect(match.academicUsed).toBe(true);
      expect(match.groups[0].code).toBe('health_medicine');
      expect(match.groups[0].academic).toMatchObject({ combo: 'B00', total: 27.25 });
      expect(match.groups[0].academic.nationalPercentile).toBeGreaterThan(90);
      expect(match.groups[0].explanation).toContain('tổ hợp B00');
      expect(match.groups[0].explanation).toContain('thí sinh thi tổ hợp này năm 2024');
      expect(match.groups[0].explanation).toContain('Sinh học, Hóa học là lợi thế');
      // The interest-only ranking is kept to show what the grades changed.
      expect(match.interestOnly[0].code).toBe('law_public');
      expect(match.rankingChanged).toBe(true);
      // Strongest interest is Investigative and science grades are strong.
      expect(match.alignment).toMatchObject({ status: 'aligned', scale: 'I', area: 'science' });
    });

    it('warns when the strongest interest and the strongest subjects disagree', async () => {
      const svc = new CareerAssessmentService(repository, tiedModel as any);
      await answerAll(svc);
      await svc.setAcademic('session-1', 'member-1', {
        source: 'hoc_ba',
        scores: { toan: 5, hoa_hoc: 4.5, sinh_hoc: 5, ngu_van: 8.5, lich_su: 8.75, dia_li: 9 },
      });
      const match = ((await svc.complete('session-1', 'member-1')) as any).careerMatch;
      expect(match.alignment.status).toBe('mismatch');
      expect(match.alignment.strongestArea).toContain('khối xã hội');
      expect(match.alignment.message).toContain('Thế mạnh học lực hiện tại nằm ở khối xã hội');
    });

    it('uses school-report grades without national percentiles', async () => {
      const svc = new CareerAssessmentService(repository, tiedModel as any);
      await answerAll(svc);
      await svc.setAcademic('session-1', 'member-1', { ...science, source: 'hoc_ba' });
      const match = ((await svc.complete('session-1', 'member-1')) as any).careerMatch;
      expect(match.groups[0].academic.nationalPercentile).toBeNull();
      expect(match.groups[0].explanation).not.toContain('năm 2024');
    });

    it('keeps the interest-only result when no grades are given', async () => {
      const svc = new CareerAssessmentService(repository, tiedModel as any);
      await answerAll(svc);
      const match = ((await svc.complete('session-1', 'member-1')) as any).careerMatch;
      expect(match.academicUsed).toBe(false);
      expect(match.groups[0].code).toBe('law_public');
      expect(match.groups[0].academic).toBeNull();
      expect(match.interestOnly).toBeNull();
      expect(match.alignment).toBeNull();
    });
  });
});
