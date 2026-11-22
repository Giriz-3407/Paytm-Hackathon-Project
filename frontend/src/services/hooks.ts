'use client';
import { useQuery } from '@tanstack/react-query';
import { incidentsRepository, replayRepository, sourcesRepository } from './repositories';
import { useUI } from '@/stores/ui-store';
export const useIncidents = () => {
  const refresh = useUI((s) => s.refresh);
  return useQuery({
    queryKey: ['incidents'],
    queryFn: () => incidentsRepository.list(),
    refetchInterval:
      process.env.NEXT_PUBLIC_DATA_MODE === 'api' && refresh !== 'manual'
        ? Number(refresh) * 1000
        : false,
  });
};
export const useEvidence = (id: string) =>
  useQuery({
    queryKey: ['evidence', id],
    queryFn: () => incidentsRepository.evidence(id),
    enabled: !!id,
  });
export const useSources = () =>
  useQuery({ queryKey: ['sources'], queryFn: () => sourcesRepository.list() });
export const useScenarios = () =>
  useQuery({ queryKey: ['scenarios'], queryFn: () => replayRepository.listScenarios() });
