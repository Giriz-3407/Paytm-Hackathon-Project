'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { FilterBar } from '@/components/shared/filter-bar';
import { Card, Dialog } from '@/components/ui/primitives';
import { useIncidents } from '@/services/hooks';
import { Incident, IncidentFilters } from '@/types/domain';
import { filterIncidents } from '@/features/incidents/filter';
import { ErrorState, LoadingState } from '@/components/shared/feedback';
import { CrisisMap } from './crisis-map';
import { IncidentCard } from '@/components/shared/incidents';
export function MapPage() {
  const q = useIncidents();
  const [f, setF] = useState<IncidentFilters>({});
  const [selected, setSelected] = useState<Incident | null>(null);
  const data = filterIncidents(q.data || [], f);
  return (
    <div className="page-content">
      <PageHeader
        title="Crisis map"
        description="Explore the geographical context of developing incidents across India."
      />
      <FilterBar incidents={q.data || []} filters={f} onChange={setF} extended />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : (
        <Card>
          <div className="panel-title">
            <h2>India · incident landscape</h2>
            <span>{data.length} illustrative city-level locations</span>
          </div>
          <CrisisMap incidents={data} height={590} onSelect={setSelected} />
        </Card>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title="Incident preview"
      >
        {selected && <IncidentCard incident={selected} />}
      </Dialog>
    </div>
  );
}
