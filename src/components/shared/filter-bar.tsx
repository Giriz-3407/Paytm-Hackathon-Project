'use client';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui/primitives';
import { categories, severities, Incident, IncidentFilters } from '@/types/domain';
export function FilterBar({
  filters,
  onChange,
  incidents,
  extended = false,
}: {
  filters: IncidentFilters;
  onChange: (f: IncidentFilters) => void;
  incidents: Incident[];
  extended?: boolean;
}) {
  const set = (f: Partial<IncidentFilters>) => onChange({ ...filters, ...f });
  return (
    <div className="filter-bar">
      <div className="search-field">
        <Search size={16} />
        <Input
          aria-label="Search incidents"
          placeholder="Search incidents, locations, or ID…"
          value={filters.search || ''}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>
      <Select
        label="Category"
        value={filters.categories?.[0] || ''}
        onChange={(e) => set({ categories: e.target.value ? [e.target.value] : [] })}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
      <Select
        label="Severity"
        value={filters.severities?.[0] || ''}
        onChange={(e) => set({ severities: e.target.value ? [e.target.value] : [] })}
      >
        <option value="">All severities</option>
        {severities.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Select>
      <Select
        label="Evidence status"
        value={filters.evidence || ''}
        onChange={(e) => set({ evidence: e.target.value })}
      >
        <option value="">All evidence</option>
        {['Corroborated', 'Developing', 'Unverified'].map((e) => (
          <option key={e}>{e}</option>
        ))}
      </Select>
      {extended && (
        <>
          <Select
            label="State"
            value={filters.state || ''}
            onChange={(e) => set({ state: e.target.value, district: '' })}
          >
            <option value="">All states</option>
            {[...new Set(incidents.map((i) => i.location.state))].sort().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select
            label="District"
            value={filters.district || ''}
            onChange={(e) => set({ district: e.target.value })}
          >
            <option value="">All districts</option>
            {[
              ...new Set(
                incidents
                  .filter((i) => !filters.state || i.location.state === filters.state)
                  .map((i) => i.location.district),
              ),
            ]
              .sort()
              .map((s) => (
                <option key={s}>{s}</option>
              ))}
          </Select>
          <Select
            label="Sort incidents"
            value={filters.sort || 'newest'}
            onChange={(e) => set({ sort: e.target.value as IncidentFilters['sort'] })}
          >
            <option value="newest">Newest first</option>
            <option value="severity">Highest severity</option>
            <option value="updated">Recently updated</option>
          </Select>
          <label className="date-filter">
            From
            <Input
              aria-label="From date"
              type="date"
              value={filters.from?.slice(0, 10) || ''}
              onChange={(e) =>
                set({ from: e.target.value ? `${e.target.value}T00:00:00+05:30` : undefined })
              }
            />
          </label>
          <label className="date-filter">
            To
            <Input
              aria-label="To date"
              type="date"
              value={filters.to?.slice(0, 10) || ''}
              onChange={(e) =>
                set({ to: e.target.value ? `${e.target.value}T23:59:59+05:30` : undefined })
              }
            />
          </label>
        </>
      )}
      <Button variant="ghost" onClick={() => onChange({})} title="Reset filters">
        <X size={14} />
        Reset
      </Button>
      <SlidersHorizontal className="filter-icon" size={16} />
    </div>
  );
}
