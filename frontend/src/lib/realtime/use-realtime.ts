'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { createRealtimeClient } from './socket-client';
import { Incident, Source, Evidence } from '@/types/domain';
export const useConnection = create<{
  status: 'Demo mode' | 'Connected' | 'Reconnecting' | 'Disconnected';
}>(() => ({ status: process.env.NEXT_PUBLIC_DATA_MODE === 'api' ? 'Disconnected' : 'Demo mode' }));
export function useRealtime() {
  const query = useQueryClient();
  useEffect(() => {
    const socket = createRealtimeClient();
    if (!socket) return;
    const upsert = (i: Incident) =>
      query.setQueryData<Incident[]>(['incidents'], (old) =>
        old
          ? old.some((x) => x.id === i.id)
            ? old.map((x) => (x.id === i.id ? i : x))
            : [i, ...old]
          : [i],
      );
    const evidence = (e: Evidence) => {
      query.invalidateQueries({ queryKey: ['evidence', e.incidentId] });
      query.invalidateQueries({ queryKey: ['incidents'] });
    };
    const health = (s: Source) =>
      query.setQueryData<Source[]>(['sources'], (old) => old?.map((x) => (x.id === s.id ? s : x)));
    socket.on('connect', () => useConnection.setState({ status: 'Connected' }));
    socket.on('disconnect', () => useConnection.setState({ status: 'Disconnected' }));
    socket.on('connect_error', () => useConnection.setState({ status: 'Reconnecting' }));
    socket.io.on('reconnect_attempt', () => useConnection.setState({ status: 'Reconnecting' }));
    socket.on('incident:created', upsert);
    socket.on('incident:updated', upsert);
    socket.on('incident:resolved', upsert);
    socket.on('evidence:added', evidence);
    socket.on('source:health', health);
    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    };
  }, [query]);
}
