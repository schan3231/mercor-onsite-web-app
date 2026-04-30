import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkExperience {
  company: string;
  roleName: string;
}

interface Degree {
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

interface RawCandidate {
  id?: number;
  name: string;
  email: string;
  location: string;
  work_experiences: WorkExperience[];
  education: { highest_level: string; degrees: Degree[] };
  skills: string[];
  annual_salary_expectation: Record<string, string>;
  enrichment?: CandidateEnrichment | { error: string };
  [key: string]: unknown;
}

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.join(__dirname, "..");
const INPUT_PATH = path.join(ROOT, "form-submissions.json");
const OUTPUT_PATH = path.join(ROOT, "form-submissions-enriched.json");
const CONCURRENCY = 8;
const SAVE_EVERY = 25;
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT =
  "You evaluate job candidates and return strict JSON. Be calibrated and honest — " +
  "most candidates are tier 2-3, not tier 5. Tier 5 is reserved for unambiguously " +
  "elite credentials.";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(candidate: RawCandidate): string {
  const workLines = candidate.work_experiences.length
    ? candidate.work_experiences.map((e) => `  - ${e.roleName} at ${e.company}`).join("\n")
    : "  (none listed)";

  const eduLines = candidate.education.degrees.length
    ? candidate.education.degrees
        .filter((d) => d.degree || d.originalSchool)
        .map((d) => {
          const parts = [d.degree, d.subject, d.originalSchool].filter(Boolean).join(" / ");
          const top = d.isTop25 ? " [isTop25]" : d.isTop50 ? " [isTop50]" : "";
          return `  - ${parts}${top}`;
        })
        .join("\n")
    : "  (none listed)";

  const skillsLine = candidate.skills.length ? candidate.skills.join(", ") : "(none listed)";

  return `Candidate profile:
Name: ${candidate.name}
Location: ${candidate.location}
Highest education: ${candidate.education.highest_level || "unknown"}

Education details:
${eduLines}

Work experience:
${workLines}

Listed skills: ${skillsLine}

Return ONLY a JSON object (no markdown fences, no extra text) matching this exact schema:
{
  "inferredSkills": string[],        // 5-15 skills implied by work/education NOT already in listed skills. Be specific.
  "universityTier": 1|2|3|4|5,        // 5=MIT/Stanford/Oxford/Cambridge/Ivy/equivalent, 4=top-50 global or flagship public, 3=well-regarded national, 2=standard regional, 1=unknown/unaccredited/no degree
  "universityRationale": string,     // one sentence
  "companyTiers": [{"name": string, "tier": 1|2|3|4|5}],  // one per company. 5=FAANG/Stripe/OpenAI/Anthropic/Databricks, 4=well-known public tech/unicorn, 3=established mid-size, 2=small but real, 1=unknown/freelance
  "avgCompanyTier": number,
  "topCompanyTier": number,
  "seniority": "junior"|"mid"|"senior"|"staff"|"executive",
  "specialties": string[],           // 1-4 domain tags e.g. "fintech", "ML infrastructure", "B2B SaaS"
  "redFlags": string[]               // empty unless clearly problematic
}`;
}

// ---------------------------------------------------------------------------
// JSON extraction with one retry
// ---------------------------------------------------------------------------

async function callClaude(
  client: Anthropic,
  prompt: string,
  isRetry = false
): Promise<string> {
  const userContent = isRetry
    ? `${prompt}\n\nREMEMBER: RETURN ONLY VALID JSON, NO OTHER TEXT, NO MARKDOWN FENCES.`
    : prompt;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response block type");
  return block.text;
}

function extractJson(raw: string): CandidateEnrichment {
  // Strip ```json fences if present
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(stripped) as CandidateEnrichment;
}

async function enrichCandidate(
  client: Anthropic,
  candidate: RawCandidate
): Promise<CandidateEnrichment | { error: string }> {
  const prompt = buildPrompt(candidate);
  try {
    const raw = await callClaude(client, prompt);
    try {
      return extractJson(raw);
    } catch {
      // One retry with stricter instruction
      const raw2 = await callClaude(client, prompt, true);
      return extractJson(raw2);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function saveProgress(candidates: RawCandidate[]): void {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(candidates, null, 2), "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY not set. Add it to .env.local.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Load raw candidates
  const raw: RawCandidate[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const total = raw.length;

  // Load existing enriched output if present (resumability)
  let candidates: RawCandidate[];
  if (fs.existsSync(OUTPUT_PATH)) {
    const existing: RawCandidate[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
    // Merge: use enriched data where already present
    const enrichedById = new Map(existing.map((c, i) => [i, c]));
    candidates = raw.map((c, i) => {
      const prev = enrichedById.get(i);
      if (prev?.enrichment) return prev; // already done
      return c;
    });
    const alreadyDone = candidates.filter((c) => c.enrichment).length;
    console.log(`Resuming — ${alreadyDone}/${total} already enriched, skipping those.`);
  } else {
    candidates = [...raw];
  }

  const limit = pLimit(CONCURRENCY);
  let completed = 0;
  let sinceLastSave = 0;

  const tasks = candidates.map((candidate, idx) =>
    limit(async () => {
      // Skip if already enriched
      if (candidate.enrichment) return;

      const enrichment = await enrichCandidate(client, candidate);
      candidates[idx] = { ...candidate, enrichment };
      completed++;
      sinceLastSave++;

      const isError = "error" in enrichment;
      console.log(
        `[${String(completed).padStart(4)}/${total}] ${isError ? "ERROR" : "enriched"} ${candidate.name}${isError ? ` — ${(enrichment as { error: string }).error}` : ""}`
      );

      // Persist every SAVE_EVERY candidates
      if (sinceLastSave >= SAVE_EVERY) {
        saveProgress(candidates);
        sinceLastSave = 0;
        console.log(`  → saved progress (${candidates.filter((c) => c.enrichment).length}/${total})`);
      }
    })
  );

  await Promise.all(tasks);

  // Final save
  saveProgress(candidates);

  const errors = candidates.filter(
    (c) => c.enrichment && "error" in (c.enrichment as object)
  ).length;
  const successes = candidates.filter(
    (c) => c.enrichment && !("error" in (c.enrichment as object))
  ).length;

  console.log(`\nDone. ${successes} enriched, ${errors} errors. Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
