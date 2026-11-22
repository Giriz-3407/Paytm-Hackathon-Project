import { create } from 'zustand';
import { Incident } from '@/types/domain';
/** Session-local eligible knowledge only; final evaluation never enters this store. */
export const useReplaySnapshot = create<{
  incidents: Incident[];
  scenario: string | null;
  availableAt: string | null;
  setSnapshot: (incidents: Incident[], scenario: string, availableAt: string) => void;
}>((set) => ({
  incidents: [],
  scenario: null,
  availableAt: null,
  setSnapshot: (incidents, scenario, availableAt) => set({ incidents, scenario, availableAt }),
}));
