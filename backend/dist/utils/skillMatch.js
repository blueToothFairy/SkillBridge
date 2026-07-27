"use strict";
/**
 * Skill-tag overlap matching (deterministic, not AI).
 * Compares project requiredSkillTags with student skill tags.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenStudentSkills = flattenStudentSkills;
exports.computeSkillMatch = computeSkillMatch;
function normalize(skill) {
    return skill.trim().toLowerCase();
}
/** Flatten student skills JSON ({ expert, proficient, familiar } or string[]). */
function flattenStudentSkills(skills) {
    if (!skills)
        return [];
    if (Array.isArray(skills)) {
        return skills.filter((s) => typeof s === 'string');
    }
    if (typeof skills === 'object') {
        const obj = skills;
        const buckets = ['expert', 'proficient', 'familiar'];
        const result = [];
        for (const key of buckets) {
            const arr = obj[key];
            if (Array.isArray(arr)) {
                for (const s of arr) {
                    if (typeof s === 'string')
                        result.push(s);
                }
            }
        }
        return result;
    }
    return [];
}
function computeSkillMatch(requiredSkillTags, studentSkills) {
    const required = Array.isArray(requiredSkillTags)
        ? requiredSkillTags.filter((s) => typeof s === 'string' && s.trim().length > 0)
        : [];
    const studentSkillsFlat = flattenStudentSkills(studentSkills);
    const studentNorm = new Set(studentSkillsFlat.map(normalize));
    const matchingSkills = required.filter((r) => studentNorm.has(normalize(r)));
    const totalRequiredSkills = required.length;
    const matchingSkillsCount = matchingSkills.length;
    const matchScore = totalRequiredSkills === 0
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
