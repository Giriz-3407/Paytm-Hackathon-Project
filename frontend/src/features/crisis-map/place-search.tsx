'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { DomEvent, divIcon, latLngBounds } from 'leaflet';
import { Search, X } from 'lucide-react';
import { geocodeRepository } from '@/services/repositories';
import { GeocodeResult } from '@/types/domain';
import styles from './map-search.module.css';

const pinIcon = divIcon({
  className: styles.pin,
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Place search backed by OpenStreetMap's Nominatim (through the backend proxy, which caches and
 * rate-limits). It runs only when the user submits: Nominatim's usage policy forbids autocomplete.
 */
export function PlaceSearch() {
  const map = useMap();
  const box = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [picked, setPicked] = useState<GeocodeResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Typing, clicking or wheel-scrolling inside the box must not pan or zoom the map underneath.
  useEffect(() => {
    if (!box.current) return;
    DomEvent.disableClickPropagation(box.current);
    DomEvent.disableScrollPropagation(box.current);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setStatus('loading');
    setResults([]);
    try {
      const found = await geocodeRepository.search(q);
      setResults(found);
      setStatus(found.length ? 'idle' : 'empty');
      setMessage(found.length ? '' : `No places found for “${q}”.`);
    } catch {
      setStatus('error');
      setMessage('Place search is unavailable right now. Please try again shortly.');
    }
  }

  function choose(place: GeocodeResult) {
    setPicked(place);
    setResults([]);
    if (place.boundingBox) {
      const [s, w, n, e] = place.boundingBox;
      // Fit the place's own extent: a city zooms to street level, a state shows the whole state.
      map.flyToBounds(
        latLngBounds([
          [s, w],
          [n, e],
        ]),
        { maxZoom: 15, padding: [30, 30] },
      );
    } else {
      map.flyTo([place.lat, place.lng], 12);
    }
  }

  function clear() {
    setPicked(null);
    setResults([]);
    setQuery('');
    setStatus('idle');
    setMessage('');
  }

  return (
    <>
      <div className={styles.box} ref={box}>
        <form role="search" onSubmit={submit} className={styles.form}>
          <input
            className={styles.input}
            type="search"
            aria-label="Search a place on the map"
            placeholder="Search a place in India…"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
          />
          {(picked || query) && (
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Clear search"
              onClick={clear}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="submit"
            className={styles.iconButton}
            aria-label="Search"
            disabled={status === 'loading'}
          >
            <Search size={15} />
          </button>
        </form>
        {status === 'loading' && <p className={styles.note}>Searching OpenStreetMap…</p>}
        {message && (
          <p className={styles.note} role="status">
            {message}
          </p>
        )}
        {results.length > 0 && (
          <ul className={styles.results}>
            {results.map((r) => (
              <li key={`${r.lat},${r.lng},${r.displayName}`}>
                <button type="button" onClick={() => choose(r)}>
                  {r.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {picked && (
        <Marker position={[picked.lat, picked.lng]} icon={pinIcon}>
          <Popup>
            <strong>{picked.displayName}</strong>
            <br />
            <span className="muted">
              {picked.lat.toFixed(4)}, {picked.lng.toFixed(4)} · OpenStreetMap
            </span>
          </Popup>
        </Marker>
      )}
    </>
  );
}
