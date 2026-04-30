import { Candidate, CandidateEnrichment, CandidateScore, ScoringWeights } from "../types";
import { parseSalary } from "../utils";
import { ScoringStrategy } from "./index";

// Education level → raw subscore (0–100 scale before school-quality adjustment).
const EDU_SCORES: Record<string, number> = {
  "High School Diploma": 20,
  "Associate's Degree": 40,
  "Bachelor's Degree": 60,
  "Master's Degree": 80,
  Doctorate: 100,
  "Juris Doctor (J.D)": 75,
};

function getEnrichment(candidate: Candidate): CandidateEnrichment | null {
  if (!candidate.enrichment || "error" in candidate.enrichment) return null;
  return candidate.enrichment as CandidateEnrichment;
}

// ---------------------------------------------------------------------------
// Education score
// ---------------------------------------------------------------------------
// Without enrichment: degree level base + legacy isTop50 bonus (+10).
// With enrichment: degree level base + (universityTier - 1) * 10.
//   Tier 5 → +40, Tier 4 → +30, Tier 3 → +20, Tier 2 → +10, Tier 1 → +0.
// Capped at 100.
function educationScore(candidate: Candidate): { score: number; rationale: string } {
  const level = candidate.education.highest_level;
  const base = EDU_SCORES[level] ?? 30;
  const enrichment = getEnrichment(candidate);

  let score: number;
  let rationale: string;

  if (enrichment) {
    const tierBonus = (enrichment.universityTier - 1) * 10;
    score = Math.min(100, base + tierBonus);
    rationale = `${level || "Unknown education"} — university tier ${enrichment.universityTier}/5 (${enrichment.universityRationale})`;
  } else {
    const hasTop50 = candidate.education.degrees.some((d) => d.isTop50);
    score = Math.min(100, base + (hasTop50 ? 10 : 0));
    rationale = `${level || "Unknown education"}${hasTop50 ? " from a top-50 school" : ""}`;
  }

  return { score, rationale };
}

// ---------------------------------------------------------------------------
// Experience score
// ---------------------------------------------------------------------------
// Breadth metric (unique companies, capped at 5) multiplied by a company-tier
// quality factor when enrichment is available:
//   quality = 0.6 + 0.4 * (avgCompanyTier / 5)
//   → tier-5 avg: quality = 1.0 (full credit)
//   → tier-1 avg: quality = 0.68 (freelance/unknown gets 68% of breadth credit)
// Additionally, seniority "senior", "staff", or "executive" adds a flat +10 bonus.
function experienceScore(candidate: Candidate): { score: number; rationale: string } {
  const uniqueCompanies = new Set(candidate.work_experiences.map((e) => e.company)).size;
  const breadth = Math.min(uniqueCompanies, 5) / 5 * 100;
  const enrichment = getEnrichment(candidate);

  let score: number;
  let rationale: string;
  const roleCount = candidate.work_experiences.length;

  if (enrichment) {
    const qualityFactor = 0.6 + 0.4 * (enrichment.avgCompanyTier / 5);
    const seniorityBonus =
      enrichment.seniority === "senior" ||
      enrichment.seniority === "staff" ||
      enrichment.seniority === "executive"
        ? 10
        : 0;
    score = Math.min(100, Math.round(breadth * qualityFactor + seniorityBonus));

    const tierNote = `avg company tier ${enrichment.avgCompanyTier.toFixed(1)}/5, top tier ${enrichment.topCompanyTier}/5`;
    const seniorNote = seniorityBonus > 0 ? `, ${enrichment.seniority}-level` : "";
    rationale = `${uniqueCompanies} compan${uniqueCompanies !== 1 ? "ies" : "y"} across ${roleCount} role${roleCount !== 1 ? "s" : ""} (${tierNote}${seniorNote})`;
  } else {
    score = Math.round(breadth);
    rationale = `${uniqueCompanies} compan${uniqueCompanies !== 1 ? "ies" : "y"} across ${roleCount} role${roleCount !== 1 ? "s" : ""}`;
  }

  return { score, rationale };
}

// ---------------------------------------------------------------------------
// Skills score
// ---------------------------------------------------------------------------
// When enrichment is available, uses the UNION of listed skills + inferredSkills
// for breadth counting and bonus matching. This fixes the "many skills implied
// but none listed" problem for candidates with sparse skill lists.
function skillsScore(
  candidate: Candidate,
  bonusSkills: string[]
): { score: number; rationale: string } {
  const enrichment = getEnrichment(candidate);

  // Build the full skill set (listed + inferred if available)
  const inferredSkills = enrichment?.inferredSkills ?? [];
  const allSkills = [...new Set([...candidate.skills, ...inferredSkills])];
  const count = allSkills.length;
  const listedCount = candidate.skills.length;

  // Base: up to 80 pts from skill breadth (capped at 15 skills)
  const base = Math.min(count, 15) / 15 * 80;

  // Bonus: up to 20 pts for matching role-specific bonus skills (capped at 3 matches)
  const lowerBonus = bonusSkills.map((b) => b.toLowerCase());
  const matches = allSkills.filter((s) => lowerBonus.includes(s.toLowerCase()));
  const bonus = Math.min(matches.length, 3) / 3 * 20;

  const score = Math.min(100, base + bonus);

  let rationale: string;
  if (inferredSkills.length > 0) {
    const inferred = inferredSkills.slice(0, 3).join(", ");
    const extraNote = matches.length > 0 ? ` including ${matches.slice(0, 2).join(", ")}` : "";
    rationale = `${listedCount} listed + ${inferredSkills.length} inferred skills (e.g. ${inferred})${extraNote}`;
  } else {
    rationale =
      matches.length > 0
        ? `${count} skills including ${matches.slice(0, 3).join(", ")}`
        : `${count} skills`;
  }

  return { score, rationale };
}

// ---------------------------------------------------------------------------
// Salary efficiency score — unchanged
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Composite scorer
// ---------------------------------------------------------------------------
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

    const enrichment = getEnrichment(candidate);

    // Weights must sum to 100; each subscore is 0–100.
    const total = Math.round(
      (edu.score * weights.education +
        exp.score * weights.experience +
        skills.score * weights.skills +
        salary.score * weights.salaryEfficiency) /
        100
    );

    // Enrichment-derived signals for the rationale (shown in modal)
    const extraRationale: string[] = [];
    if (enrichment) {
      if (enrichment.specialties.length > 0) {
        extraRationale.push(`Specialties: ${enrichment.specialties.join(", ")}`);
      }
      if (enrichment.redFlags.length > 0) {
        extraRationale.push(`⚠ ${enrichment.redFlags.join("; ")}`);
      }
    }

    return {
      total,
      breakdown: {
        education: Math.round(edu.score),
        experience: Math.round(exp.score),
        skills: Math.round(skills.score),
        salaryEfficiency: Math.round(salary.score),
      },
      rationale: [edu.rationale, exp.rationale, skills.rationale, salary.rationale, ...extraRationale],
    };
  },
};
