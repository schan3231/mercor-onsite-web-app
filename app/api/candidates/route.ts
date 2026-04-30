import { NextRequest, NextResponse } from "next/server";
import { getAllCandidates } from "@/lib/data";
import { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const skills = searchParams.getAll("skills");
  const location = searchParams.get("location") ?? "";
  const education = searchParams.get("education") ?? "";
  const salaryMin = parseInt(searchParams.get("salaryMin") ?? "0", 10);
  const salaryMax = parseInt(searchParams.get("salaryMax") ?? "999999", 10);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  let results = getAllCandidates();

  // Full-text search across name and skills
  if (search) {
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.skills.some((s) => s.toLowerCase().includes(search)) ||
        c.work_experiences.some((e) => e.roleName.toLowerCase().includes(search))
    );
  }

  // Skill filter — candidate must have ALL selected skills
  if (skills.length > 0) {
    const lowerSkills = skills.map((s) => s.toLowerCase());
    results = results.filter((c) =>
      lowerSkills.every((skill) =>
        c.skills.some((cs) => cs.toLowerCase() === skill)
      )
    );
  }

  // Location filter — case-insensitive substring match
  if (location) {
    const lowerLoc = location.toLowerCase();
    results = results.filter((c) => c.location.toLowerCase().includes(lowerLoc));
  }

  // Education level filter
  if (education) {
    results = results.filter((c) => c.education.highest_level === education);
  }

  // Salary range filter
  results = results.filter((c) => {
    const raw = c.annual_salary_expectation["full-time"] ?? "";
    const salary = parseFloat(raw.replace(/[$,]/g, ""));
    if (isNaN(salary)) return true; // include if no salary data
    return salary >= salaryMin && salary <= salaryMax;
  });

  const total = results.length;
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

  return NextResponse.json({
    candidates: paged,
    total,
    page,
    pageSize: limit,
  });
}

// Helper for internal use: filter candidates and return all (no pagination)
export function filterCandidates(candidates: Candidate[], params: {
  search?: string;
  skills?: string[];
  location?: string;
  education?: string;
  salaryMin?: number;
  salaryMax?: number;
}): Candidate[] {
  let results = candidates;
  const { search, skills, location, education, salaryMin = 0, salaryMax = 999999 } = params;

  if (search) {
    const lower = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.skills.some((s) => s.toLowerCase().includes(lower))
    );
  }
  if (skills && skills.length > 0) {
    const lowerSkills = skills.map((s) => s.toLowerCase());
    results = results.filter((c) =>
      lowerSkills.every((skill) => c.skills.some((cs) => cs.toLowerCase() === skill))
    );
  }
  if (location) {
    results = results.filter((c) => c.location.toLowerCase().includes(location.toLowerCase()));
  }
  if (education) {
    results = results.filter((c) => c.education.highest_level === education);
  }
  results = results.filter((c) => {
    const raw = c.annual_salary_expectation["full-time"] ?? "";
    const salary = parseFloat(raw.replace(/[$,]/g, ""));
    if (isNaN(salary)) return true;
    return salary >= salaryMin && salary <= salaryMax;
  });

  return results;
}
