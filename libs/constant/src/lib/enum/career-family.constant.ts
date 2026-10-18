/** Codes of the 17 career families predicted by the career test (agentic-ai/ml/career/taxonomy.py). */
export const CAREER_FAMILY_CODES = [
    'it_software',
    'engineering',
    'architecture_construction',
    'business_management',
    'marketing_communication',
    'finance_economics',
    'arts_design',
    'humanities_language',
    'psychology_counseling',
    'education',
    'social_work',
    'law_public',
    'health_medicine',
    'life_sciences',
    'physical_sciences_math',
    'hospitality_tourism',
    'sports_fitness',
] as const;

export type CareerFamilyCode = (typeof CAREER_FAMILY_CODES)[number];

/** An expert advises on at most this many career families. */
export const MAX_EXPERT_CAREER_FAMILIES = 3;
