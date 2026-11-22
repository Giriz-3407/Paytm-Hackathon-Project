'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const defaultViews = ['/dashboard', '/map', '/incidents', '/replay'] as const;
type Preferences = {
  theme: 'light' | 'dark' | 'system';
  collapsed: boolean;
  timezone: string;
  defaultView: string;
  dateFormat: string;
  preferredStates: string;
  preferredCategories: string;
  defaultSeverity: string;
  refresh: string;
  criticalAlerts: boolean;
  escalations: boolean;
  sourceAlerts: boolean;
  replayAlerts: boolean;
};
export const useUI = create<Preferences & { set: (value: Partial<Preferences>) => void }>()(
  persist(
    (set) => ({
      theme: 'light',
      collapsed: false,
      timezone: 'Asia/Kolkata',
      defaultView: '/dashboard',
      dateFormat: 'dd MMM yyyy',
      preferredStates: '',
      preferredCategories: '',
      defaultSeverity: '',
      refresh: '60',
      criticalAlerts: true,
      escalations: true,
      sourceAlerts: true,
      replayAlerts: true,
      set: (value) => set(value),
    }),
    {
      name: 'crisis-lens-preferences',
      version: 1,
      migrate: (stored) => {
        const prefs = (stored && typeof stored === 'object' ? stored : {}) as Partial<Preferences>;
        return {
          ...prefs,
          defaultView: defaultViews.some((view) => view === prefs.defaultView)
            ? prefs.defaultView
            : '/dashboard',
        };
      },
    },
  ),
);
