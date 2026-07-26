/**
 * Skill-tag overlap matching (deterministic, not AI).
 * Compares project requiredSkillTags with student skill tags.
 */

export interface SkillMatchResult {
  matchScore: number;
  matchingSkills: string[];
  matchingSkillsCount: number;
  totalRequiredSkills: number;
  studentSkillsFlat: string[];
}

function normalize(skill: string): string {
  return skill.trim().toLowerCase();
}

/** Flatten student skills JSON ({ expert, proficient, familiar } or string[]). */
export function flattenStudentSkills(skills: unknown): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills.filter((s): s is string => typeof s === 'string');
  }
  if (typeof skills === 'object') {
    const obj = skills as Record<string, unknown>;
    const buckets = ['expert', 'proficient', 'familiar'];
    const result: string[] = [];
    for (const key of buckets) {
      const arr = obj[key];
      if (Array.isArray(arr)) {
        for (const s of arr) {
          if (typeof s === 'string') result.push(s);
        }
      }
    }
    return result;
  }
  return [];
}

export function computeSkillMatch(
  requiredSkillTags: unknown,
  studentSkills: unknown
): SkillMatchResult {
  const required = Array.isArray(requiredSkillTags)
    ? requiredSkillTags.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];

  const studentSkillsFlat = flattenStudentSkills(studentSkills);
  const studentNorm = new Set(studentSkillsFlat.map(normalize));

  const matchingSkills = required.filter((r) => studentNorm.has(normalize(r)));
  const totalRequiredSkills = required.length;
  const matchingSkillsCount = matchingSkills.length;
  const matchScore =
    totalRequiredSkills === 0
      ? 0
      : Math.round((matchingSkillsCount / totalRequiredSkills) * 100);

  return {
    matchScore,
    matchingSkills,
    matchingSkillsCount,
    totalRequiredSkills,
    studentSkillsFlat,
  };
}
