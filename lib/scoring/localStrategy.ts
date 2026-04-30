import { Candidate, CandidateScore, ScoringWeights } from "../types";
import { parseSalary } from "../utils";
import { ScoringStrategy } from "./index";

// Education level → raw subscore (0–100 scale before top-50 bonus).
const EDU_SCORES: Record<string, number> = {
  "High School Diploma": 20,
  "Associate's Degree": 40,
  "Bachelor's Degree": 60,
  "Master's Degree": 80,
  Doctorate: 100,
  "Juris Doctor (J.D)": 75,
};

function educationScore(candidate: Candidate): { score: number; rationale: string } {
  const level = candidate.education.highest_level;
  let score = EDU_SCORES[level] ?? 30;

  const hasTop50 = candidate.education.degrees.some((d) => d.isTop50);
  if (hasTop50) score = Math.min(100, score + 10);

  const rationale = `${level}${hasTop50 ? " from a top-50 school" : ""}`;
  return { score, rationale };
}

function experienceScore(candidate: Candidate): { score: number; rationale: string } {
  const uniqueCompanies = new Set(candidate.work_experiences.map((e) => e.company)).size;
  const score = Math.min(uniqueCompanies, 5) / 5 * 100;
  return {
    score,
    rationale: `${uniqueCompanies} company${uniqueCompanies !== 1 ? "ies" : "y"} across ${candidate.work_experiences.length} role${candidate.work_experiences.length !== 1 ? "s" : ""}`,
  };
}

function skillsScore(
  candidate: Candidate,
  bonusSkills: string[]
): { score: number; rationale: string } {
  const count = candidate.skills.length;
  // Base: up to 80 pts from skill breadth (capped at 15 skills)
  const base = Math.min(count, 15) / 15 * 80;

  // Bonus: up to 20 pts for matching role-specific bonus skills (capped at 3 matches)
  const matches = candidate.skills.filter((s) =>
    bonusSkills.some((b) => b.toLowerCase() === s.toLowerCase())
  );
  const bonus = Math.min(matches.length, 3) / 3 * 20;

  const score = Math.min(100, base + bonus);
  const rationale =
    matches.length > 0
      ? `${count} skills including ${matches.slice(0, 3).join(", ")}`
      : `${count} skills`;

  return { score, rationale };
}

function salaryEfficiencyScore(
  candidate: Candidate,
  allSalaries: number[]
): { score: number; rationale: string } {
  const salary = parseSalary(candidate.annual_salary_expectation["full-time"] ?? "");
  if (salary <= 0 || allSalaries.length === 0) return { score: 50, rationale: "No salary data" };

  const below = allSalaries.filter((s) => s < salary).length;
  const percentile = below / allSalaries.length;

  // Invert: lower salary = higher score
  const score = Math.round((1 - percentile) * 100);
  const formattedSalary = `$${salary.toLocaleString()}`;
  return {
    score,
    rationale: `${formattedSalary}/yr (lower than ${Math.round(percentile * 100)}% of applicants)`,
  };
}

export const localStrategy: ScoringStrategy = {
  scoreCandidate(
    candidate: Candidate,
    weights: ScoringWeights,
    bonusSkills: string[],
    allSalaries: number[]
  ): CandidateScore {
    const edu = educationScore(candidate);
    const exp = experienceScore(candidate);
    const skills = skillsScore(candidate, bonusSkills);
    const salary = salaryEfficiencyScore(candidate, allSalaries);

    // Weights must sum to 100; each subscore is 0–100.
    const total = Math.round(
      (edu.score * weights.education +
        exp.score * weights.experience +
        skills.score * weights.skills +
        salary.score * weights.salaryEfficiency) /
        100
    );

    return {
      total,
      breakdown: {
        education: Math.round(edu.score),
        experience: Math.round(exp.score),
        skills: Math.round(skills.score),
        salaryEfficiency: Math.round(salary.score),
      },
      rationale: [edu.rationale, exp.rationale, skills.rationale, salary.rationale],
    };
  },
};
