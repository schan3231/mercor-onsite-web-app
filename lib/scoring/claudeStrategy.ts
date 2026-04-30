import { Candidate, CandidateScore, ScoringWeights } from "../types";
import { ScoringStrategy } from "./index";

// Stub for Claude API scoring strategy.
// Activate by setting SCORING_STRATEGY=claude in your .env.local.
// When implemented, this calls Claude to generate a CandidateScore with rich
// rationale text. The localStrategy score can be passed as context so Claude
// adjusts rather than replaces the numeric scoring.
export const claudeStrategy: ScoringStrategy = {
  scoreCandidate(
    _candidate: Candidate,
    _weights: ScoringWeights,
    _bonusSkills: string[],
    _allSalaries: number[]
  ): CandidateScore {
    throw new Error(
      "Claude scoring strategy is not yet implemented. " +
        "Set SCORING_STRATEGY=local or implement this strategy with your Claude API key."
    );
  },
};
