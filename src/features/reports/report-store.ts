'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Incident, IntelligenceReport } from '@/types/domain';
export const useGeneratedReports = create<{
  reports: IntelligenceReport[];
  generate: (i: Incident) => IntelligenceReport;
}>()(
  persist(
    (set) => ({
      reports: [],
      generate: (i) => {
        const r: IntelligenceReport = {
          id: `RPT-${Date.now()}`,
          incidentId: i.id,
          title: `${i.location.city}: ${i.category.toLowerCase()} situation brief`,
          generatedAt: new Date().toISOString(),
          mode: i.mode,
          summary: i.summary,
          findings: [
            `Location: ${i.location.city}, ${i.location.state}.`,
            `Illustrative severity assessment: ${i.severity}. Evidence: ${i.evidenceStatus}.`,
          ],
          limitations: [
            'Generated locally from fictional demo data using a report template, not a live AI model.',
            'No independently verified findings, casualty estimates, or official response recommendations.',
          ],
          sources: i.relatedEvidenceIds,
        };
        set((s) => ({ reports: [r, ...s.reports] }));
        return r;
      },
    }),
    { name: 'crisis-lens-demo-reports' },
  ),
);
