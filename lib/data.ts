import { Candidate } from "./types";
import { parseSalary } from "./utils";
import rawData from "../form-submissions.json";

// Assign stable numeric IDs at load time (index in original array).
// Loaded once per process — no DB needed since data is static.
const candidates: Candidate[] = (rawData as Omit<Candidate, "id">[]).map(
  (c, i) => ({ ...c, id: i })
);

export function getAllCandidates(): Candidate[] {
  return candidates;
}

export function getCandidateById(id: number): Candidate | undefined {
  return candidates[id];
}

// Precomputed salary list for percentile calculation in the scoring engine.
export const ALL_SALARIES: number[] = candidates
  .map((c) => parseSalary(c.annual_salary_expectation["full-time"] ?? ""))
  .filter((s) => s > 0)
  .sort((a, b) => a - b);

export function getUniqueLocations(): string[] {
  const seen = new Set<string>();
  for (const c of candidates) {
    if (c.location) seen.add(c.location);
  }
  return Array.from(seen).sort();
}

export function getUniqueSkills(): string[] {
  const seen = new Set<string>();
  for (const c of candidates) {
    for (const s of c.skills) seen.add(s);
  }
  return Array.from(seen).sort();
}
