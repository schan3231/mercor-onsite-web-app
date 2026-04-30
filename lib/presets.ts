import { RolePreset, TeamSlot } from "./types";

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    emoji: "⚖️",
    description: "Equal weighting across all factors. Good starting point.",
    weights: { education: 25, experience: 25, skills: 30, salaryEfficiency: 20 },
    bonusSkills: [],
  },
  {
    id: "coo",
    label: "COO",
    emoji: "👔",
    description:
      "Operational excellence. Rewards process ownership, cross-functional leadership, and execution track record.",
    weights: { education: 20, experience: 40, skills: 25, salaryEfficiency: 15 },
    bonusSkills: ["Operations", "Project Management", "Strategic Planning", "Leadership", "Process Improvement"],
  },
  {
    id: "cto",
    label: "CTO",
    emoji: "🛠️",
    description:
      "Technically deep. Emphasizes engineering skills, CS education, and cloud/infra experience.",
    weights: { education: 30, experience: 20, skills: 40, salaryEfficiency: 10 },
    bonusSkills: ["Python", "Amazon Web Services", "Docker", "Machine Learning", "Microservices", "Java", "Kubernetes", "System Design", "TypeScript"],
  },
  {
    id: "engineer",
    label: "Senior Engineer",
    emoji: "💻",
    description:
      "Builder role. Heavy weighting on practical skills and hands-on experience.",
    weights: { education: 10, experience: 35, skills: 45, salaryEfficiency: 10 },
    bonusSkills: ["React", "TypeScript", "Node JS", "REST APIs", "PostgreSQL", "JavaScript", "Next.js", "GraphQL", "MongoDB"],
  },
  {
    id: "designer",
    label: "Product Designer",
    emoji: "🎨",
    description:
      "UX/UI focus. Rewards design tools, visual skills, and front-end craft.",
    weights: { education: 10, experience: 30, skills: 50, salaryEfficiency: 10 },
    bonusSkills: ["Figma", "Photoshop", "Illustrator", "HTML/CSS", "UX", "UI Design", "Adobe XD", "Sketch", "User Research"],
  },
  {
    id: "data",
    label: "Data / ML",
    emoji: "📊",
    description:
      "Analytics and machine learning. Rewards Python, SQL, data tooling, and relevant education.",
    weights: { education: 20, experience: 30, skills: 40, salaryEfficiency: 10 },
    bonusSkills: ["Python", "SQL", "Machine Learning", "Data Analysis", "TensorFlow", "R", "PyTorch", "Pandas", "Statistics", "PostgreSQL"],
  },
];

export const PRESET_MAP: Record<string, RolePreset> = Object.fromEntries(
  ROLE_PRESETS.map((p) => [p.id, p])
);

export const DEFAULT_TEAM_SLOTS: TeamSlot[] = [
  { roleId: "coo", roleLabel: "COO", roleEmoji: "👔", candidate: null },
  { roleId: "cto", roleLabel: "CTO", roleEmoji: "🛠️", candidate: null },
  { roleId: "engineer", roleLabel: "Senior Engineer", roleEmoji: "💻", candidate: null },
  { roleId: "designer", roleLabel: "Product Designer", roleEmoji: "🎨", candidate: null },
  { roleId: "data", roleLabel: "Data / ML", roleEmoji: "📊", candidate: null },
];
