import { CAREER_FAMILY_CODES } from '@common/constant/enum/career-family.constant';
import { CAREER_FAMILIES } from './career-families';
import { cleanCareerFamilies, familySimilarity, inferCareerFamilies, rankExperts } from './expert-matching';

const expert = (id: string, major: string, careerFamilies?: string[], price = 100000) => ({
  _id: id,
  name: id,
  expertProfile: { major, price, careerFamilies },
});

describe('expert matching', () => {
  it('uses the same family codes as the career model', () => {
    expect([...CAREER_FAMILY_CODES].sort()).toEqual(CAREER_FAMILIES.map((f) => f.code).sort());
  });

  it.each([
    ['Quản trị kinh doanh', 'business_management'],
    ['Luật Sư', 'law_public'],
    ['Nhà Hóa Học', 'physical_sciences_math'],
    ['Tài Chính Doanh Nghiệp', 'finance_economics'],
    ['Công Nghệ Sinh Học', 'life_sciences'],
    ['Kỹ thuật phần mềm', 'it_software'],
    ['Tâm lý học lâm sàng', 'psychology_counseling'],
    ['Sư phạm Ngữ văn', 'education'],
  ])('infers "%s" -> %s from the major', (major, code) => {
    expect(inferCareerFamilies(major)[0]).toBe(code);
  });

  it('adds families found in the workplace / bio, but the major comes first', () => {
    expect(inferCareerFamilies('Nhà Hóa Học', 'Giáo viên Hóa Học')).toEqual(['physical_sciences_math', 'education']);
  });

  it('does not match words inside other words or common Vietnamese words', () => {
    expect(inferCareerFamilies('Văn hóa toàn cầu', 'ít khi được ai biết')).toEqual([]);
  });

  it('keeps only known, unique codes, at most 3', () => {
    expect(cleanCareerFamilies(['law_public', 'x', 'law_public', 'education', 'arts_design', 'it_software'])).toEqual([
      'law_public',
      'education',
      'arts_design',
    ]);
    expect(cleanCareerFamilies('law_public')).toEqual([]);
  });

  it('scores an exact family above any related family', () => {
    for (const a of CAREER_FAMILY_CODES)
      for (const b of CAREER_FAMILY_CODES) if (a !== b) expect(familySimilarity(a, b)).toBeLessThan(0.5);
    expect(familySimilarity('business_management', 'business_management')).toBe(1);
    expect(familySimilarity('business_management', 'finance_economics')).toBeGreaterThan(0);
    expect(familySimilarity('arts_design', 'finance_economics')).toBe(0);
  });

  it('ranks experts of the top family first and explains why', () => {
    const result = rankExperts(
      ['finance_economics', 'business_management', 'it_software'],
      [
        expert('biz', 'Quản trị kinh doanh', ['business_management']),
        expert('fin', 'Kế toán', ['finance_economics']),
        expert('art', 'Thiết kế đồ họa', ['arts_design']),
      ]
    );
    expect(result.map((r) => r.id)).toEqual(['fin', 'biz']);
    expect(result[0]).toMatchObject({ matchType: 'exact', matchedGroup: { rank: 1, code: 'finance_economics' } });
    expect(result[0].reason).toContain('#1');
  });

  it('falls back to related experts when nobody covers the family', () => {
    const [first] = rankExperts(['finance_economics'], [expert('biz', 'Quản trị kinh doanh', ['business_management'])]);
    expect(first).toMatchObject({ id: 'biz', matchType: 'related', expertFamily: { code: 'business_management' } });
    expect(first.reason).toContain('gần với nhóm #1');
  });

  it('infers families for experts saved before the field existed', () => {
    const [first] = rankExperts(['law_public'], [expert('jimmy', 'Luật Sư')]);
    expect(first).toMatchObject({ id: 'jimmy', matchType: 'exact', familiesInferred: true });
  });

  it('returns nothing for unknown families and respects the limit', () => {
    const experts = Array.from({ length: 6 }, (_, i) => expert(`e${i}`, 'Kế toán', ['finance_economics'], i));
    expect(rankExperts(['nope'], experts)).toEqual([]);
    expect(rankExperts(['finance_economics'], experts, 3).map((r) => r.id)).toEqual(['e0', 'e1', 'e2']);
  });
});
