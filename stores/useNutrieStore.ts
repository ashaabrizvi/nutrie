import { create } from "zustand";
import type { FoodLog } from "@/types";

interface NutrieState {
  todayLogs: FoodLog[];
  waterGlasses: number;
  setTodayLogs: (logs: FoodLog[]) => void;
  addLog: (log: FoodLog) => void;
  removeLog: (id: string) => void;
  setWaterGlasses: (glasses: number) => void;
}

export const useNutrieStore = create<NutrieState>((set) => ({
  todayLogs: [],
  waterGlasses: 0,
  setTodayLogs: (logs) => set({ todayLogs: logs }),
  addLog: (log) => set((s) => ({ todayLogs: [log, ...s.todayLogs] })),
  removeLog: (id) =>
    set((s) => ({ todayLogs: s.todayLogs.filter((l) => l.id !== id) })),
  setWaterGlasses: (glasses) => set({ waterGlasses: glasses }),
}));
