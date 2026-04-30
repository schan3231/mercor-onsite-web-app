"use client";

import { ScoringWeights, RolePreset } from "@/lib/types";
import { normalizeWeights } from "@/lib/utils";

interface ScoringWeightsPanelProps {
  weights: ScoringWeights;
  activePresetId: string;
  presets: RolePreset[];
  onWeightsChange: (weights: ScoringWeights) => void;
  onPresetSelect: (preset: RolePreset) => void;
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
  onWeightsChange,
  onPresetSelect,
}: ScoringWeightsPanelProps) {
  const total = Object.values(weights).reduce((s, v) => s + v, 0);

  function handleSliderChange(key: keyof ScoringWeights, val: number) {
    const normalized = normalizeWeights(weights as unknown as Record<string, number>, key, val);
    onWeightsChange(normalized as unknown as ScoringWeights);
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
    </div>
  );
}
