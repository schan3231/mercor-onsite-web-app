"use client";

import { FilterState } from "@/lib/types";
import { formatSalary } from "@/lib/utils";

interface FilterSidebarProps {
  filters: FilterState;
  allSkills: string[];
  allLocations: string[];
  educationLevels: string[];
  salaryRange: { min: number; max: number };
  onChange: (filters: FilterState) => void;
}

export default function FilterSidebar({
  filters,
  allSkills,
  allLocations,
  educationLevels,
  salaryRange,
  onChange,
}: FilterSidebarProps) {
  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleSkill(skill: string) {
    const lower = skill.toLowerCase();
    const existing = filters.skills.map((s) => s.toLowerCase());
    if (existing.includes(lower)) {
      update("skills", filters.skills.filter((s) => s.toLowerCase() !== lower));
    } else {
      update("skills", [...filters.skills, skill]);
    }
  }

  function clearAll() {
    onChange({
      search: "",
      skills: [],
      location: "",
      education: "",
      salaryMin: salaryRange.min,
      salaryMax: salaryRange.max,
    });
  }

  const hasFilters =
    filters.skills.length > 0 ||
    filters.location ||
    filters.education ||
    filters.salaryMin > salaryRange.min ||
    filters.salaryMax < salaryRange.max;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</p>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-indigo-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
        <select
          value={filters.location}
          onChange={(e) => update("location", e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">All locations</option>
          {allLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Education */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Education level</label>
        <select
          value={filters.education}
          onChange={(e) => update("education", e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">Any level</option>
          {educationLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Salary range */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Salary range:{" "}
          <span className="text-gray-500">
            {formatSalary(`$${filters.salaryMin}`)} – {formatSalary(`$${filters.salaryMax}`)}
          </span>
        </label>
        <div className="space-y-1.5">
          <input
            type="range"
            min={salaryRange.min}
            max={salaryRange.max}
            step={1000}
            value={filters.salaryMin}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val < filters.salaryMax) update("salaryMin", val);
            }}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-indigo-600"
          />
          <input
            type="range"
            min={salaryRange.min}
            max={salaryRange.max}
            step={1000}
            value={filters.salaryMax}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > filters.salaryMin) update("salaryMax", val);
            }}
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-indigo-600"
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Skills (must-have)</label>
        {filters.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {filters.skills.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-indigo-200"
              >
                {skill}
                <span className="text-indigo-400">×</span>
              </button>
            ))}
          </div>
        )}
        <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
          {allSkills
            .filter((s) => !filters.skills.map((f) => f.toLowerCase()).includes(s.toLowerCase()))
            .map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className="block w-full text-left text-xs text-gray-600 px-2 py-1 rounded hover:bg-gray-100 hover:text-gray-900"
              >
                {skill}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
