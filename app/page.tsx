"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Candidate, ScoredCandidate, ScoringWeights, FilterState, TeamSlot } from "@/lib/types";
import { ROLE_PRESETS, DEFAULT_TEAM_SLOTS, PRESET_MAP } from "@/lib/presets";
import { localStrategy } from "@/lib/scoring/localStrategy";
import CandidateCard from "@/components/CandidateCard";
import CandidateModal from "@/components/CandidateModal";
import ScoringWeightsPanel from "@/components/ScoringWeightsPanel";
import FilterSidebar from "@/components/FilterSidebar";
import TeamPanel from "@/components/TeamPanel";

const PAGE_SIZE = 18;

type SortKey = "score" | "salary" | "experience" | "name";

interface MetaData {
  allSalaries: number[];
  locations: string[];
  skills: string[];
  educationLevels: string[];
  salaryRange: { min: number; max: number };
}

export default function HomePage() {
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [rawCandidates, setRawCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePresetId, setActivePresetId] = useState("balanced");
  const [weights, setWeights] = useState<ScoringWeights>(PRESET_MAP["balanced"].weights);
  const [roleSkills, setRoleSkills] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(ROLE_PRESETS.map((p) => [p.id, [...p.bonusSkills]]))
  );
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    skills: [],
    location: "",
    education: "",
    salaryMin: 0,
    salaryMax: 999999,
  });
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [page, setPage] = useState(1);
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(DEFAULT_TEAM_SLOTS);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);

  // Load metadata + all candidates once on mount
  useEffect(() => {
    async function init() {
      const [metaRes, candidatesRes] = await Promise.all([
        fetch("/api/meta"),
        fetch("/api/candidates?limit=1000"),
      ]);
      const metaData: MetaData = await metaRes.json();
      const { candidates } = await candidatesRes.json();
      setMeta(metaData);
      setFilters((f) => ({
        ...f,
        salaryMin: metaData.salaryRange.min,
        salaryMax: metaData.salaryRange.max,
      }));
      setRawCandidates(candidates);
      setIsLoading(false);
    }
    init();
  }, []);

  // Re-fetch candidates when filters change (debounced)
  useEffect(() => {
    if (!meta) return;
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "1000");
    if (filters.search) params.set("search", filters.search);
    filters.skills.forEach((s) => params.append("skills", s));
    if (filters.location) params.set("location", filters.location);
    if (filters.education) params.set("education", filters.education);
    params.set("salaryMin", String(filters.salaryMin));
    params.set("salaryMax", String(filters.salaryMax));

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/candidates?${params.toString()}`);
      const data = await res.json();
      setRawCandidates(data.candidates);
      setPage(1);
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [filters, meta]);

  const activeBonusSkills = roleSkills[activePresetId] ?? [];

  // Score all candidates client-side whenever weights/activeBonusSkills/rawCandidates change.
  // This lets weight sliders update rankings instantly without a network round-trip.
  const scoredCandidates = useMemo<ScoredCandidate[]>(() => {
    if (!meta) return [];
    return rawCandidates.map((c) => ({
      ...c,
      score: localStrategy.scoreCandidate(c, weights, activeBonusSkills, meta.allSalaries),
    }));
  }, [rawCandidates, weights, activeBonusSkills, meta]);

  const sortedCandidates = useMemo<ScoredCandidate[]>(() => {
    const sorted = [...scoredCandidates];
    if (sortBy === "score") sorted.sort((a, b) => b.score.total - a.score.total);
    else if (sortBy === "salary") {
      sorted.sort((a, b) => {
        const sa = parseFloat((a.annual_salary_expectation["full-time"] ?? "0").replace(/[$,]/g, ""));
        const sb = parseFloat((b.annual_salary_expectation["full-time"] ?? "0").replace(/[$,]/g, ""));
        return sa - sb;
      });
    } else if (sortBy === "experience") {
      sorted.sort((a, b) => b.work_experiences.length - a.work_experiences.length);
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [scoredCandidates, sortBy]);

  const pagedCandidates = useMemo(
    () => sortedCandidates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedCandidates, page]
  );

  const totalPages = Math.ceil(sortedCandidates.length / PAGE_SIZE);

  const teamCandidateIds = useMemo(
    () => new Set(teamSlots.filter((s) => s.candidate).map((s) => s.candidate!.id)),
    [teamSlots]
  );

  const isTeamFull = teamSlots.every((s) => s.candidate !== null);

  function handlePresetSelect(preset: (typeof ROLE_PRESETS)[0]) {
    setActivePresetId(preset.id);
    setWeights(preset.weights);
    const slotIndex = teamSlots.findIndex((s) => s.roleId === preset.id);
    if (slotIndex !== -1) setActiveSlotIndex(slotIndex);
  }

  function handleSlotClick(index: number) {
    setActiveSlotIndex(index);
    const slotRole = teamSlots[index].roleId;
    const preset = PRESET_MAP[slotRole];
    if (preset) {
      setActivePresetId(preset.id);
      setWeights(preset.weights);
    }
  }

  const handleAddToTeam = useCallback(
    (candidate: ScoredCandidate) => {
      setTeamSlots((prev) => {
        const inTeamAt = prev.findIndex((s) => s.candidate?.id === candidate.id);
        if (inTeamAt !== -1) {
          const next = [...prev];
          next[inTeamAt] = { ...next[inTeamAt], candidate: null };
          return next;
        }
        let targetIndex = activeSlotIndex;
        if (prev[targetIndex].candidate !== null) {
          targetIndex = prev.findIndex((s) => s.candidate === null);
        }
        if (targetIndex === -1) return prev;
        const next = [...prev];
        next[targetIndex] = { ...next[targetIndex], candidate };
        const nextEmpty = next.findIndex((s, i) => i > targetIndex && s.candidate === null);
        if (nextEmpty !== -1) setActiveSlotIndex(nextEmpty);
        return next;
      });
    },
    [activeSlotIndex]
  );

  const activeRole = teamSlots[activeSlotIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Mercor Hiring</h1>
            <p className="text-xs text-gray-400">{sortedCandidates.length} candidates</p>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8">
          <input
            type="text"
            placeholder="Search by name, skill, or role..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          {(["score", "salary", "experience", "name"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                sortBy === key
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — presets, weights, filters */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-6">
          <ScoringWeightsPanel
            weights={weights}
            activePresetId={activePresetId}
            presets={ROLE_PRESETS}
            activeRoleSkills={activeBonusSkills}
            allSkills={meta?.skills ?? []}
            onWeightsChange={setWeights}
            onPresetSelect={handlePresetSelect}
            onSkillsChange={(skills) =>
              setRoleSkills((prev) => ({ ...prev, [activePresetId]: skills }))
            }
            onSkillsReset={() =>
              setRoleSkills((prev) => ({
                ...prev,
                [activePresetId]: [...(PRESET_MAP[activePresetId]?.bonusSkills ?? [])],
              }))
            }
          />
          <div className="border-t border-gray-100 pt-4">
            {meta && (
              <FilterSidebar
                filters={filters}
                allSkills={meta.skills}
                allLocations={meta.locations}
                educationLevels={meta.educationLevels}
                salaryRange={meta.salaryRange}
                onChange={(f) => setFilters(f)}
              />
            )}
          </div>
        </aside>

        {/* Main content — candidate grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Active role banner */}
          <div className="mb-4 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
            <span className="text-lg">{activeRole?.roleEmoji}</span>
            <div>
              <p className="text-xs text-indigo-500 font-medium">Currently hiring for</p>
              <p className="text-sm font-semibold text-indigo-900">{activeRole?.roleLabel}</p>
            </div>
            {activeBonusSkills.length > 0 && (
              <div className="ml-auto flex gap-1 flex-wrap max-w-sm justify-end">
                {activeBonusSkills.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading candidates...</p>
              </div>
            </div>
          ) : pagedCandidates.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm">No candidates match your filters.</p>
                <p className="text-xs text-gray-300 mt-1">Try loosening the filters on the left.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onSelect={setSelectedCandidate}
                    onAddToTeam={handleAddToTeam}
                    isInTeam={teamCandidateIds.has(candidate.id)}
                    isTeamFull={isTeamFull}
                    activeRoleLabel={activeRole?.roleLabel ?? "Team"}
                    bonusSkills={activeBonusSkills}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right panel — Team builder */}
        <aside className="w-72 shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-4">
          <TeamPanel
            slots={teamSlots}
            activeSlotIndex={activeSlotIndex}
            onSlotClick={handleSlotClick}
            onRemove={(i) =>
              setTeamSlots((prev) => {
                const next = [...prev];
                next[i] = { ...next[i], candidate: null };
                return next;
              })
            }
          />
        </aside>
      </div>

      {/* Candidate detail modal */}
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          activeRoleLabel={activeRole?.roleLabel ?? "Team"}
          activeRoleEmoji={activeRole?.roleEmoji ?? ""}
          bonusSkills={activeBonusSkills}
          isInTeam={teamCandidateIds.has(selectedCandidate.id)}
          isTeamFull={isTeamFull}
          onClose={() => setSelectedCandidate(null)}
          onAddToTeam={handleAddToTeam}
        />
      )}
    </div>
  );
}
