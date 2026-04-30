"use client";

import { ScoredCandidate } from "@/lib/types";
import { formatSalary } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import { useEffect } from "react";

interface CandidateModalProps {
  candidate: ScoredCandidate;
  activeRoleLabel: string;
  activeRoleEmoji: string;
  bonusSkills: string[];
  isInTeam: boolean;
  isTeamFull: boolean;
  onClose: () => void;
  onAddToTeam: (candidate: ScoredCandidate) => void;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  education: "Education",
  experience: "Experience",
  skills: "Skills",
  salaryEfficiency: "Salary Fit",
};

export default function CandidateModal({
  candidate,
  activeRoleLabel,
  activeRoleEmoji,
  bonusSkills,
  isInTeam,
  isTeamFull,
  onClose,
  onAddToTeam,
}: CandidateModalProps) {
  const lowerBonus = bonusSkills.map((s) => s.toLowerCase());
  const salary = formatSalary(candidate.annual_salary_expectation["full-time"] ?? "");
  const enrichment =
    candidate.enrichment && !("error" in candidate.enrichment) ? candidate.enrichment : null;

  const inferredOnly = enrichment
    ? enrichment.inferredSkills.filter(
        (s) => !candidate.skills.some((cs) => cs.toLowerCase() === s.toLowerCase())
      )
    : [];

  const companyTierMap = new Map(
    enrichment?.companyTiers.map((ct) => [ct.name.toLowerCase(), ct.tier]) ?? []
  );

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 rounded-t-2xl">
          <ScoreBadge score={candidate.score.total} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{candidate.name}</h2>
            <p className="text-sm text-gray-500">{candidate.location || "Location unknown"}</p>
            {enrichment && (
              <span className="inline-block mt-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full capitalize">
                {enrichment.seniority}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Score breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Score Breakdown
            </p>
            <div className="space-y-2">
              {Object.entries(candidate.score.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{BREAKDOWN_LABELS[key] ?? key}</span>
                    <span className="font-semibold text-gray-700">{value}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        value >= 75 ? "bg-emerald-400" : value >= 50 ? "bg-amber-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1">
              {candidate.score.rationale.map((r, i) => (
                <p key={i} className="text-xs text-gray-500 flex gap-2">
                  <span className="text-indigo-400">•</span>
                  {r}
                </p>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Salary expectation</p>
              <p className="font-semibold text-gray-700">{salary}/yr</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Highest education</p>
              <p className="font-semibold text-gray-700">{candidate.education.highest_level || "N/A"}</p>
            </div>
          </div>

          {/* Education */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Education
            </p>
            <div className="space-y-2">
              {candidate.education.degrees.filter((d) => d.degree || d.originalSchool).map((deg, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{deg.degree || "Certification"}</p>
                      {deg.subject && <p className="text-xs text-gray-500">{deg.subject}</p>}
                      <p className="text-xs text-gray-400">{deg.originalSchool}</p>
                      {i === 0 && enrichment && (
                        <p className="text-xs text-gray-400 mt-1 italic">{enrichment.universityRationale}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {deg.isTop50 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                          Top 50
                        </span>
                      )}
                      {i === 0 && enrichment && (
                        <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                          Tier {enrichment.universityTier}/5
                        </span>
                      )}
                      {(deg.startDate || deg.endDate) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {deg.startDate}–{deg.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work experience */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Work Experience
            </p>
            <div className="space-y-1.5">
              {candidate.work_experiences.map((exp, i) => {
                const tier = companyTierMap.get(exp.company.toLowerCase());
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800">{exp.roleName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        {exp.company}
                        {tier !== undefined && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            T{tier}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => {
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
            </div>
            {inferredOnly.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mt-2 mb-1">AI-inferred</p>
                <div className="flex flex-wrap gap-1.5">
                  {inferredOnly.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-500"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}
            {bonusSkills.length > 0 && (
              <p className="text-xs text-indigo-500 mt-2">
                Highlighted skills match the {activeRoleLabel} role
              </p>
            )}
          </div>

          {/* Red flags */}
          {enrichment && enrichment.redFlags.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">⚠ Flags: </span>
                {enrichment.redFlags.join("; ")}
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
          <button
            onClick={() => {
              onAddToTeam(candidate);
              onClose();
            }}
            disabled={isTeamFull && !isInTeam}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              isInTeam
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : isTeamFull
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isInTeam
              ? "Remove from team"
              : isTeamFull
              ? "Team is full (5/5)"
              : `${activeRoleEmoji} Hire as ${activeRoleLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
