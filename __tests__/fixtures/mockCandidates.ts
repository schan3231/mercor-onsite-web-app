import { Candidate, ScoredCandidate, ScoringWeights } from "@/lib/types";

export const mockWeights: ScoringWeights = {
  education: 25,
  experience: 25,
  skills: 25,
  salaryEfficiency: 25,
};

// Sorted salary array for percentile calculations (5 values)
export const mockAllSalaries = [50000, 70000, 90000, 110000, 130000];

function makeScore(total = 70): ScoredCandidate["score"] {
  return {
    total,
    breakdown: { education: 70, experience: 60, skills: 80, salaryEfficiency: 50 },
    rationale: ["Master's Degree", "3 companies across 5 roles", "8 skills", "$90,000/yr"],
  };
}

export const candidatePhD: Candidate = {
  id: 0,
  name: "Alice PhD",
  email: "alice@example.com",
  phone: "1234567890",
  location: "United States",
  submitted_at: "2025-01-01 00:00:00.000000",
  work_availability: ["full-time"],
  annual_salary_expectation: { "full-time": "$130000" },
  work_experiences: [
    { company: "Google", roleName: "Staff Engineer" },
    { company: "Meta", roleName: "Senior Engineer" },
    { company: "Apple", roleName: "Engineer" },
    { company: "Microsoft", roleName: "Intern" },
    { company: "Amazon", roleName: "SDE II" },
    { company: "Stripe", roleName: "SDE III" },
    { company: "OpenAI", roleName: "Research Scientist" },
  ],
  education: {
    highest_level: "Doctorate",
    degrees: [
      {
        degree: "Doctorate",
        subject: "Computer Science",
        school: "Ivy League",
        gpa: "GPA 4.0",
        startDate: "2015",
        endDate: "2021",
        originalSchool: "MIT",
        isTop50: true,
      },
    ],
  },
  skills: ["Python", "Machine Learning", "React", "TypeScript", "AWS", "Docker", "SQL", "TensorFlow", "Kubernetes", "Go", "Rust", "Java", "C++", "Spark", "Scala"],
};

export const candidateMasters: Candidate = {
  id: 1,
  name: "Bob Masters",
  email: "bob@example.com",
  phone: "0987654321",
  location: "Canada",
  submitted_at: "2025-01-15 00:00:00.000000",
  work_availability: ["full-time", "part-time"],
  annual_salary_expectation: { "full-time": "$90000" },
  work_experiences: [
    { company: "Shopify", roleName: "Full Stack Developer" },
    { company: "Stripe", roleName: "Backend Developer" },
    { company: "Cloudflare", roleName: "Systems Engineer" },
  ],
  education: {
    highest_level: "Master's Degree",
    degrees: [
      {
        degree: "Master's Degree",
        subject: "Software Engineering",
        school: "State Universities",
        gpa: "GPA 3.7-4.0",
        startDate: "2018",
        endDate: "2020",
        originalSchool: "University of Toronto",
        isTop50: false,
      },
    ],
  },
  skills: ["Node JS", "React", "TypeScript", "PostgreSQL", "REST APIs", "Docker", "JavaScript", "GraphQL"],
};

export const candidateBachelor: Candidate = {
  id: 2,
  name: "Carol Bachelor",
  email: "carol@example.com",
  phone: "1112223333",
  location: "Brazil",
  submitted_at: "2025-01-20 00:00:00.000000",
  work_availability: ["full-time"],
  annual_salary_expectation: { "full-time": "$50000" },
  work_experiences: [
    { company: "StartupX", roleName: "Junior Developer" },
  ],
  education: {
    highest_level: "Bachelor's Degree",
    degrees: [
      {
        degree: "Bachelor's Degree",
        subject: "Information Technology",
        school: "International Institutions",
        gpa: "GPA 3.0-3.4",
        startDate: "2019",
        endDate: "2023",
        originalSchool: "State University of São Paulo",
        isTop50: false,
      },
    ],
  },
  skills: ["HTML/CSS", "JavaScript", "PHP"],
};

export const candidateNoEdu: Candidate = {
  id: 3,
  name: "Dave Minimal",
  email: "dave@example.com",
  phone: "4445556666",
  location: "Argentina",
  submitted_at: "2025-01-22 00:00:00.000000",
  work_availability: ["part-time"],
  annual_salary_expectation: {},
  work_experiences: [],
  education: {
    highest_level: "",
    degrees: [],
  },
  skills: [],
};

export const candidateDesigner: Candidate = {
  id: 4,
  name: "Eve Designer",
  email: "eve@example.com",
  phone: "7778889999",
  location: "Germany",
  submitted_at: "2025-01-25 00:00:00.000000",
  work_availability: ["full-time"],
  annual_salary_expectation: { "full-time": "$70000" },
  work_experiences: [
    { company: "DesignCo", roleName: "UI Designer" },
    { company: "CreativeAgency", roleName: "UX Designer" },
    { company: "ProductHouse", roleName: "Product Designer" },
  ],
  education: {
    highest_level: "Bachelor's Degree",
    degrees: [
      {
        degree: "Bachelor's Degree",
        subject: "Graphic Design",
        school: "International Institutions",
        gpa: "GPA 3.5-3.9",
        startDate: "2015",
        endDate: "2019",
        originalSchool: "Berlin Art School",
        isTop50: false,
      },
    ],
  },
  skills: ["Figma", "Photoshop", "Illustrator", "HTML/CSS", "Adobe XD", "Sketch", "User Research"],
};

export const mockCandidates: Candidate[] = [
  candidatePhD,
  candidateMasters,
  candidateBachelor,
  candidateNoEdu,
  candidateDesigner,
];

export function makeScoredCandidate(
  candidate: Candidate,
  scoreTotal = 72
): ScoredCandidate {
  return {
    ...candidate,
    score: makeScore(scoreTotal),
  };
}

export const scoredPhD = makeScoredCandidate(candidatePhD, 88);
export const scoredMasters = makeScoredCandidate(candidateMasters, 72);
export const scoredBachelor = makeScoredCandidate(candidateBachelor, 55);
export const scoredDesigner = makeScoredCandidate(candidateDesigner, 60);
