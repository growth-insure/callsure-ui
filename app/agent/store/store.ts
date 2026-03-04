import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AgentStore, AudioFile } from "./types";

export const useAgentStore = create<AgentStore>()(
  devtools((set) => ({
    dailySummaries: [],
    selectedDate: null,
    callDetails: [],
    audioFiles: [],
    selectedAudioFile: null,
    callSummary: null,
    isLoading: false,
    error: null,

    setSelectedDate: (date) => set({ selectedDate: date }),

    setSelectedAudioFile: (file: AudioFile | null) => set({ selectedAudioFile: file }),

    fetchAudioFiles: async (date: string, extension: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audio_files?select=*&call_date=eq.${date}&extension=eq.${extension}&order=call_time.asc`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch audio files");

        const data: AudioFile[] = await response.json();
        set({ audioFiles: data, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        });
      }
    },

    fetchDailySummaries: async (extension: string, month: string) => {
      set({ isLoading: true, error: null });
      try {
        // month = '2025-09-01';
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/agent_daily_summary?select=day,month,total_calls,total_confusion_calls,total_complaint_calls&month=eq.${month}&extension=eq.${extension}&order=month.asc`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        set({ dailySummaries: data, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },
  }))
);
