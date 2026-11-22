'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Database, ExternalLink, Clock3, RefreshCw, Info } from 'lucide-react';
import { useSources } from '@/services/hooks';
import { sourcesRepository } from '@/services/repositories';
import { Source } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button, Card, Badge, Select, Switch, Dialog } from '@/components/ui/primitives';
import { EmptyState, LoadingState, ErrorState } from '@/components/shared/feedback';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { toast } from 'sonner';
export function SourcesPage() {
  const dateLabel = useDateFormatter();
  const q = useSources();
  const client = useQueryClient();
  const [type, setType] = useState('');
  const [view, setView] = useState<Source | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const data = (q.data || [])
    .map((s) => ({ ...s, enabled: overrides[s.id] ?? s.enabled }))
    .filter((s) => !type || s.type === type);
  const toggle = async (s: Source, enabled: boolean) => {
    setBusy(s.id);
    try {
      await sourcesRepository.setEnabled(s.id, enabled);
      setOverrides((v) => ({ ...v, [s.id]: enabled }));
      client.setQueryData<Source[]>(['sources'], (v) =>
        v?.map((x) => (x.id === s.id ? { ...x, enabled } : x)),
      );
      toast.success(`Demo source ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Unable to update source');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="page-content">
      <PageHeader
        title="Data sources"
        description="Inspect ingestion health, configured providers, and source coverage."
        actions={
          <Button onClick={() => q.refetch()}>
            <RefreshCw size={15} />
            Refresh status
          </Button>
        }
      />
      <div className="notice">
        <Info size={18} />
        <p>
          All source activity is simulated. Provider names describe intended integrations; these
          demo toggles do not control external services.
        </p>
      </div>
      <div className="view-controls">
        <Select label="Source type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All source types</option>
          {['News discovery', 'Official alerts', 'Weather bulletins', 'Historical datasets'].map(
            (t) => (
              <option key={t}>{t}</option>
            ),
          )}
        </Select>
        <span className="muted">{data.length} configured demo sources</span>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : !data.length ? (
        <EmptyState title="No sources found" />
      ) : (
        <div className="sources-grid">
          {data.map((s) => (
            <Card className="source-card" key={s.id}>
              <div className="source-card-top">
                <span className="source-icon">
                  <Database size={22} />
                </span>
                <Badge
                  className={
                    !s.enabled
                      ? 'neutral-badge'
                      : s.status === 'Healthy'
                        ? 'freshness-badge'
                        : 'severity-medium'
                  }
                >
                  {!s.enabled ? 'Disabled' : s.status}
                </Badge>
              </div>
              <span className="eyebrow">{s.type}</span>
              <h2>{s.name}</h2>
              <div className="source-stats">
                <div>
                  <span>Reports ingested</span>
                  <strong>{s.reports.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Sync frequency</span>
                  <strong>{s.frequency}</strong>
                </div>
              </div>
              <p className="muted">
                <Clock3 size={13} />
                Last success: {dateLabel(s.lastSync, true)}
              </p>
              {s.error && <div className="source-error">{s.error}</div>}
              <div className="source-card-footer">
                <Button size="sm" onClick={() => setView(s)}>
                  Details & ingestion history
                </Button>
                <div className="source-toggle">
                  <span>{busy === s.id ? 'Saving…' : s.enabled ? 'Enabled' : 'Disabled'}</span>
                  <Switch
                    label={`Enable ${s.name}`}
                    checked={s.enabled}
                    onCheckedChange={(v) => {
                      if (!busy) toggle(s, v);
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={!!view}
        onOpenChange={(v) => !v && setView(null)}
        title={view?.name || 'Source details'}
      >
        {view && (
          <div className="source-detail">
            <Badge>SIMULATED INTEGRATION</Badge>
            <p>Type: {view.type}</p>
            <p>Last successful sync: {dateLabel(view.lastSync, true)}</p>
            <p>Last attempted sync: {dateLabel(view.lastAttempt, true)}</p>
            <p>Monitoring frequency: {view.frequency}</p>
            <h3>Illustrative ingestion history</h3>
            <div className="timeline-item">
              <Database size={16} />
              <div>
                <strong>Last successful batch</strong>
                <p>{dateLabel(view.lastSync, true)} · Demo ingestion completed</p>
              </div>
            </div>
            <div className="timeline-item">
              <RefreshCw size={16} />
              <div>
                <strong>Latest attempt</strong>
                <p>
                  {dateLabel(view.lastAttempt, true)} ·{' '}
                  {view.error || 'Demo source check successful'}
                </p>
              </div>
            </div>
            <h3>Recent errors</h3>
            <p>{view.error || 'No simulated errors recorded.'}</p>
            {view.url && (
              <a className="text-link" href={view.url} target="_blank" rel="noreferrer">
                Provider website
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
