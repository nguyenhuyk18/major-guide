/**
 * Prediction test cases DD-01..DD-22: answers (+ optional grades) -> 3 career families.
 * The ML probabilities in prediction-scenarios.json are frozen outputs of the deployed
 * model (agentic-ai/tests/test_prediction_scenarios.py checks the model itself), so this
 * suite checks everything the app adds on top: answer handling, grade fusion, alignment.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { CareerAssessmentService, FIXED_QUESTION_CODES } from './career-assessment.service';
import { QUESTION_BANK } from './career-assessment.data';

const CASES = JSON.parse(readFileSync(join(__dirname, 'prediction-scenarios.json'), 'utf8'));

async function run(testCase: any) {
  let state: any;
  const repository: any = {
    findActive: async () => null,
    create: async (data: any) => {
      state = { ...data, _id: 's' };
      return { ...state, toObject: () => state };
    },
    findById: async () => state,
    update: async (_: string, data: any) => (state = { ...state, ...data }),
  };
  const model = {
    score: async () => ({
      model: { name: 'majorguide-career-family', version: 'fixture', type: 'mlp' },
      families: testCase.mlFamilies,
      profiles: {},
      explanations: [],
    }),
    nextScale: async () => null,
  };
  const service = new CareerAssessmentService(repository, model as any);
  await service.start('u', {});
  const used: Record<string, number> = {};
  for (const code of FIXED_QUESTION_CODES) {
    const scale = QUESTION_BANK.find((q) => q.code === code)!.facet;
    const index = used[scale] ?? 0;
    used[scale] = index + 1;
    await service.answer('s', 'u', { code, value: testCase.answers[scale][index] });
  }
  if (testCase.academic) await service.setAcademic('s', 'u', testCase.academic);
  return ((await service.complete('s', 'u')) as any).careerMatch;
}

describe('prediction scenarios', () => {
  it.each(CASES.map((c: any) => [`${c.id} ${c.name}`, c]))('%s', async (_label, testCase: any) => {
    const match = await run(testCase);
    const codes = match.groups.map((g: any) => g.code);
    expect(match.groups).toHaveLength(3);
    if (testCase.expectTop1) expect(testCase.expectTop1).toContain(codes[0]);
    // Regression baseline: the exact top 3 produced by the current model and rules.
    expect(codes).toEqual(testCase.expectTop3);
    expect(match.alignment?.status ?? null).toBe(testCase.expectAlignment ?? null);
    expect(match.rankingChanged).toBe(testCase.expectRankingChanged);
    if (testCase.academic) {
      expect(match.academicUsed).toBe(true);
      expect(match.groups.every((g: any) => g.academic)).toBe(true);
      expect(match.groups[0].explanation).toContain('Về học lực');
    }
  });
});
