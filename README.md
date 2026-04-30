# Mercor Hiring Assistant

A full-stack web app for browsing, scoring, and hiring a founding team of 5 from 975 applicants.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To run LLM enrichment (one-time, requires API key in `.env.local`):

```bash
npm run enrich
```

---

## Architecture Overview

### Stack
| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack in one repo; API routes + React; runs locally without deployment |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | Tailwind CSS | Fast utility-first styling with no design-system dependency |
| Data | `form-submissions.json` (static) | 975 records, ~1.5 MB; loaded server-side at startup, no DB needed |
| Enrichment | `claude-haiku-4-5` via Anthropic SDK | Pre-processing step that adds structured signals per candidate |

### File Structure

```
next-app/
├── app/
│   ├── page.tsx                    # Main candidate browser (client component)
│   ├── team/page.tsx               # Team summary page
│   ├── layout.tsx                  # Root layout
│   └── api/
│       ├── candidates/route.ts     # GET /api/candidates — filtered, paginated list
│       ├── candidates/[id]/route.ts # GET /api/candidates/:id — single candidate
│       └── meta/route.ts           # GET /api/meta — salaries, skills, locations
├── components/
│   ├── CandidateCard.tsx           # Grid card with score badge and hire button
│   ├── CandidateModal.tsx          # Full-profile overlay with score breakdown
│   ├── FilterSidebar.tsx           # Location, education, salary, must-have skills
│   ├── ScoringWeightsPanel.tsx     # Role preset buttons, weight sliders, skill editor
│   ├── TeamPanel.tsx               # 5-slot role-based team builder
│   └── ScoreBadge.tsx              # Color-coded score circle
├── lib/
│   ├── types.ts                    # All TypeScript interfaces
│   ├── data.ts                     # JSON loader + salary percentile data (server-only)
│   ├── presets.ts                  # 6 role preset definitions
│   ├── utils.ts                    # Shared pure utilities (parseSalary, normalizeWeights, etc.)
│   └── scoring/
│       ├── index.ts                # ScoringStrategy interface + factory
│       ├── localStrategy.ts        # Composite local scoring algorithm
│       └── claudeStrategy.ts       # Claude API stub (extendable)
├── scripts/
│   └── enrich-candidates.ts        # One-time LLM enrichment pipeline
└── form-submissions.json
```

---

## Filtering & Scoring Architecture

The app has **three completely independent systems** that operate in sequence. Understanding each one is critical for knowing why candidates appear, rank, and highlight the way they do.

```
[All 975 candidates on disk]
        │
        ▼
┌─────────────────────────────┐
│  System 1: Hard Filters     │  ← Server-side, pre-scoring
│  (FilterSidebar)            │     Decides who appears at all
└─────────────────────────────┘
        │ rawCandidates (filtered subset)
        ▼
┌─────────────────────────────┐
│  System 2: Scoring Weights  │  ← Client-side, instant
│  (weight sliders)           │     Decides how candidates rank
└─────────────────────────────┘
        │ scoredCandidates (ranked)
        ▼
┌─────────────────────────────┐
│  System 3: Role Skills      │  ← Client-side, instant
│  (bonus skill editor)       │     Soft boost inside the skills subscore only
└─────────────────────────────┘
        │ final ranked list + chip highlights
        ▼
   Candidate grid
```

---

### System 1 — Hard Filters (server-side, pre-scoring)

**Component:** `FilterSidebar` → `filters` state in `page.tsx` → `GET /api/candidates` → `app/api/candidates/route.ts`

These decide **who appears at all**. A candidate excluded here is never scored and never shown. Changing any filter re-fetches from the API (debounced 250 ms).

| Filter | Mechanism | Logic |
|---|---|---|
| **Must-have skills** | `filters.skills: string[]` | AND — candidate's `skills[]` must contain **every** selected skill (case-insensitive exact match). Missing even one → excluded. |
| **Location** | `filters.location: string` | Substring match on `candidate.location` |
| **Education level** | `filters.education: string` | Exact match on `candidate.education.highest_level` |
| **Salary range** | `filters.salaryMin / salaryMax` | Candidate's full-time salary expectation must fall within the range. Candidates with no salary data pass through. |
| **Full-text search** | `filters.search: string` | Substring match on name, `skills[]`, and `work_experiences[].roleName` |

