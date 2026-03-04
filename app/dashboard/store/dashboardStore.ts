import { create } from "zustand";
import type { CallData } from "@/app/agent/store/types";

interface DashboardState {
  dailySummaries: CallData[];
  isLoading: boolean;
  fetchDailySummaries: (month: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dailySummaries: [],
  isLoading: false,
  fetchDailySummaries: async (month: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audio_files_summary_view?select=day,month,total_count,confusion_count,complaint_count&month=eq.${month}&order=month.asc&apikey`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );
      const data = await response.json();
      set({ dailySummaries: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch data", error);
      set({ isLoading: false });
    }
  },
}));
