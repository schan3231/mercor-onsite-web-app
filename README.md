# Mercor Hiring Assistant

A full-stack web app for browsing, scoring, and hiring a founding team of 5 from 975 applicants.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

---

## Architecture Overview

### Stack
| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack in one repo; API routes + React; runs locally without deployment |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | Tailwind CSS | Fast utility-first styling with no design-system dependency |
| Data | `form-submissions.json` (static) | 975 records, ~1.5 MB; loaded server-side at startup, no DB needed |

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
│   ├── ScoringWeightsPanel.tsx     # Role preset buttons + weight sliders
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
└── form-submissions.json
```

---

## Scoring System

### Design Decision: Client-Side Scoring
Scoring happens in the browser using `localStrategy.scoreCandidate()`, not on the server. This means:
- Adjusting weight sliders re-ranks all 975 candidates **instantly** without any network request
- The API returns raw candidate data; the client applies the current weights
- `allSalaries` (needed for percentile calculations) is fetched once from `/api/meta`

### The `ScoringStrategy` Interface

```typescript
interface ScoringStrategy {
  scoreCandidate(
    candidate: Candidate,
    weights: ScoringWeights,
    bonusSkills: string[],
    allSalaries: number[]
  ): CandidateScore;
}
```

This interface makes the scoring algorithm **swappable**. To activate Claude API scoring, set `SCORING_STRATEGY=claude` in `.env.local` and implement `lib/scoring/claudeStrategy.ts`. The `rationale: string[]` field on every `CandidateScore` is the natural place for LLM-generated text.

### Scoring Factors (Local Algorithm)

Each factor produces a raw subscore (0–100), then is weighted:

| Factor | Max pts | How it's calculated |
|---|---|---|
| **Education** | 30% | HS=20, Associate=40, Bachelor=60, Master=80, PhD=100. +10 if any degree from a top-50 school |
| **Experience** | 25% | `min(unique companies, 5) / 5 × 100`. Rewards breadth across organizations. |
| **Skills** | 35% | Base: `min(skill_count, 15) / 15 × 80`. Bonus: up to +20 pts for matching up to 3 role-specific bonus skills |
| **Salary efficiency** | 10% | Inverted percentile rank. Lower salary expectation = higher score, rewarding budget-conscious hires |

`total = Σ(subscore_i × weight_i) / 100`

### Role Presets

Presets are predefined `ScoringWeights` + `bonusSkills` arrays tailored to each startup role:

| Preset | Education | Experience | Skills | Salary | Key bonus skills |
|---|---|---|---|---|---|
| **CEO** | 25% | 45% | 15% | 15% | Management, Agile, Leadership |
| **CTO** | 30% | 20% | 40% | 10% | Python, AWS, Docker, ML, Java |
| **Senior Engineer** | 10% | 35% | 45% | 10% | React, TypeScript, Node JS, REST APIs |
| **Product Designer** | 10% | 30% | 50% | 10% | Figma, Photoshop, Illustrator, HTML/CSS |
| **Data / ML** | 20% | 30% | 40% | 10% | Python, SQL, Machine Learning, Data Analysis |
| **Balanced** | 25% | 25% | 30% | 20% | (none) |

### Weight Normalization

When a slider moves, the other three weights scale proportionally so they always sum to 100. This is handled in `lib/utils.ts → normalizeWeights()`.

---

## UI Features

### Candidate Browser (`/`)

Three-column layout:

**Left sidebar — Presets & Weights**
- Click a role preset → weights and bonus skills update instantly, candidates re-rank
- Four sliders (Education / Experience / Skills / Salary) auto-normalize to 100%
- Filters: location dropdown, education level, salary range (dual sliders), must-have skills (multi-select)

**Main grid — Candidate Cards**
- 18 candidates per page, sorted by score by default
- Score badge is color-coded: green ≥75, amber 55–74, red <55
- Skills highlighted in indigo if they match the active role's bonus skills
- "Hire for [Role]" button adds candidate to the active team slot
- Click card to open the full-profile modal

**Active Role Banner**
- Shows which role you're currently hiring for, with bonus skill chips
- Clicking a team slot on the right switches to that role's preset automatically

**Right panel — Team Builder**
- 5 labeled role slots (CEO / CTO / Senior Eng / Designer / Data/ML)
- Click a slot to make it active and load that role's preset
- Live stats: total salary, countries represented, unique skills, education levels
- Diversity indicator changes color based on geographic spread
- "View Team Summary" button is enabled only when all 5 slots are filled

### Candidate Modal

- Opens on card click, closes on Escape or backdrop click
- Score breakdown with per-factor progress bars
- Full work history timeline and education list
- All skill chips (role-relevant ones highlighted)
- "Hire as [Role]" CTA in a sticky footer

### Team Summary (`/team`)

- Team is persisted in `sessionStorage` when navigating, so the page survives a refresh
- Per-hire rationale: auto-generated prose from score breakdown data
- Score breakdown bar chart per candidate
- Team analysis: geographic diversity, education mix, collective skill coverage, salary split

---

## API Reference

### `GET /api/candidates`

Query params:
- `search` — full-text match on name, skills, role names
- `skills[]` — must-have skills (candidate must have ALL specified)
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

## Extending with Claude API

1. Add `ANTHROPIC_API_KEY` to `.env.local`
2. Set `SCORING_STRATEGY=claude` in `.env.local`
3. Implement `lib/scoring/claudeStrategy.ts` — the `ScoringStrategy` interface is already in place
4. The `rationale: string[]` field in `CandidateScore` can hold LLM-generated justifications
5. Optionally batch candidates to reduce API calls (score top 50 by local score, then rerank with Claude)
