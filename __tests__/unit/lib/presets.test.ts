import { ROLE_PRESETS, PRESET_MAP, DEFAULT_TEAM_SLOTS } from "@/lib/presets";

describe("ROLE_PRESETS", () => {
  it("has exactly 6 presets", () => {
    expect(ROLE_PRESETS).toHaveLength(6);
  });

  it("each preset has all required fields", () => {
    for (const preset of ROLE_PRESETS) {
      expect(preset).toHaveProperty("id");
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("emoji");
      expect(preset).toHaveProperty("description");
      expect(preset).toHaveProperty("weights");
      expect(preset).toHaveProperty("bonusSkills");
      expect(Array.isArray(preset.bonusSkills)).toBe(true);
    }
  });

  it("every preset's weights sum to 100", () => {
    for (const preset of ROLE_PRESETS) {
      const total =
        preset.weights.education +
        preset.weights.experience +
        preset.weights.skills +
        preset.weights.salaryEfficiency;
      expect(total).toBe(100);
    }
  });

  it("includes a balanced preset", () => {
    const balanced = ROLE_PRESETS.find((p) => p.id === "balanced");
    expect(balanced).toBeDefined();
  });

  it("includes COO, CTO, engineer, designer, data presets", () => {
    const ids = ROLE_PRESETS.map((p) => p.id);
    expect(ids).toContain("coo");
    expect(ids).toContain("cto");
    expect(ids).toContain("engineer");
    expect(ids).toContain("designer");
    expect(ids).toContain("data");
  });

  it("COO preset prioritizes experience weight", () => {
    const coo = ROLE_PRESETS.find((p) => p.id === "coo")!;
    expect(coo.weights.experience).toBeGreaterThan(coo.weights.education);
    expect(coo.weights.experience).toBeGreaterThan(coo.weights.skills);
  });

  it("designer preset prioritizes skills weight", () => {
    const designer = ROLE_PRESETS.find((p) => p.id === "designer")!;
    expect(designer.weights.skills).toBeGreaterThanOrEqual(designer.weights.experience);
  });
});

describe("PRESET_MAP", () => {
  it("keys match all preset ids", () => {
    for (const preset of ROLE_PRESETS) {
      expect(PRESET_MAP[preset.id]).toBeDefined();
      expect(PRESET_MAP[preset.id].id).toBe(preset.id);
    }
  });

  it("balanced preset is accessible by key", () => {
    expect(PRESET_MAP["balanced"].id).toBe("balanced");
  });

  it("has no extra keys beyond the presets", () => {
    expect(Object.keys(PRESET_MAP)).toHaveLength(ROLE_PRESETS.length);
  });
});

describe("DEFAULT_TEAM_SLOTS", () => {
  it("has exactly 5 slots", () => {
    expect(DEFAULT_TEAM_SLOTS).toHaveLength(5);
  });

  it("each slot starts with candidate: null", () => {
    for (const slot of DEFAULT_TEAM_SLOTS) {
      expect(slot.candidate).toBeNull();
    }
  });

  it("each slot has roleId, roleLabel, roleEmoji", () => {
    for (const slot of DEFAULT_TEAM_SLOTS) {
      expect(typeof slot.roleId).toBe("string");
      expect(typeof slot.roleLabel).toBe("string");
      expect(typeof slot.roleEmoji).toBe("string");
    }
  });

  it("COO is the first slot", () => {
    expect(DEFAULT_TEAM_SLOTS[0].roleId).toBe("coo");
  });

  it("slot role ids correspond to existing presets (excluding balanced)", () => {
    for (const slot of DEFAULT_TEAM_SLOTS) {
      expect(PRESET_MAP[slot.roleId]).toBeDefined();
      expect(slot.roleId).not.toBe("balanced");
    }
  });
});