The must-have skills filter is an **AND gate**: selecting Python + SQL only keeps candidates who have both. It reads from `candidate.skills[]` only — AI-inferred skills do not count toward this filter.

---

### System 2 — Scoring Weights (client-side, affects rank)

**Component:** Weight sliders in `ScoringWeightsPanel` → `weights` state → `localStrategy.scoreCandidate()`

These decide **how candidates are ranked**. Every candidate that passes the hard filters gets scored across four dimensions (each 0–100), then combined:

```
total = Math.round(
  (edu.score    × weights.education        +
   exp.score    × weights.experience       +
   skills.score × weights.skills           +
   salary.score × weights.salaryEfficiency) / 100
)
```

Weights must sum to 100. Setting a weight to 0 zeroes out that dimension entirely. Re-scoring happens in-memory with no network call — sliders update ranking instantly across all candidates.

**How each subscore is computed:**

**Education (0–100)**

Base score from degree level:

| Degree | Base |
|---|---|
| Doctorate | 100 |
| Master's | 80 |
| Bachelor's | 60 |
| Associate's | 40 |
| High School | 20 |
| Unknown | 30 |

With LLM enrichment: `score = min(100, base + (universityTier − 1) × 10)`
- Tier 5 (MIT/Stanford/Ivy/Oxford/Cambridge): +40
- Tier 4 (top-50 global / flagship public): +30
- Tier 3 (well-regarded national): +20
- Tier 2 (standard regional): +10
- Tier 1 (unknown / no degree): +0

Without enrichment: `score = base + 10` if any degree has `isTop50: true`.

**Experience (0–100)**

```
breadth = min(unique companies, 5) / 5 × 100
```

With enrichment: `score = min(100, round(breadth × qualityFactor + seniorityBonus))`
- `qualityFactor = 0.6 + 0.4 × (avgCompanyTier / 5)` — tier-5 avg gives full credit (1.0×), tier-1 avg gives 68% credit
- `seniorityBonus = +10` if enrichment seniority is senior / staff / executive

Without enrichment: `score = round(breadth)`

**Skills (0–100)** — see System 3 for bonus detail

**Salary Efficiency (0–100)**

Inverted percentile across the full unfiltered candidate pool:

```
percentile = count(candidates with lower salary) / total candidates
score = round((1 − percentile) × 100)
```

The lowest-asking candidate scores 100; the highest-asking scores ~0. Percentile is computed against all 975 candidates regardless of active filters, so the reference point stays stable.

---

### System 3 — Role / Bonus Skills (client-side, soft boost only)

**Component:** Role Skills editor in `ScoringWeightsPanel` → `roleSkills[activePresetId]` state → `activeBonusSkills` → `localStrategy.scoreCandidate()`

These are **soft scoring signals, not filters**. A candidate who matches zero role skills still appears and is scored — they just get less credit in the skills dimension. Editing this list never adds or removes candidates from the results.

The skills subscore (0–100) has two components:

```
allSkills  = candidate.skills ∪ enrichment.inferredSkills  (deduped, case-insensitive)
count      = allSkills.length

base       = min(count, 15) / 15 × 80          // breadth, max 80 pts out of 100

matches    = allSkills ∩ activeBonusSkills       (case-insensitive)
denominator = max(activeBonusSkills.length, 3)
bonus      = min(matches.length, denominator) / denominator × 20   // max 20 pts

skillsScore = min(100, base + bonus)
```

