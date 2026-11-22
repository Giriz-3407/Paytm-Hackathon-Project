'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { List, Map as MapIcon, Maximize, Minimize, LocateFixed } from 'lucide-react';
import { Incident } from '@/types/domain';
import { Button } from '@/components/ui/primitives';
import { CompactIncident, IncidentCard } from '@/components/shared/incidents';
import { EmptyState } from '@/components/shared/feedback';
const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => <div className="map-loading">Preparing geographical view…</div>,
});
export function CrisisMap({
  incidents,
  height = 430,
  onSelect,
}: {
  incidents: Incident[];
  height?: number;
  onSelect?: (i: Incident) => void;
}) {
  const [list, setList] = useState(false);
  const [reset, setReset] = useState(0);
  const [full, setFull] = useState(false);
  return (
    <div className={`map-wrapper ${full ? 'map-expanded' : ''}`}>
      <div className="map-toolbar">
        <div className="map-view-switch">
          <button
            aria-label="Map view"
            aria-pressed={!list}
            className={!list ? 'active' : ''}
            onClick={() => setList(false)}
          >
            <MapIcon size={14} />
            Map
          </button>
          <button
            aria-label="List view"
            aria-pressed={list}
            className={list ? 'active' : ''}
            onClick={() => setList(true)}
          >
            <List size={14} />
            List
          </button>
        </div>
        <div className="map-buttons">
          <Button size="icon" aria-label="Reset map view" onClick={() => setReset((v) => v + 1)}>
            <LocateFixed size={16} />
          </Button>
          <Button
            size="icon"
            aria-label={full ? 'Exit fullscreen map' : 'Expand map'}
            onClick={() => setFull((v) => !v)}
          >
            {full ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
        </div>
      </div>
      {list ? (
        <div className="map-list" style={{ height: full ? 'calc(100vh - 100px)' : height }}>
          {incidents.length ? (
            incidents.map((i) =>
              i.mode === 'replay' ? (
                <IncidentCard key={i.id} incident={i} onSelect={onSelect} />
              ) : (
                <CompactIncident key={i.id} incident={i} />
              ),
            )
          ) : (
            <EmptyState />
          )}
        </div>
      ) : (
        <>
          <div className="map-canvas" style={{ height: full ? 'calc(100vh - 100px)' : height }}>
            <LeafletMap incidents={incidents} reset={reset} onSelect={onSelect} />
          </div>
          <div className="map-legend">
            {['Critical', 'High', 'Medium', 'Low'].map((s) => (
              <span key={s}>
                <i className={`severity-bg-${s.toLowerCase()}`} />
                {s}
              </span>
            ))}
            <span className="map-legend-note">Illustrative locations</span>
          </div>
        </>
      )}
    </div>
  );
}
