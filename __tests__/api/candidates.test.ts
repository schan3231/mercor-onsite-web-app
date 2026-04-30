/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { mockCandidates } from "@/__tests__/fixtures/mockCandidates";

// Mock the data module before importing the route handler
jest.mock("@/lib/data", () => ({
  getAllCandidates: jest.fn(() => mockCandidates),
}));

import { GET } from "@/app/api/candidates/route";

function makeRequest(queryString = ""): NextRequest {
  return new NextRequest(`http://localhost/api/candidates?${queryString}`);
}

async function getBody(req: NextRequest) {
  const res = await GET(req);
  return res.json() as Promise<{
    candidates: typeof mockCandidates;
    total: number;
    page: number;
    pageSize: number;
  }>;
}

describe("GET /api/candidates — no filters", () => {
  it("returns all candidates when no filters are applied", async () => {
    const body = await getBody(makeRequest("limit=100"));
    expect(body.total).toBe(mockCandidates.length);
  });

  it("returns page 1 by default", async () => {
    const body = await getBody(makeRequest());
    expect(body.page).toBe(1);
  });

  it("returns default pageSize of 20 when no limit specified", async () => {
    const body = await getBody(makeRequest());
    expect(body.pageSize).toBe(20);
  });

  it("returns all candidates when limit exceeds total count", async () => {
    const body = await getBody(makeRequest("limit=100"));
    expect(body.candidates).toHaveLength(mockCandidates.length);
  });
});

