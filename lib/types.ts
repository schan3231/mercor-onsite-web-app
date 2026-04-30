export interface CandidateEnrichment {
  inferredSkills: string[];
  universityTier: 1 | 2 | 3 | 4 | 5;
  universityRationale: string;
  companyTiers: { name: string; tier: 1 | 2 | 3 | 4 | 5 }[];
  avgCompanyTier: number;
  topCompanyTier: number;
  seniority: "junior" | "mid" | "senior" | "staff" | "executive";
  specialties: string[];
  redFlags: string[];
}

export interface WorkExperience {
  company: string;
  roleName: string;
}

export interface Degree {
  degree: string;
  subject: string;
  school: string;
  gpa: string;
  startDate: string;
  endDate: string;
  originalSchool: string;
  isTop50: boolean;
  isTop25?: boolean;
}

export interface Education {
  highest_level: string;
  degrees: Degree[];
}

export interface AnnualSalaryExpectation {
  "full-time"?: string;
  "part-time"?: string;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  submitted_at: string;
  work_availability: string[];
  annual_salary_expectation: AnnualSalaryExpectation;
  work_experiences: WorkExperience[];
  education: Education;
  skills: string[];
  enrichment?: CandidateEnrichment | { error: string };
}

export interface ScoringWeights {
  education: number;
  experience: number;
  skills: number;
  salaryEfficiency: number;
}

export interface ScoreBreakdown {
  education: number;
  experience: number;
  skills: number;
  salaryEfficiency: number;
}

export interface CandidateScore {
  total: number;
  breakdown: ScoreBreakdown;
  rationale: string[];
}

export interface ScoredCandidate extends Candidate {
  score: CandidateScore;
}

export interface RolePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  weights: ScoringWeights;
  bonusSkills: string[];
}

export interface TeamSlot {
  roleId: string;
  roleLabel: string;
  roleEmoji: string;
  candidate: ScoredCandidate | null;
}

export interface FilterState {
  search: string;
  skills: string[];
  location: string;
  education: string;
  salaryMin: number;
  salaryMax: number;
}

export interface CandidatesApiResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  pageSize: number;
}
