"use client";

import { useState, useEffect } from "react";
import { ScoringWeights, RolePreset } from "@/lib/types";
import { normalizeWeights } from "@/lib/utils";

interface ScoringWeightsPanelProps {
  weights: ScoringWeights;
  activePresetId: string;
  presets: RolePreset[];
  activeRoleSkills: string[];
  allSkills: string[];
  onWeightsChange: (weights: ScoringWeights) => void;
  onPresetSelect: (preset: RolePreset) => void;
  onSkillsChange: (skills: string[]) => void;
  onSkillsReset: () => void;
}

const WEIGHT_KEYS: { key: keyof ScoringWeights; label: string; description: string }[] = [
  { key: "education", label: "Education", description: "Degree level and school prestige" },
  { key: "experience", label: "Experience", description: "Number of companies and roles" },
  { key: "skills", label: "Skills", description: "Skill breadth and role-relevant matches" },
  { key: "salaryEfficiency", label: "Salary", description: "Lower salary expectation scores higher" },
];

export default function ScoringWeightsPanel({
  weights,
  activePresetId,
  presets,
  activeRoleSkills,
  allSkills,
  onWeightsChange,
  onPresetSelect,
  onSkillsChange,
  onSkillsReset,
}: ScoringWeightsPanelProps) {
  const [input, setInput] = useState("");
  const total = Object.values(weights).reduce((s, v) => s + v, 0);

  useEffect(() => {
    setInput("");
  }, [activePresetId]);

  function handleSliderChange(key: keyof ScoringWeights, val: number) {
    const normalized = normalizeWeights(weights as unknown as Record<string, number>, key, val);
    onWeightsChange(normalized as unknown as ScoringWeights);
  }

  function addSkill() {
    const trimmed = input.trim();
    if (trimmed && !activeRoleSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onSkillsChange([...activeRoleSkills, trimmed]);
    }
    setInput("");
  }

  return (
    <div className="space-y-4">
      {/* Role presets */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Role Presets
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onPresetSelect(preset)}
              title={preset.description}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                activePresetId === preset.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{preset.emoji}</span>
              <span className="truncate">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weight sliders */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Scoring Weights
          </p>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              total === 100 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
            }`}
          >
            {total}%
          </span>
        </div>

        <div className="space-y-3">
          {WEIGHT_KEYS.map(({ key, label, description }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-700 font-medium" title={description}>
                  {label}
                </label>
                <span className="text-xs font-semibold text-indigo-600 w-8 text-right">
                  {weights[key]}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) => handleSliderChange(key, parseInt(e.target.value, 10))}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-indigo-600 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Role skills editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Role Skills
          </p>
          <button
            onClick={onSkillsReset}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            Reset
          </button>
        </div>

        {activeRoleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {activeRoleSkills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
              >
                {skill}
                <button
                  onClick={() => onSkillsChange(activeRoleSkills.filter((s) => s !== skill))}
                  className="hover:text-indigo-900 leading-none"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-1">
          <input
            list="role-skills-datalist"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSkill();
            }}
            placeholder="Add skill..."
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <button
            onClick={addSkill}
            className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        <datalist id="role-skills-datalist">
          {allSkills
            .filter((s) => !activeRoleSkills.some((rs) => rs.toLowerCase() === s.toLowerCase()))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      </div>
    </div>
  );
}
