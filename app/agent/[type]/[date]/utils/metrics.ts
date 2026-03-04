import { CallRecord } from "../store/types";

const INSURANCE_COLORS = {
  Auto: "#36A2EB", // Bright blue
  Home: "#4BC0C0", // Turquoise
  Rental: "#FFCD56", // Yellow
  Business: "#FF6384", // Pink/coral (updated from orange)
  BusinsLife: "#FF6384", // Same as Business
  Life: "#FF69B4", // Pink
} as const;

type InsuranceType = keyof typeof INSURANCE_COLORS;

export interface CallDirectionSummary {
  name: string;
  inbound: number;
  outbound: number;
}

export interface InsuranceCoverageData {
  name: string;
  value: number;
  count: number; // Add count field
  color: string;
}

export function calculateCallDirectionData(
  calls: CallRecord[]
): CallDirectionSummary[] {
  // For agent view, we only show their own data, so we aggregate by date/time
  // Since all calls are from the same agent (filtered by extension), we can show overall stats
  const inbound = calls.filter((call) => call.call_direction === "inbound").length;
  const outbound = calls.filter((call) => call.call_direction === "outbound").length;

  return [
    {
      name: "Agent Calls",
      inbound,
      outbound,
    },
  ];
}

export function calculateInsuranceCoverageTypes(
  calls: CallRecord[]
): InsuranceCoverageData[] {
  const coverageMap = new Map<string, number>();
  let totalCount = 0;

  // Count insurance types
  calls.forEach((call) => {
    if (call.call_summary?.question2) {
      const types = call.call_summary.question2
        .split(",")
        .map((type: string) => type.trim())
        .filter(Boolean);

      types.forEach((type: string) => {
        coverageMap.set(type, (coverageMap.get(type) || 0) + 1);
        totalCount++;
      });
    }
  });

  // Convert map to array format with percentages and counts
  return Array.from(coverageMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      value: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      color: INSURANCE_COLORS[name as InsuranceType] || "#808080", // Updated fallback color
    }))
    .sort((a, b) => b.value - a.value); // Sort by percentage descending
}


