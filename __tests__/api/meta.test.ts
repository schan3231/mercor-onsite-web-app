/**
 * @jest-environment node
 */
import { mockAllSalaries } from "@/__tests__/fixtures/mockCandidates";

const mockLocations = ["Argentina", "Brazil", "Canada", "Germany", "United States"];
const mockSkills = ["Docker", "Figma", "HTML/CSS", "JavaScript", "Machine Learning", "Python", "React"];

jest.mock("@/lib/data", () => ({
  ALL_SALARIES: mockAllSalaries,
  getUniqueLocations: jest.fn(() => mockLocations),
  getUniqueSkills: jest.fn(() => mockSkills),
}));

import { GET } from "@/app/api/meta/route";

async function getMeta() {
  const res = await GET();
  return res.json() as Promise<{
    allSalaries: number[];
    locations: string[];
    skills: string[];
    educationLevels: string[];
    salaryRange: { min: number; max: number };
  }>;
}

describe("GET /api/meta", () => {
  it("response contains all required keys", async () => {
    const body = await getMeta();
    expect(body).toHaveProperty("allSalaries");
    expect(body).toHaveProperty("locations");
    expect(body).toHaveProperty("skills");
    expect(body).toHaveProperty("educationLevels");
    expect(body).toHaveProperty("salaryRange");
  });

  it("allSalaries matches the mocked ALL_SALARIES", async () => {
    const body = await getMeta();
    expect(body.allSalaries).toEqual(mockAllSalaries);
  });

  it("salaryRange.min is the first (lowest) salary", async () => {
    const body = await getMeta();
    expect(body.salaryRange.min).toBe(mockAllSalaries[0]);
  });

  it("salaryRange.max is the last (highest) salary", async () => {
    const body = await getMeta();
    expect(body.salaryRange.max).toBe(mockAllSalaries[mockAllSalaries.length - 1]);
  });

  it("educationLevels has exactly 6 entries", async () => {
    const body = await getMeta();
    expect(body.educationLevels).toHaveLength(6);
  });

  it("educationLevels includes Bachelor's Degree and Doctorate", async () => {
    const body = await getMeta();
    expect(body.educationLevels).toContain("Bachelor's Degree");
    expect(body.educationLevels).toContain("Doctorate");
  });

  it("locations matches mocked getUniqueLocations result", async () => {
    const body = await getMeta();
    expect(body.locations).toEqual(mockLocations);
  });

  it("skills matches mocked getUniqueSkills result", async () => {
    const body = await getMeta();
    expect(body.skills).toEqual(mockSkills);
  });
});
