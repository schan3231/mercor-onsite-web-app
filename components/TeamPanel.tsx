"use client";

import { TeamSlot, ScoredCandidate } from "@/lib/types";
import { parseSalary, scoreColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TeamPanelProps {
  slots: TeamSlot[];
  activeSlotIndex: number;
  onSlotClick: (index: number) => void;
  onRemove: (slotIndex: number) => void;
}

export default function TeamPanel({ slots, activeSlotIndex, onSlotClick, onRemove }: TeamPanelProps) {
  const router = useRouter();
  const filledSlots = slots.filter((s) => s.candidate !== null);
  const isTeamComplete = filledSlots.length === 5;

  const totalSalary = filledSlots.reduce((sum, s) => {
    const raw = s.candidate?.annual_salary_expectation["full-time"] ?? "";
    return sum + parseSalary(raw);
  }, 0);

  const allSkills = new Set<string>();
  for (const slot of filledSlots) {
    slot.candidate?.skills.forEach((sk) => allSkills.add(sk));
  }

  const countries = new Set(
    filledSlots.map((s) => s.candidate?.location ?? "").filter(Boolean)
  );

  const educationLevels = new Set(
    filledSlots.map((s) => s.candidate?.education.highest_level ?? "").filter(Boolean)
  );

  const diversityColor =
    countries.size >= 4
      ? "text-emerald-600 bg-emerald-50"
      : countries.size >= 2
      ? "text-amber-600 bg-amber-50"
      : "text-rose-600 bg-rose-50";

  function saveTeamAndNavigate() {
    const team = slots.map((s) => s.candidate ? { ...s.candidate, roleLabel: s.roleLabel, roleEmoji: s.roleEmoji } : null);
    sessionStorage.setItem("hiredTeam", JSON.stringify(team));
    router.push("/team");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 text-sm">Your Team</h2>
        <span className="text-xs text-gray-400">{filledSlots.length}/5</span>
      </div>

      {/* Role slots */}
      <div className="space-y-2 flex-1">
        {slots.map((slot, i) => (
          <div
            key={slot.roleId}
            onClick={() => onSlotClick(i)}
            className={`rounded-lg border p-3 cursor-pointer transition-all ${
              activeSlotIndex === i
                ? "border-indigo-400 bg-indigo-50"
                : slot.candidate
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-dashed border-gray-300 bg-gray-50 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{slot.roleEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{slot.roleLabel}</p>
                {slot.candidate ? (
                  <p className="text-xs text-gray-500 truncate">{slot.candidate.name}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {activeSlotIndex === i ? "Searching..." : "Empty — click to fill"}
                  </p>
                )}
              </div>
              {slot.candidate && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${scoreColor(slot.candidate.score.total)}`}
                  >
                    {slot.candidate.score.total}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(i);
                    }}
                    className="text-gray-400 hover:text-red-500 text-sm leading-none px-1"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Team stats */}
      {filledSlots.length >= 2 && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Stats</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-gray-400">Total salary</p>
              <p className="font-semibold text-gray-700">${(totalSalary / 1000).toFixed(0)}k/yr</p>
            </div>
            <div className={`rounded-lg p-2 ${diversityColor}`}>
              <p className="opacity-70">Locations</p>
              <p className="font-semibold">{countries.size} countries</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-gray-400">Unique skills</p>
              <p className="font-semibold text-gray-700">{allSkills.size}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-gray-400">Edu levels</p>
              <p className="font-semibold text-gray-700">{educationLevels.size}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={saveTeamAndNavigate}
        disabled={!isTeamComplete}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          isTeamComplete
            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isTeamComplete ? "View Team Summary →" : `Fill ${5 - filledSlots.length} more slot${5 - filledSlots.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