describe("GET /api/candidates — search filter", () => {
  it("filters by skill match (case-insensitive)", async () => {
    const body = await getBody(makeRequest("search=python&limit=100"));
    // candidatePhD has Python skill
    for (const c of body.candidates) {
      const hasMatch =
        c.name.toLowerCase().includes("python") ||
        c.skills.some((s: string) => s.toLowerCase().includes("python")) ||
        c.work_experiences.some((e: { roleName: string }) => e.roleName.toLowerCase().includes("python"));
      expect(hasMatch).toBe(true);
    }
  });

  it("filters by role name", async () => {
    const body = await getBody(makeRequest("search=designer&limit=100"));
    // candidateDesigner has "Designer" roles
    expect(body.candidates.some((c) => c.name === "Eve Designer")).toBe(true);
  });

  it("returns all candidates for an empty search string", async () => {
    const body = await getBody(makeRequest("search=&limit=100"));
    expect(body.total).toBe(mockCandidates.length);
  });

  it("returns empty results for a search with no matches", async () => {
    const body = await getBody(makeRequest("search=zzznomatch&limit=100"));
    expect(body.candidates).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("search is case-insensitive", async () => {
    const lower = await getBody(makeRequest("search=figma&limit=100"));
    const upper = await getBody(makeRequest("search=FIGMA&limit=100"));
    expect(lower.total).toBe(upper.total);
  });
});

describe("GET /api/candidates — skills filter (must-have AND logic)", () => {
  it("returns candidates with a specific skill", async () => {
    const body = await getBody(makeRequest("skills=Figma&limit=100"));
    // Only candidateDesigner has Figma
    expect(body.candidates.every((c) => c.skills.some((s: string) => s.toLowerCase() === "figma"))).toBe(true);
  });

  it("requires ALL specified skills (AND logic)", async () => {
    // candidateMasters has React and TypeScript; candidatePhD also has React/TypeScript
    const body = await getBody(makeRequest("skills=React&skills=TypeScript&limit=100"));
    for (const c of body.candidates) {
      const lowerSkills = c.skills.map((s: string) => s.toLowerCase());
      expect(lowerSkills).toContain("react");
      expect(lowerSkills).toContain("typescript");
    }
  });

  it("returns empty when no candidate has all required skills", async () => {
    const body = await getBody(makeRequest("skills=Figma&skills=Python&limit=100"));
    // No candidate has both Figma and Python
    expect(body.total).toBe(0);
  });
});

describe("GET /api/candidates — location filter", () => {
  it("filters by exact country name", async () => {
    const body = await getBody(makeRequest("location=United States&limit=100"));
    expect(body.candidates.every((c) => c.location.toLowerCase().includes("united states"))).toBe(true);
  });

  it("matches partial location strings", async () => {
    const body = await getBody(makeRequest("location=Canada&limit=100"));
    expect(body.candidates.every((c) => c.location.toLowerCase().includes("canada"))).toBe(true);
  });

  it("returns empty for unknown location", async () => {
    const body = await getBody(makeRequest("location=Atlantis&limit=100"));
    expect(body.total).toBe(0);
  });
});

describe("GET /api/candidates — education filter", () => {
  it("returns only candidates with exact education level", async () => {
    const body = await getBody(makeRequest("education=Bachelor's Degree&limit=100"));
    for (const c of body.candidates) {
      expect(c.education.highest_level).toBe("Bachelor's Degree");
    }
  });

  it("returns only doctorate candidates", async () => {
    const body = await getBody(makeRequest("education=Doctorate&limit=100"));
    expect(body.candidates.every((c) => c.education.highest_level === "Doctorate")).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for an education level not in dataset", async () => {
    const body = await getBody(makeRequest("education=Nonexistent Level&limit=100"));
    expect(body.total).toBe(0);
  });
});

describe("GET /api/candidates — salary filter", () => {
  it("filters out candidates above salaryMax", async () => {
    // Only candidateBachelor ($50k) and candidateDesigner ($70k) should appear
    const body = await getBody(makeRequest("salaryMax=80000&limit=100"));
    for (const c of body.candidates) {
      const salary = parseFloat((c.annual_salary_expectation["full-time"] ?? "0").replace(/[$,]/g, ""));
      if (salary > 0) expect(salary).toBeLessThanOrEqual(80000);
    }
  });

  it("filters out candidates below salaryMin", async () => {
    const body = await getBody(makeRequest("salaryMin=100000&limit=100"));
    for (const c of body.candidates) {
      const salary = parseFloat((c.annual_salary_expectation["full-time"] ?? "0").replace(/[$,]/g, ""));
      if (salary > 0) expect(salary).toBeGreaterThanOrEqual(100000);
    }
  });

  it("includes candidates with no salary data regardless of range", async () => {
    // candidateNoEdu has no salary; should be included in any range filter
    const body = await getBody(makeRequest("salaryMin=60000&salaryMax=80000&limit=100"));
    const noSalary = body.candidates.find((c) => c.name === "Dave Minimal");
    expect(noSalary).toBeDefined();
  });

  it("returns empty when range excludes all known salaries", async () => {
    const body = await getBody(makeRequest("salaryMin=200000&salaryMax=300000&limit=100"));
    // Only candidateNoEdu (no salary) passes; all others fail the range
    const named = body.candidates.filter((c) => c.annual_salary_expectation["full-time"]);
    expect(named).toHaveLength(0);
  });
});

describe("GET /api/candidates — pagination", () => {
  it("returns first N candidates on page 1", async () => {
    const body = await getBody(makeRequest("limit=2&page=1"));
    expect(body.candidates).toHaveLength(2);
    expect(body.page).toBe(1);
  });

  it("returns next N candidates on page 2", async () => {
    const page1 = await getBody(makeRequest("limit=2&page=1"));
    const page2 = await getBody(makeRequest("limit=2&page=2"));
    const page1Ids = page1.candidates.map((c) => c.id);
    const page2Ids = page2.candidates.map((c) => c.id);
    expect(page1Ids).not.toEqual(page2Ids);
  });

  it("returns correct total even when paginated", async () => {
    const body = await getBody(makeRequest("limit=2&page=1"));
    expect(body.total).toBe(mockCandidates.length);
  });

  it("returns empty candidates array for out-of-range page", async () => {
    const body = await getBody(makeRequest("limit=10&page=999"));
    expect(body.candidates).toHaveLength(0);
    expect(body.total).toBe(mockCandidates.length);
  });

  it("clamps limit to max 100", async () => {
    const body = await getBody(makeRequest("limit=500"));
    expect(body.pageSize).toBe(100);
  });

  it("clamps limit to min 1", async () => {
    const body = await getBody(makeRequest("limit=0"));
    expect(body.pageSize).toBe(1);
  });
});
