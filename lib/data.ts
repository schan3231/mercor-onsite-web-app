import * as fs from "fs";
import * as path from "path";
import { Candidate } from "./types";
import { parseSalary } from "./utils";

// Prefer the enriched file if it exists; fall back to the raw file.
// This lets the app work before enrichment runs and automatically upgrade
// once enrich-candidates.ts has been executed.
function loadCandidates(): Candidate[] {
  const enrichedPath = path.join(process.cwd(), "form-submissions-enriched.json");
  const rawPath = path.join(process.cwd(), "form-submissions.json");
  const filePath = fs.existsSync(enrichedPath) ? enrichedPath : rawPath;
  const raw: Omit<Candidate, "id">[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return raw.map((c, i) => ({ ...c, id: i }));
}

// Assign stable numeric IDs at load time (index in original array).
// Loaded once per process — no DB needed since data is static.
const candidates: Candidate[] = loadCandidates();

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
