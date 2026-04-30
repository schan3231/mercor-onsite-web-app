"use client";

import { useEffect, useState } from "react";
import { ScoredCandidate } from "@/lib/types";
import { parseSalary, formatSalary, scoreColor } from "@/lib/utils";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";

interface HiredMember extends ScoredCandidate {
  roleLabel: string;
  roleEmoji: string;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  education: "Education",
  experience: "Experience",
  skills: "Skills",
  salaryEfficiency: "Salary Fit",
};

function generateRationale(member: HiredMember): string {
  const { score, education, work_experiences, skills } = member;
  const { breakdown, rationale } = score;

  const topFactor = Object.entries(breakdown).sort(([, a], [, b]) => b - a)[0][0];
  const topFactorLabel = BREAKDOWN_LABELS[topFactor] ?? topFactor;

  const eduStr = education.highest_level;
  const expCount = work_experiences.length;
  const skillsSample = skills.slice(0, 3).join(", ");

  return (
    `${member.name} is an excellent ${member.roleLabel} hire, scoring ${score.total}/100 overall. ` +
    `Their strongest dimension is ${topFactorLabel} (${breakdown[topFactor as keyof typeof breakdown]}/100). ` +
    `With ${eduStr.toLowerCase()} credentials, ${expCount} professional roles, and expertise in ${skillsSample}, ` +
    `they bring the right combination of depth and range for this position.`
  );
}

export default function TeamPage() {
  const [team, setTeam] = useState<(HiredMember | null)[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("hiredTeam");
    if (raw) {
      setTeam(JSON.parse(raw));
    }
  }, []);

  const hiredMembers = team.filter((m): m is HiredMember => m !== null);

  if (hiredMembers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">👥</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No team selected yet</h2>
          <p className="text-gray-400 mb-6">Go back and add candidates to your team first.</p>
          <Link href="/" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700">
            ← Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  // Team analysis
  const totalSalary = hiredMembers.reduce((s, m) => s + parseSalary(m.annual_salary_expectation["full-time"] ?? ""), 0);
  const avgSalary = totalSalary / hiredMembers.length;
  const avgScore = Math.round(hiredMembers.reduce((s, m) => s + m.score.total, 0) / hiredMembers.length);

  const allSkills = new Set<string>();
  hiredMembers.forEach((m) => m.skills.forEach((s) => allSkills.add(s)));

  const countries = [...new Set(hiredMembers.map((m) => m.location).filter(Boolean))];
  const educationLevels = [...new Set(hiredMembers.map((m) => m.education.highest_level).filter(Boolean))];

  const topSkills = [...allSkills].slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h1 className="font-bold text-gray-900 text-xl">Your Hired Team</h1>
              <p className="text-xs text-gray-400">5 candidates selected for your startup</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            ← Edit team
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-10">
        {/* Team at a glance */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{avgScore}</p>
            <p className="text-xs text-gray-400 mt-1">Avg score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">${(totalSalary / 1000).toFixed(0)}k</p>
            <p className="text-xs text-gray-400 mt-1">Total salary/yr</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{countries.length}</p>
            <p className="text-xs text-gray-400 mt-1">Countries represented</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-rose-500">{allSkills.size}</p>
            <p className="text-xs text-gray-400 mt-1">Unique skills</p>
          </div>
        </section>

        {/* Individual hires */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">The Team</h2>
          <div className="space-y-5">
            {hiredMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start gap-5">
                  {/* Score */}
                  <ScoreBadge score={member.score.total} size="lg" />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-lg">{member.roleEmoji}</span>
                      <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {member.roleLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {member.location} · {member.education.highest_level}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">
                      {formatSalary(member.annual_salary_expectation["full-time"] ?? "")}/yr ·{" "}
                      {member.work_experiences.length} roles
                    </p>

                    {/* Rationale */}
                    <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-100 mb-4">
                      {generateRationale(member)}
                    </p>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(member.score.breakdown).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{BREAKDOWN_LABELS[key] ?? key}</span>
                            <span className="font-semibold text-gray-700">{value}/100</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreColor(value)}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team diversity analysis */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Geographic spread */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Geographic Diversity</h3>
            <div className="space-y-2">
              {hiredMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 text-sm">
                  <span className="text-base">{m.roleEmoji}</span>
                  <span className="text-gray-700 font-medium">{m.roleLabel}</span>
                  <span className="text-gray-400 ml-auto">{m.location || "Unknown"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Education mix */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Education Mix</h3>
            <div className="space-y-2">
              {educationLevels.map((level) => {
                const count = hiredMembers.filter((m) => m.education.highest_level === level).length;
                return (
                  <div key={level} className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-gray-700">{level}</span>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${(count / hiredMembers.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill coverage */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-3">Collective Skill Coverage</h3>
            <div className="flex flex-wrap gap-1.5">
              {topSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
              {allSkills.size > 20 && (
                <span className="text-xs text-gray-400 px-2.5 py-1">
                  +{allSkills.size - 20} more
                </span>
              )}
            </div>
          </div>

          {/* Salary breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-3">Salary Breakdown</h3>
            <div className="grid grid-cols-5 gap-3">
              {hiredMembers.map((m) => {
                const salary = parseSalary(m.annual_salary_expectation["full-time"] ?? "");
                const pct = (salary / totalSalary) * 100;
                return (
                  <div key={m.id} className="text-center">
                    <div
                      className="mx-auto rounded-full w-10 h-10 flex items-center justify-center text-lg mb-1 bg-gray-50 border border-gray-200"
                    >
                      {m.roleEmoji}
                    </div>
                    <p className="text-xs font-semibold text-gray-700">
                      ${(salary / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-gray-400">{pct.toFixed(0)}%</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-right">
              Avg: {formatSalary(`$${avgSalary.toFixed(0)}`)}/yr per person
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
