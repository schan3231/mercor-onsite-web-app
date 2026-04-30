import { NextResponse } from "next/server";
import { ALL_SALARIES, getUniqueLocations, getUniqueSkills } from "@/lib/data";

// Returns static metadata needed by the client for scoring and filters.
// Cached indefinitely since the underlying JSON never changes.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    allSalaries: ALL_SALARIES,
    locations: getUniqueLocations(),
    skills: getUniqueSkills(),
    educationLevels: [
      "High School Diploma",
      "Associate's Degree",
      "Bachelor's Degree",
      "Master's Degree",
      "Doctorate",
      "Juris Doctor (J.D)",
    ],
    salaryRange: {
      min: ALL_SALARIES[0] ?? 0,
      max: ALL_SALARIES[ALL_SALARIES.length - 1] ?? 200000,
    },
  });
}
