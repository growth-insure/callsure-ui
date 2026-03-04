import { create } from "zustand";
import {
  CallDetailsState,
  CallFrequencyData,
  CallMetrics,
  CallRecord,
  ChartData
} from "./types";
import {
  calculateCallDirectionData,
  calculateInsuranceCoverageTypes,
} from "../utils/metrics";
interface CallSummary {
  issue_resolved: boolean;
}

interface CallData {
  call_summary: CallSummary;
}
const calculateResolutionScore = (calls: CallData[]): number => {
  if (!calls || calls.length === 0) return 0;

  const resolvedCalls = calls.filter(
    (call) => call.call_summary.issue_resolved
  );
  const score = (resolvedCalls.length / calls.length) * 100;

  return Number(score.toFixed(2));
};

export const useCallDetailsStore = create<CallDetailsState>((set) => ({
  calls: [],
  metrics: {
    totalCalls: 0,
    outboundCalls: 0,
    inboundCalls: 0,
    averageDuration: 0,
    needsAttention: 0,
  },
  chartData: {
    insuranceData: [],
    callDirectionData: [],
    callFrequencyData: [],
    resolutionScore: 0, // Add this line to include the required property
    count:0
  },
  isLoading: false,
  error: null,
  // getCallDetails: async (callId: string) => {
  //   set({ isLoading: true, error: null });
  //   try {
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/call_details?id=eq.${callId}`,
  //       {
  //         headers: {
  //           apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //         },
  //       }
  //     );

  //     if (!response.ok) throw new Error("Failed to fetch call details");

  //     const data = await response.json();
  //     return data[0];
  //   } catch (error) {
  //     set({ error: (error as Error).message, isLoading: false });
  //     return null;
  //   }
  // },

  fetchCallDetails: async (type: string, date: string) => {
    set({ isLoading: true, error: null });
    try {
      let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audio_files?select=*&call_date=eq.${date}&order=call_time.desc`;

      if (type === "confusions") {
        url += "&call_summary->>confusion_flag=eq.true";
      } else if (type === "complaints") {
        url += "&call_summary->>complaint_flag=eq.true";
      }

      const response = await fetch(url, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch call details");

      const data = await response.json();
      // console.log(" data ", data);
      // Process data and set state
      set({
        calls: data,
        metrics: calculateMetrics(data),
        chartData: generateChartData(data),
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));

function calculateMetrics(data: CallRecord[]): CallMetrics {
  const totalCalls = data.length;
  const outboundCalls = data.filter(
    (call) => call.call_direction === "outbound"
  ).length;
  const inboundCalls = data.filter(
    (call) => call.call_direction === "inbound"
  ).length;
  const totalDuration = data.reduce(
    (acc, call) => acc + (call.call_duration || 0),
    0
  );
  const averageDuration = totalCalls > 0 ? totalDuration / totalCalls / 60 : 0;
  const needsAttention = data.filter(
    (call) =>
      call.call_summary?.confusion_flag || call.call_summary?.complaint_flag
  ).length;

  return {
    totalCalls,
    outboundCalls,
    inboundCalls,
    averageDuration,
    needsAttention,
  };
}
function calculateCallFrequencyData(data: CallRecord[]): CallFrequencyData[] {
  // Initialize array for 24 hours with 0 calls
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i.toString().padStart(2, "0"),
    calls: 0,
  }));

  // Count calls for each hour
  data.forEach((call) => {
    if (call.call_time) {
      const hour = call.call_time.split(":")[0];
      const hourIndex = parseInt(hour);
      if (!isNaN(hourIndex) && hourIndex >= 0 && hourIndex < 24) {
        hourlyData[hourIndex].calls++;
      }
    }
  });

  return hourlyData;
}
function generateChartData(data: CallRecord[]): ChartData {
  // Implementation of chart data generation
  return {
    insuranceData: calculateInsuranceCoverageTypes(data),
    callDirectionData: calculateCallDirectionData(data),
    callFrequencyData: calculateCallFrequencyData(data),
    resolutionScore: calculateResolutionScore(data),
  };
}
