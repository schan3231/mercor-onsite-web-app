"use client";

import ScoreBadge from "./ScoreBadge";
import { ScoredCandidate } from "@/lib/types";
import { formatSalary } from "@/lib/utils";

interface CandidateCardProps {
  candidate: ScoredCandidate;
  onSelect: (candidate: ScoredCandidate) => void;
  onAddToTeam: (candidate: ScoredCandidate) => void;
  isInTeam: boolean;
  isTeamFull: boolean;
  activeRoleLabel: string;
  bonusSkills: string[];
}

export default function CandidateCard({
  candidate,
  onSelect,
  onAddToTeam,
  isInTeam,
  isTeamFull,
  activeRoleLabel,
  bonusSkills,
}: CandidateCardProps) {
  const salary = formatSalary(candidate.annual_salary_expectation["full-time"] ?? "");
  const topSkills = candidate.skills.slice(0, 4);
  const expCount = candidate.work_experiences.length;
  const eduLevel = candidate.education.highest_level;

  const lowerBonus = bonusSkills.map((s) => s.toLowerCase());

  return (
    <div
      className={`bg-white rounded-xl border transition-shadow cursor-pointer hover:shadow-md p-4 flex flex-col gap-3 ${
        isInTeam ? "border-indigo-400 ring-1 ring-indigo-200" : "border-gray-200"
      }`}
      onClick={() => onSelect(candidate)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <ScoreBadge score={candidate.score.total} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{candidate.name}</p>
          <p className="text-xs text-gray-500 truncate">{candidate.location || "Location unknown"}</p>
          <p className="text-xs text-gray-400">{eduLevel}</p>
        </div>
        {isInTeam && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0 font-medium">
            Hired
          </span>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {topSkills.map((skill) => {
          const isBonus = lowerBonus.includes(skill.toLowerCase());
          return (
            <span
              key={skill}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isBonus
                  ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {skill}
            </span>
          );
        })}
        {candidate.skills.length > 4 && (
          <span className="text-xs text-gray-400">+{candidate.skills.length - 4} more</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{expCount} role{expCount !== 1 ? "s" : ""}</span>
          <span>{salary}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTeam(candidate);
          }}
          disabled={isTeamFull && !isInTeam}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            isInTeam
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : isTeamFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isInTeam ? "Remove" : `Hire for ${activeRoleLabel}`}
        </button>
      </div>
    </div>
  );
}
