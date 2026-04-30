import { Candidate, CandidateScore, ScoringWeights } from "../types";
import { localStrategy } from "./localStrategy";

// Strategy interface — swap in claudeStrategy via SCORING_STRATEGY env var.
export interface ScoringStrategy {
  scoreCandidate(
    candidate: Candidate,
    weights: ScoringWeights,
    bonusSkills: string[],
    allSalaries: number[]
  ): CandidateScore;
}

export function getStrategy(): ScoringStrategy {
  if (process.env.SCORING_STRATEGY === "claude") {
    // claudeStrategy will be imported lazily when the env var is set
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./claudeStrategy").claudeStrategy;
  }
  return localStrategy;
}

export { localStrategy };