The denominator rule ensures fairness across list sizes:
- 3-skill list, 3 matches → `3/3 × 20 = 20 pts` (full credit)
- 5-skill list, 3 matches → `3/5 × 20 = 12 pts`
- 1-skill list, 1 match → `1/3 × 20 = 6.7 pts` (single-skill lists don't dominate)

The AI-inferred skills (from LLM enrichment) are included in `allSkills`, so a candidate who clearly uses Python in their work history but forgot to list it can still match a "Python" role skill. This does **not** apply to the must-have hard filter (System 1), which only reads `candidate.skills[]`.

The skills subscore's contribution to the total is: `skillsScore × weights.skills / 100`. If the skills weight slider is set to 0, role skills have zero effect on total score even if every candidate matches perfectly.

**State management:** `roleSkills` is a `Record<string, string[]>` keyed by preset ID, initialized from the preset definitions. Editing one role's skill list does not reset another role's list. Clicking a preset selects it without resetting any edits — Reset is only via the explicit "Reset" button.

---

### Key Distinctions Summary

| | Must-have skills (FilterSidebar) | Role skills (ScoringWeightsPanel) |
|---|---|---|
| Effect | Binary — candidate IN or OUT | Continuous — score boost, not exclusion |
| Side | Server (API route, 250 ms debounce) | Client (useMemo, instant) |
| Logic | AND across all selected skills | Partial match, scaled by denominator |
| Skill source | `candidate.skills[]` only | `candidate.skills ∪ inferredSkills` |
| Scope | Affects what gets scored | Affects how existing results rank |

---

## LLM Enrichment Pipeline

**Script:** `scripts/enrich-candidates.ts`
**Run:** `npm run enrich` (requires `ANTHROPIC_API_KEY` in `.env.local`)
**Model:** `claude-haiku-4-5`, `max_tokens: 1024`, concurrency: 8
**Output:** `form-submissions-enriched.json` (gitignored — contains PII)

The script calls Claude once per candidate with a structured prompt and extracts:

```typescript
interface CandidateEnrichment {
  inferredSkills: string[];       // 5–15 skills implied by work/edu, not in listed skills
  universityTier: 1 | 2 | 3 | 4 | 5;  // 5 = MIT/Stanford/Ivy, 1 = unknown/no degree
  universityRationale: string;    // one sentence
  companyTiers: { name: string; tier: 1|2|3|4|5 }[];  // 5 = FAANG/OpenAI/Stripe, 1 = unknown
  avgCompanyTier: number;
  topCompanyTier: number;
  seniority: "junior" | "mid" | "senior" | "staff" | "executive";
  specialties: string[];          // 1–4 domain tags, e.g. "fintech", "ML infrastructure"
  redFlags: string[];             // empty unless clearly problematic
}
```

**Resumability:** The script loads any existing `form-submissions-enriched.json` and skips candidates that already have an `enrichment` field, so it can be interrupted and re-run safely.

**Error handling:** On JSON parse failure, one retry is made with a stricter prompt. On persistent failure, `enrichment: { error: "..." }` is stored and the script continues. The UI guards every enrichment render: only displays if `!("error" in candidate.enrichment)`.

**Data loading:** `lib/data.ts` prefers `form-submissions-enriched.json` if it exists; falls back to `form-submissions.json`. The rest of the app works without enrichment — the scoring algorithm degrades gracefully to the non-enrichment path.

**Enrichment signals surfaced in the UI:**
- `CandidateCard`: seniority badge (violet), red flag warning icon (amber ⚠ with tooltip)
- `CandidateModal`: seniority badge, university tier badge + rationale, per-company tier indicator, AI-inferred skills section (dashed chips), red flags warning box
- Team page: seniority mix panel, inferred skills chips per hire, red flags per hire card, seniority-aware hire rationale

---

## Role Presets

Presets are predefined `ScoringWeights` + default bonus skills tailored to each startup role. The bonus skill list is editable per-role within the session.

| Preset | Education | Experience | Skills | Salary | Default bonus skills |
|---|---|---|---|---|---|
| **COO** | 20% | 40% | 25% | 15% | Operations, Project Management, Strategic Planning, Leadership, Process Improvement |
| **CTO** | 30% | 20% | 40% | 10% | Python, AWS, Docker, ML, Java, Kubernetes, System Design, TypeScript |
| **Senior Engineer** | 10% | 35% | 45% | 10% | React, TypeScript, Node JS, REST APIs, PostgreSQL, GraphQL, MongoDB |
| **Product Designer** | 10% | 30% | 50% | 10% | Figma, Photoshop, Illustrator, HTML/CSS, UX, UI Design, Adobe XD |
| **Data / ML** | 20% | 30% | 40% | 10% | Python, SQL, Machine Learning, Data Analysis, TensorFlow, PyTorch, Pandas |
| **Balanced** | 25% | 25% | 30% | 20% | (none) |

### Weight Normalization

When a slider moves, the other three weights scale proportionally so they always sum to 100. Implemented in `lib/utils.ts → normalizeWeights()`. Edge cases: if all other weights are 0, the remainder is distributed evenly; rounding remainder goes to the last key.

---

## UI Features

### Candidate Browser (`/`)

Three-column layout:

**Left sidebar — Presets, Weights & Filters**
- Click a role preset → weights load, active preset is highlighted; any previous skill edits for that preset are preserved
- Four sliders (Education / Experience / Skills / Salary) auto-normalize to 100%
- Role Skills editor: add/remove bonus skills with a chip UI; datalist autocomplete from the candidate skill corpus; Enter or Add button; Reset restores the preset defaults
- Filters section: location dropdown, education level, salary range (dual sliders), must-have skills (multi-select scrollable list)

**Main grid — Candidate Cards**
- 18 candidates per page, sorted by score by default
- Score badge is color-coded: green ≥75, amber 55–74, red <55
- Skills highlighted in indigo if they match the active role's current bonus skills
- Seniority badge (violet) and red flag indicator (⚠) shown when enrichment is available
- "Hire for [Role]" button adds candidate to the active team slot

**Active Role Banner**
- Shows which role you're currently hiring for, with the top 5 current bonus skill chips
- Clicking a team slot on the right switches to that role's preset automatically

**Right panel — Team Builder**
- 5 labeled role slots (COO / CTO / Senior Eng / Designer / Data/ML)
- Live stats: total salary, countries represented, unique skills, education levels
- Diversity indicator changes color based on geographic spread
- "View Team Summary" button enabled only when all 5 slots are filled

### Candidate Modal

- Opens on card click, closes on Escape or backdrop click
- Score breakdown with per-factor progress bars and rationale bullets
- University tier badge + rationale on first degree
- Per-company tier indicator (`T1`–`T5`) next to each work experience entry
- AI-inferred skills shown as dashed chips below listed skills
- Red flags warning box (amber) shown above the hire CTA if present
- "Hire as [Role]" CTA in a sticky footer

### Team Summary (`/team`)

- Team persisted in `sessionStorage` when navigating
- Per-hire rationale: enrichment-aware auto-generated prose (mentions seniority when available)
- Score breakdown bar chart per candidate
- Red flags warning per hire card if applicable
- AI-inferred skills shown alongside listed skills (dashed chips, `+ AI` separator)
- Team analysis: geographic diversity, seniority mix, education mix, collective skill coverage, salary split

---

## API Reference

### `GET /api/candidates`

Query params:
- `search` — full-text match on name, skills, role names
- `skills[]` — must-have skills (candidate must have ALL specified; AND logic)
- `location` — substring match on location
- `education` — exact education level
- `salaryMin`, `salaryMax` — numeric range
- `page`, `limit` — pagination (default 20, max 100)

Returns: `{ candidates: Candidate[], total: number, page: number, pageSize: number }`

### `GET /api/candidates/:id`

Returns a single candidate by index ID.

### `GET /api/meta`

Returns static metadata needed by the client: `allSalaries`, `locations`, `skills`, `educationLevels`, `salaryRange`.

---

## Testing

```bash
npm test                          # run all 203 tests
npm test -- --coverage            # with coverage report
npm test -- unit                  # unit tests only
npm test -- components            # component tests only
```

Coverage: `lib/`, `components/`, `app/api/`. Tests use Jest 30 + React Testing Library 16 (React 19 compatible). API route tests use `/** @jest-environment node */` to access Web Fetch globals.

---

## Extending with Claude API Scoring

1. Add `ANTHROPIC_API_KEY` to `.env.local`
2. Set `SCORING_STRATEGY=claude` in `.env.local`
3. Implement `lib/scoring/claudeStrategy.ts` — the `ScoringStrategy` interface is already in place
4. The `rationale: string[]` field in `CandidateScore` holds LLM-generated justifications
5. Optionally batch: score top 50 by local score first, then rerank the shortlist with Claude
