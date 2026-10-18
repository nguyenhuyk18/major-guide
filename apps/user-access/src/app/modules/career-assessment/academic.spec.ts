import { readFileSync } from 'fs';
import { join } from 'path';
import { academicFit, fuse, nationalPercentile, validateAcademic } from './academic';

const parity = JSON.parse(readFileSync(join(__dirname, 'academic-parity.json'), 'utf8'));

describe('academic fit (parity with agentic-ai/ml/career/academic.py)', () => {
  it.each(parity as any[])('reproduces the Python fit for case %#', (testCase) => {
    const actual = academicFit({ source: testCase.source, scores: testCase.scores });
    for (const [family, expected] of Object.entries<any>(testCase.expected)) {
      expect(actual[family].combo).toBe(expected.combo);
      expect(actual[family].total).toBe(expected.total);
      expect(actual[family].fit).toBeCloseTo(expected.fit, 3);
      if (expected.percentile !== null)
        expect(actual[family].percentile).toBeCloseTo(expected.percentile, 3);
    }
  });

  it('places combination totals on the 2024 national distribution', () => {
    expect(nationalPercentile('A00', 0)).toBe(0);
    expect(nationalPercentile('A00', 30)).toBe(1);
    expect(nationalPercentile('D01', 24.25)).toBeGreaterThan(0.85);
    expect(nationalPercentile('D01', 19.65)).toBeCloseTo(0.5, 1);
  });

  it('boosts families whose admission combinations match strong grades', () => {
    const fits = academicFit({ source: 'thi_thu', scores: { toan: 9, hoa_hoc: 9, sinh_hoc: 9.25, ngu_van: 6, ngoai_ngu: 6 } });
    const fused = fuse({ health_medicine: 0.2, law_public: 0.2 }, fits);
    expect(fits.health_medicine.combo).toBe('B00');
    expect(fused.health_medicine).toBeGreaterThan(fused.law_public);
  });

  it('separates families sharing a combination by their core subjects', () => {
    const fits = academicFit({ source: 'thi_thu', scores: { toan: 9, hoa_hoc: 9, sinh_hoc: 9.25, ngu_van: 5.5, ngoai_ngu: 6 } });
    expect(fits.health_medicine.combo).toBe('B00');
    expect(fits.psychology_counseling.combo).toBe('B00');
    expect(fits.health_medicine.fit).toBeGreaterThan(fits.psychology_counseling.fit);
  });

  it('validates input', () => {
    expect(() => validateAcademic({ source: 'x', scores: {} })).toThrow('Nguồn điểm');
    expect(() => validateAcademic({ source: 'hoc_ba', scores: { toan: 11 } })).toThrow('từ 0 đến 10');
    expect(() => validateAcademic({ source: 'hoc_ba', scores: { toan: 8, hoa_hoc: 7 } })).toThrow('ít nhất một tổ hợp');
    expect(validateAcademic({ source: 'hoc_ba', scores: { toan: '8.25', ngu_van: 7, ngoai_ngu: 9, sinh_hoc: '' } })).toEqual({
      source: 'hoc_ba',
      scores: { toan: 8.25, ngu_van: 7, ngoai_ngu: 9 },
    });
  });
});
