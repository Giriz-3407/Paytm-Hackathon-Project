'use client';
import { useDeferredValue, useState } from 'react';
import { Download, LayoutGrid, List } from 'lucide-react';
import { useIncidents } from '@/services/hooks';
import { filterIncidents } from './filter';
import { IncidentFilters, categories, severities } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { FilterBar } from '@/components/shared/filter-bar';
import { Button, Card, Select } from '@/components/ui/primitives';
import { IncidentCard } from '@/components/shared/incidents';
import { EmptyState, LoadingState, ErrorState } from '@/components/shared/feedback';
import { IncidentTable } from './incident-table';
import { useUI } from '@/stores/ui-store';
import { downloadCsv } from '@/lib/utils';
export function IncidentsPage() {
  const q = useIncidents();
  const [filters, setFilters] = useState<IncidentFilters>(() => {
    const p = useUI.getState();
    return {
      categories: p.preferredCategories ? [p.preferredCategories] : [],
      severities: p.defaultSeverity ? [p.defaultSeverity] : [],
      state: p.preferredStates.split(',')[0].trim(),
    };
  });
  const deferred = useDeferredValue(filters);
  const [view, setView] = useState('table');
  const data = filterIncidents(q.data || [], deferred);
  return (
    <div className="page-content">
      <PageHeader
        title="Incident management"
        description="Search, investigate, and organise the incidents in your workspace."
        actions={
          <Button
            disabled={!data.length || q.isLoading}
            onClick={() =>
              downloadCsv(
                data.map((i) => ({
                  id: i.id,
                  title: i.title,
                  category: i.category,
                  severity: i.severity,
                  evidence: i.evidenceStatus,
                  status: i.lifecycleStatus,
                  city: i.location.city,
                  state: i.location.state,
                  firstDetected: i.firstDetectedAt,
                  updated: i.lastUpdatedAt,
                  sources: i.sourceCount,
                })),
              )
            }
          >
            <Download size={15} />
            Export filtered CSV
          </Button>
        }
      />
      <FilterBar filters={filters} onChange={setFilters} incidents={q.data || []} extended />
      <div className="view-controls">
        <span className="muted">{data.length} illustrative incidents</span>
        <div className="multi-filters">
          <Select
            label="Add category filter"
            value=""
            onChange={(e) =>
              e.target.value &&
              setFilters({
                ...filters,
                categories: [...new Set([...(filters.categories || []), e.target.value])],
              })
            }
          >
            <option value="">+ Category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select
            label="Add severity filter"
            value=""
            onChange={(e) =>
              e.target.value &&
              setFilters({
                ...filters,
                severities: [...new Set([...(filters.severities || []), e.target.value])],
              })
            }
          >
            <option value="">+ Severity</option>
            {severities.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="segmented">
          <button
            aria-label="Table view"
            className={view === 'table' ? 'active' : ''}
            onClick={() => setView('table')}
          >
            <List size={15} />
            Table
          </button>
          <button
            aria-label="Card view"
            className={view === 'cards' ? 'active' : ''}
            onClick={() => setView('cards')}
          >
            <LayoutGrid size={15} />
            Cards
          </button>
        </div>
      </div>
      {((filters.categories?.length || 0) > 1 || (filters.severities?.length || 0) > 1) && (
        <div className="filter-chips">
          {[...(filters.categories || []), ...(filters.severities || [])].map((v) => (
            <button
              key={v}
              onClick={() =>
                setFilters({
                  ...filters,
                  categories: filters.categories?.filter((c) => c !== v),
                  severities: filters.severities?.filter((s) => s !== v),
                })
              }
            >
              {v} ×
            </button>
          ))}
        </div>
      )}
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : !data.length ? (
        <EmptyState />
      ) : view === 'table' ? (
        <Card>
          <IncidentTable incidents={data} />
        </Card>
      ) : (
        <div className="incident-grid">
          {data.map((i) => (
            <IncidentCard key={i.id} incident={i} />
          ))}
        </div>
      )}
    </div>
  );
}
