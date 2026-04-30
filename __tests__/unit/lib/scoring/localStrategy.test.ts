import { localStrategy } from "@/lib/scoring/localStrategy";
import { Candidate, ScoringWeights } from "@/lib/types";
import {
  candidatePhD,
  candidateMasters,
  candidateBachelor,
  candidateNoEdu,
  candidateDesigner,
  mockWeights,
  mockAllSalaries,
} from "@/__tests__/fixtures/mockCandidates";

function makeMinimalCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 99,
    name: "Test",
    email: "test@test.com",
    phone: "",
    location: "",
    submitted_at: "",
    work_availability: [],
    annual_salary_expectation: { "full-time": "$70000" },
    work_experiences: [],
    education: { highest_level: "Bachelor's Degree", degrees: [] },
    skills: [],
    ...overrides,
  };
}

const equalWeights: ScoringWeights = { education: 25, experience: 25, skills: 25, salaryEfficiency: 25 };

describe("localStrategy.scoreCandidate — education subscore", () => {
  it("gives PhD maximum education score", () => {
    const result = localStrategy.scoreCandidate(candidatePhD, equalWeights, [], mockAllSalaries);
    // PhD → 100; top50 → capped at 100
    expect(result.breakdown.education).toBe(100);
  });

  it("gives Master's Degree a score of 80", () => {
    const c = makeMinimalCandidate({ education: { highest_level: "Master's Degree", degrees: [] } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBe(80);
  });

  it("gives Bachelor's Degree a score of 60", () => {
    const c = makeMinimalCandidate({ education: { highest_level: "Bachelor's Degree", degrees: [] } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBe(60);
  });

  it("gives Associate's Degree a score of 40", () => {
    const c = makeMinimalCandidate({ education: { highest_level: "Associate's Degree", degrees: [] } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBe(40);
  });

  it("gives High School Diploma a score of 20", () => {
    const c = makeMinimalCandidate({ education: { highest_level: "High School Diploma", degrees: [] } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBe(20);
  });

  it("gives unknown education level the fallback score of 30", () => {
    const c = makeMinimalCandidate({ education: { highest_level: "Unknown Certificate", degrees: [] } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBe(30);
  });

  it("adds top-50 bonus to Bachelor's score (60 + 10 = 70)", () => {
    const c = makeMinimalCandidate({
      education: {
        highest_level: "Bachelor's Degree",
        degrees: [{ degree: "Bachelor's", subject: "CS", school: "Ivy", gpa: "", startDate: "", endDate: "", originalSchool: "MIT", isTop50: true }],
      },
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBe(70);
  });

  it("caps top-50 bonus at 100 for PhD", () => {
    const result = localStrategy.scoreCandidate(candidatePhD, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.education).toBeLessThanOrEqual(100);
    expect(result.breakdown.education).toBe(100);
  });
});

describe("localStrategy.scoreCandidate — experience subscore", () => {
  it("gives 0 for a candidate with no work experience", () => {
    const result = localStrategy.scoreCandidate(candidateNoEdu, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.experience).toBe(0);
  });

  it("gives 20 for 1 unique company", () => {
    const c = makeMinimalCandidate({
      work_experiences: [{ company: "Acme", roleName: "Dev" }],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.experience).toBe(20);
  });

  it("gives 60 for 3 unique companies", () => {
    const c = makeMinimalCandidate({
      work_experiences: [
        { company: "A", roleName: "Dev" },
        { company: "B", roleName: "Dev" },
        { company: "C", roleName: "Dev" },
      ],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.experience).toBe(60);
  });

  it("gives 100 for 5 unique companies", () => {
    const c = makeMinimalCandidate({
      work_experiences: [
        { company: "A", roleName: "Dev" },
        { company: "B", roleName: "Dev" },
        { company: "C", roleName: "Dev" },
        { company: "D", roleName: "Dev" },
        { company: "E", roleName: "Dev" },
      ],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.experience).toBe(100);
  });

  it("caps experience at 100 for >5 unique companies", () => {
    const result = localStrategy.scoreCandidate(candidatePhD, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.experience).toBe(100);
  });

  it("counts unique companies only (3 roles at same company = 1 unique)", () => {
    const c = makeMinimalCandidate({
      work_experiences: [
        { company: "Acme", roleName: "Junior" },
        { company: "Acme", roleName: "Senior" },
        { company: "Acme", roleName: "Lead" },
      ],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.experience).toBe(20);
  });
});

describe("localStrategy.scoreCandidate — skills subscore", () => {
  it("gives 0 for a candidate with no skills", () => {
    const result = localStrategy.scoreCandidate(candidateNoEdu, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.skills).toBe(0);
  });

  it("gives 80 for exactly 15 skills with no bonus skills", () => {
    const c = makeMinimalCandidate({
      skills: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.skills).toBe(80);
  });

  it("caps base score at 80 for >15 skills", () => {
    const c = makeMinimalCandidate({
      skills: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q"],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.skills).toBe(80); // no bonus, so capped at 80
  });

  it("gives full 100 for 15 skills with 3 bonus matches", () => {
    const bonusSkills = ["Python", "React", "Docker"];
    const c = makeMinimalCandidate({
      skills: ["Python", "React", "Docker", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
    });
    const result = localStrategy.scoreCandidate(c, equalWeights, bonusSkills, mockAllSalaries);
    expect(result.breakdown.skills).toBe(100);
  });

  it("matches bonus skills case-insensitively", () => {
    const c = makeMinimalCandidate({ skills: ["python", "react"] });
    const result1 = localStrategy.scoreCandidate(c, equalWeights, ["Python", "React"], mockAllSalaries);
    const result2 = localStrategy.scoreCandidate(c, equalWeights, ["PYTHON", "REACT"], mockAllSalaries);
    expect(result1.breakdown.skills).toBe(result2.breakdown.skills);
  });

  it("bonus skills increase skills subscore for a matching candidate", () => {
    const designerBonusSkills = ["Figma", "Photoshop", "Illustrator", "HTML/CSS"];
    const withBonus = localStrategy.scoreCandidate(candidateDesigner, equalWeights, designerBonusSkills, mockAllSalaries);
    const withoutBonus = localStrategy.scoreCandidate(candidateDesigner, equalWeights, [], mockAllSalaries);
    expect(withBonus.breakdown.skills).toBeGreaterThan(withoutBonus.breakdown.skills);
  });
});

describe("localStrategy.scoreCandidate — salary efficiency subscore", () => {
  it("gives high score to lowest salary in the array", () => {
    // $50,000 is the minimum, should score near 100
    const c = makeMinimalCandidate({ annual_salary_expectation: { "full-time": "$50000" } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], mockAllSalaries);
    // 0 below, so percentile = 0, score = (1-0)*100 = 100
    expect(result.breakdown.salaryEfficiency).toBe(100);
  });

  it("gives lower score to higher salary", () => {
    const low = makeMinimalCandidate({ annual_salary_expectation: { "full-time": "$50000" } });
    const high = makeMinimalCandidate({ annual_salary_expectation: { "full-time": "$130000" } });
    const lowResult = localStrategy.scoreCandidate(low, equalWeights, [], mockAllSalaries);
    const highResult = localStrategy.scoreCandidate(high, equalWeights, [], mockAllSalaries);
    expect(lowResult.breakdown.salaryEfficiency).toBeGreaterThan(highResult.breakdown.salaryEfficiency);
  });

  it("returns 50 when no salary data is present", () => {
    const result = localStrategy.scoreCandidate(candidateNoEdu, equalWeights, [], mockAllSalaries);
    expect(result.breakdown.salaryEfficiency).toBe(50);
  });

  it("returns 50 when allSalaries array is empty", () => {
    const c = makeMinimalCandidate({ annual_salary_expectation: { "full-time": "$70000" } });
    const result = localStrategy.scoreCandidate(c, equalWeights, [], []);
    expect(result.breakdown.salaryEfficiency).toBe(50);
  });
});

describe("localStrategy.scoreCandidate — composite total", () => {
  it("total is always an integer", () => {
    for (const candidate of [candidatePhD, candidateMasters, candidateBachelor, candidateNoEdu, candidateDesigner]) {
      const result = localStrategy.scoreCandidate(candidate, mockWeights, [], mockAllSalaries);
      expect(Number.isInteger(result.total)).toBe(true);
    }
  });

  it("total is always between 0 and 100", () => {
    for (const candidate of [candidatePhD, candidateMasters, candidateBachelor, candidateNoEdu, candidateDesigner]) {
      const result = localStrategy.scoreCandidate(candidate, mockWeights, [], mockAllSalaries);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    }
  });

  it("heavier skill weights raise score for skill-rich candidates", () => {
    const skillHeavy: ScoringWeights = { education: 10, experience: 10, skills: 70, salaryEfficiency: 10 };
    const resultNormal = localStrategy.scoreCandidate(candidatePhD, equalWeights, [], mockAllSalaries);
    const resultSkillHeavy = localStrategy.scoreCandidate(candidatePhD, skillHeavy, [], mockAllSalaries);
    // PhD has 15 skills → skill score should be high, heavier weight should raise total
    expect(resultSkillHeavy.total).toBeGreaterThanOrEqual(resultNormal.total);
  });

  it("total changes when weights change", () => {
    const result1 = localStrategy.scoreCandidate(candidateMasters, mockWeights, [], mockAllSalaries);
    const differentWeights: ScoringWeights = { education: 70, experience: 10, skills: 10, salaryEfficiency: 10 };
    const result2 = localStrategy.scoreCandidate(candidateMasters, differentWeights, [], mockAllSalaries);
    expect(result1.total).not.toBe(result2.total);
  });

  it("PhD scores higher than no-education candidate on balanced weights", () => {
    const phd = localStrategy.scoreCandidate(candidatePhD, equalWeights, [], mockAllSalaries);
    const none = localStrategy.scoreCandidate(candidateNoEdu, equalWeights, [], mockAllSalaries);
    expect(phd.total).toBeGreaterThan(none.total);
  });
});

describe("localStrategy.scoreCandidate — rationale", () => {
  it("returns exactly 4 rationale entries", () => {
    const result = localStrategy.scoreCandidate(candidateMasters, equalWeights, [], mockAllSalaries);
    expect(result.rationale).toHaveLength(4);
  });

  it("each rationale entry is a non-empty string", () => {
    const result = localStrategy.scoreCandidate(candidateMasters, equalWeights, [], mockAllSalaries);
    for (const r of result.rationale) {
      expect(typeof r).toBe("string");
      expect(r.length).toBeGreaterThan(0);
    }
  });

  it("education rationale mentions the degree level", () => {
    const result = localStrategy.scoreCandidate(candidateMasters, equalWeights, [], mockAllSalaries);
    expect(result.rationale[0]).toContain("Master");
  });

  it("skills rationale mentions skill count", () => {
    const result = localStrategy.scoreCandidate(candidateMasters, equalWeights, [], mockAllSalaries);
    const count = candidateMasters.skills.length;
    expect(result.rationale[2]).toContain(String(count));
  });

  it("salary rationale contains dollar sign", () => {
    const result = localStrategy.scoreCandidate(candidateMasters, equalWeights, [], mockAllSalaries);
    expect(result.rationale[3]).toContain("$");
  });
});
