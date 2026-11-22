'use client';
import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
  Pane,
  ScaleControl,
} from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import outlines from '@/data/map-outlines.json';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { divIcon, latLngBounds, type LatLngBoundsExpression } from 'leaflet';
import Link from 'next/link';
import { Incident } from '@/types/domain';
import { SeverityBadge, EvidenceBadge } from '@/components/shared/incidents';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { PlaceSearch } from './place-search';

const INDIA_BOUNDS: LatLngBoundsExpression = [
  [6, 67],
  [37, 98],
];
// OpenStreetMap serves tiles up to zoom 19 and has no content beyond the poles.
const WORLD_BOUNDS: LatLngBoundsExpression = [
  [-85, -180],
  [85, 180],
];
// The Web-Mercator tile grid ends at ±85.0511° latitude and ±180° longitude. Asking OpenStreetMap for
// tiles outside it returns HTTP 400, so the tile layer is bounded to the real world.
const TILE_BOUNDS: LatLngBoundsExpression = [
  [-85.0511, -180],
  [85.0511, 180],
];
const MAX_ZOOM = 19;
const MIN_ZOOM = 3;

/** Keeps the map sized to its container and frames the incidents (or India when there are none). */
function FitView({ incidents, reset }: { incidents: Incident[]; reset: number }) {
  const map = useMap();
  const latest = useRef(incidents);
  const framed = useRef(false);

  // Written in an effect (not during render) so the framing callbacks below always see current data.
  useEffect(() => {
    latest.current = incidents;
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  const frame = () => {
    const points = latest.current.map((i) => i.coordinates);
    if (!points.length) {
      map.fitBounds(INDIA_BOUNDS, { padding: [18, 25] });
      return false;
    }
    if (points.length === 1) {
      map.setView(points[0]!, 9);
      return true;
    }
    // maxZoom keeps a tight cluster of incidents from zooming to street level.
    map.fitBounds(latLngBounds(points), { padding: [45, 45], maxZoom: 8 });
    return true;
  };

  // The Reset button (and first render) re-frames the data.
  useEffect(() => {
    framed.current = frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, map]);

  // Frame once when the first incidents arrive, but never yank the view while someone is exploring.
  useEffect(() => {
    if (!framed.current && incidents.length) framed.current = frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents.length]);

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
        zoom={5}
        // Whole zoom levels only: OpenStreetMap tiles are pre-rendered per integer level, so
        // fractional zoom would stretch them and look blurry.
        zoomSnap={1}
        zoomDelta={1}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        wheelPxPerZoomLevel={120}
        wheelDebounceTime={60}
        doubleClickZoom
        touchZoom
        boxZoom
        keyboard
        zoomControl
        style={{ height: '100%', width: '100%' }}
      >
        <Pane name="geographic-context" style={{ zIndex: 190 }}>
          <GeoJSON
            data={outlines as GeoJsonObject}
            interactive={false}
            attribution='Outlines: <a href="https://www.naturalearthdata.com">Natural Earth</a>'
            style={(feature) => ({
              color: 'var(--map-border)',
              className: feature?.properties.name === 'India' ? 'map-country-india' : 'map-country',
              weight: 1,
              fillColor:
                feature?.properties.name === 'India' ? 'var(--map-india)' : 'var(--map-land)',
              fillOpacity: 1,
            })}
          />
        </Pane>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={MAX_ZOOM}
          maxNativeZoom={MAX_ZOOM}
          noWrap
          bounds={TILE_BOUNDS}
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        <ScaleControl position="bottomleft" metric imperial={false} />
        <FitView incidents={incidents} reset={reset} />
        <PlaceSearch />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={38} showCoverageOnHover={false}>
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
                  <span className="muted">
                    {i.id} · {i.mode === 'live' ? 'LIVE' : i.mode === 'replay' ? 'REPLAY' : 'DEMO'}
                  </span>
                  <h3>{i.title}</h3>
                  <p>
                    {i.location.city}, {i.location.state}
                  </p>
                  {i.location.city.includes('(state-level)') && (
                    <p className="muted">State-level location · the pin is approximate.</p>
                  )}
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
