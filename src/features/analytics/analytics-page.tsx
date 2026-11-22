'use client';
import { useState } from 'react';
import { useIncidents, useSources } from '@/services/hooks';
import { PageHeader } from '@/components/shared/page-header';
import { FilterBar } from '@/components/shared/filter-bar';
import { Card, Select } from '@/components/ui/primitives';
import { LoadingState, ErrorState } from '@/components/shared/feedback';
import { Incident, IncidentFilters } from '@/types/domain';
import { filterIncidents } from '@/features/incidents/filter';
import { TrendChart, CategoryChart, SeverityChart, DistributionChart } from './charts';
import { useReplaySnapshot } from '@/stores/replay-snapshot';
function counts(data: Incident[], field: (i: Incident) => string) {
  const c = new Map<string, number>();
  data.forEach((i) => c.set(field(i), (c.get(field(i)) || 0) + 1));
  return [...c].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
export function AnalyticsPage() {
  const q = useIncidents();
  const sources = useSources();
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [mode, setMode] = useState('demo');
  const snapshot = useReplaySnapshot();
  const collection = mode === 'demo' ? q.data || [] : snapshot.incidents;
  const data = filterIncidents(
    collection,
    mode === 'replay' ? { ...filters, sourceId: undefined } : filters,
  ).filter((i) => mode !== 'replay' || !filters.sourceId || i.sourceCount > 0);
  return (
    <div className="page-content">
      <PageHeader
        title="Crisis analytics"
        description="Understand patterns, evidence coverage, and the distribution of your incident data."
      />
      <FilterBar filters={filters} onChange={setFilters} incidents={collection} extended />
      <div className="view-controls">
        <Select
          label="Analytics source"
          value={filters.sourceId || ''}
          onChange={(e) => setFilters({ ...filters, sourceId: e.target.value })}
        >
          <option value="">All data sources</option>
          {mode === 'replay' ? (
            <option value="training-archive">Illustrative training archive</option>
          ) : (
            sources.data?.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))
          )}
        </Select>
        <Select
          label="Analytics monitoring mode"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setFilters((f) => ({ ...f, sourceId: undefined }));
          }}
        >
          <option value="demo">Demo monitoring</option>
          <option value="replay">Historical replay (session-local)</option>
        </Select>
        <span className="muted">
          {mode === 'replay'
            ? snapshot.scenario
              ? `${snapshot.scenario} · eligible knowledge only · ${data.length} incidents`
              : 'Start a historical replay to create a session snapshot.'
            : `${data.length} illustrative incidents · not real measurements`}
        </span>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : (
        <>
          <TrendChart incidents={data} />
          <div className="analytics-grid">
            <SeverityChart incidents={data} />
            <CategoryChart incidents={data} />
            <DistributionChart
              title="State-wise distribution"
              data={counts(data, (i) => i.location.state).slice(0, 6)}
            />
            <DistributionChart
              title="Evidence verification status"
              data={counts(data, (i) => i.evidenceStatus)}
            />
            <DistributionChart
              title="Incident lifecycle"
              data={counts(data, (i) => i.lifecycleStatus)}
            />
            <DistributionChart
              title="Source contribution"
              data={
                mode === 'replay'
                  ? data.some((i) => i.sourceCount > 0)
                    ? [
                        {
                          name: 'Training archive',
                          value: data.filter((i) => i.sourceCount > 0).length,
                        },
                      ]
                    : []
                  : (sources.data || [])
                      .map((s) => ({
                        name:
                          s.id === 's1'
                            ? 'News'
                            : s.id === 's2'
                              ? 'Weather'
                              : s.id === 's3'
                                ? 'Alerts'
                                : 'Archive',
                        value: data.filter((i) =>
                          i.relatedEvidenceIds.some((id) => id.endsWith(`-${s.id}`)),
                        ).length,
                      }))
                      .filter((d) => d.value > 0)
              }
            />
          </div>
          <Card className="detail-section">
            <h2>Detection latency</h2>
            <p>
              Unavailable for the illustrative incident dataset. Detection latency requires an
              independently recorded occurrence timestamp and first detection timestamp. The demo
              does not invent either a latency figure or a trend.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
