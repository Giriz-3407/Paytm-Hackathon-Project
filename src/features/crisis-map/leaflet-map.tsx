'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, Pane } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import outlines from '@/data/map-outlines.json';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { divIcon } from 'leaflet';
import Link from 'next/link';
import { Incident } from '@/types/domain';
import { SeverityBadge, EvidenceBadge } from '@/components/shared/incidents';
import { useDateFormatter } from '@/hooks/use-date-formatter';
function Reset({ value }: { value: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [6, 67],
        [37, 98],
      ],
      { padding: [18, 25] },
    );
  }, [value, map]);
  return null;
}
export default function LeafletMap({
  incidents,
  reset,
  onSelect,
}: {
  incidents: Incident[];
  reset: number;
  onSelect?: (i: Incident) => void;
}) {
  const dateLabel = useDateFormatter();
  const [tileError, setTileError] = useState(false);
  return (
    <>
      <MapContainer
        center={[22.5, 81]}
        zoom={4.5}
        zoomSnap={0.25}
        zoomDelta={0.5}
        minZoom={3}
        maxZoom={17}
        scrollWheelZoom={false}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <Pane name="geographic-context" style={{ zIndex: 190 }}>
          <GeoJSON
            data={outlines as GeoJsonObject}
            interactive={false}
            attribution='Outlines: <a href="https://www.naturalearthdata.com">Natural Earth</a>'
            style={(feature) => ({
              color: '#bcc9d4',
              weight: 1,
              fillColor: feature?.properties.name === 'India' ? '#f8fafc' : '#e6ecf0',
              fillOpacity: 1,
            })}
          />
        </Pane>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        <Reset value={reset} />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={38}>
          {incidents.map((i) => (
            <Marker
              key={i.id}
              position={i.coordinates}
              icon={divIcon({
                className: 'crisis-marker-container',
                html: `<span class="crisis-marker severity-bg-${i.severity.toLowerCase()}"><span></span></span>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
              eventHandlers={{ click: () => onSelect?.(i) }}
            >
              <Popup>
                <div className="map-popup">
                  <span className="muted">{i.id} · DEMO</span>
                  <h3>{i.title}</h3>
                  <p>
                    {i.location.city}, {i.location.state}
                  </p>
                  <SeverityBadge severity={i.severity} />{' '}
                  <EvidenceBadge status={i.evidenceStatus} />
                  <p>Updated {dateLabel(i.lastUpdatedAt, true)}</p>
                  {i.mode === 'replay' ? (
                    <button className="button button-outline" onClick={() => onSelect?.(i)}>
                      View available intelligence
                    </button>
                  ) : (
                    <Link href={`/incidents/${i.id}`}>View incident details</Link>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      {tileError && (
        <div role="status" className="tile-error">
          Online tiles unavailable. Showing bundled geographical context.
        </div>
      )}
    </>
  );
}
