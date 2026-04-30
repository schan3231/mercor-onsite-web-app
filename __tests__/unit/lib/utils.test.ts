import {
  parseSalary,
  formatSalary,
  scoreColor,
  scoreTextColor,
  clamp,
  normalizeWeights,
} from "@/lib/utils";

describe("parseSalary", () => {
  it("parses a standard formatted salary", () => {
    expect(parseSalary("$95,000")).toBe(95000);
  });

  it("parses a salary without comma", () => {
    expect(parseSalary("$95000")).toBe(95000);
  });

  it("parses a large salary with multiple commas", () => {
    expect(parseSalary("$1,234,567")).toBe(1234567);
  });

  it("parses a plain numeric string", () => {
    expect(parseSalary("50000")).toBe(50000);
  });

  it("returns 0 for empty string", () => {
    expect(parseSalary("")).toBe(0);
  });

  it("returns 0 for non-numeric string", () => {
    expect(parseSalary("N/A")).toBe(0);
  });

  it("returns 0 for dollar-only string", () => {
    expect(parseSalary("$")).toBe(0);
  });

  it("handles decimal values", () => {
    expect(parseSalary("$50000.50")).toBeCloseTo(50000.5);
  });
});

describe("formatSalary", () => {
  it("formats a salary with commas", () => {
    expect(formatSalary("$95000")).toBe("$95,000");
  });

  it("formats a large salary", () => {
    expect(formatSalary("$1500000")).toBe("$1,500,000");
  });

  it("returns N/A for empty string", () => {
    expect(formatSalary("")).toBe("N/A");
  });

  it("returns N/A for zero salary", () => {
    expect(formatSalary("$0")).toBe("N/A");
  });

  it("returns N/A for non-numeric input", () => {
    expect(formatSalary("N/A")).toBe("N/A");
  });
});

describe("scoreColor", () => {
  it("returns emerald for scores >= 75", () => {
    expect(scoreColor(75)).toBe("bg-emerald-500");
    expect(scoreColor(100)).toBe("bg-emerald-500");
    expect(scoreColor(90)).toBe("bg-emerald-500");
  });

  it("returns amber for scores 55-74", () => {
    expect(scoreColor(74)).toBe("bg-amber-400");
    expect(scoreColor(55)).toBe("bg-amber-400");
    expect(scoreColor(60)).toBe("bg-amber-400");
  });

  it("returns rose for scores below 55", () => {
    expect(scoreColor(54)).toBe("bg-rose-400");
    expect(scoreColor(0)).toBe("bg-rose-400");
    expect(scoreColor(1)).toBe("bg-rose-400");
  });
});

describe("scoreTextColor", () => {
  it("returns emerald text for scores >= 75", () => {
    expect(scoreTextColor(75)).toBe("text-emerald-600");
    expect(scoreTextColor(100)).toBe("text-emerald-600");
  });

  it("returns amber text for scores 55-74", () => {
    expect(scoreTextColor(74)).toBe("text-amber-600");
    expect(scoreTextColor(55)).toBe("text-amber-600");
  });

  it("returns rose text for scores below 55", () => {
    expect(scoreTextColor(54)).toBe("text-rose-500");
    expect(scoreTextColor(0)).toBe("text-rose-500");
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below min", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("returns max when value is above max", () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("normalizeWeights", () => {
  const baseWeights = {
    education: 25,
    experience: 25,
    skills: 25,
    salaryEfficiency: 25,
  };

  it("always produces weights summing to 100", () => {
    const result = normalizeWeights(baseWeights, "education", 40);
    const total = Object.values(result).reduce((s, v) => s + v, 0);
    expect(total).toBe(100);
  });

  it("sets the changed key to the new value", () => {
    const result = normalizeWeights(baseWeights, "education", 40);
    expect(result.education).toBe(40);
  });

  it("scales other keys proportionally down when one increases", () => {
    const result = normalizeWeights(baseWeights, "education", 70);
    expect(result.education).toBe(70);
    // Others must share the remaining 30
    const otherSum = result.experience + result.skills + result.salaryEfficiency;
    expect(otherSum).toBe(30);
  });

  it("distributes evenly when all other keys are 0", () => {
    const zeroOthers = { education: 0, experience: 0, skills: 0, salaryEfficiency: 0 };
    const result = normalizeWeights(zeroOthers, "education", 40);
    const otherSum = result.experience + result.skills + result.salaryEfficiency;
    expect(result.education).toBe(40);
    expect(otherSum).toBe(60);
    const total = Object.values(result).reduce((s, v) => s + v, 0);
    expect(total).toBe(100);
  });

  it("sets others to 0 when changed key is set to 100", () => {
    const result = normalizeWeights(baseWeights, "education", 100);
    expect(result.education).toBe(100);
    expect(result.experience + result.skills + result.salaryEfficiency).toBe(0);
  });

  it("does not change the changed key itself when computing others", () => {
    const weights = { education: 50, experience: 20, skills: 20, salaryEfficiency: 10 };
    const result = normalizeWeights(weights, "skills", 60);
    expect(result.skills).toBe(60);
    const total = Object.values(result).reduce((s, v) => s + v, 0);
    expect(total).toBe(100);
  });
});
