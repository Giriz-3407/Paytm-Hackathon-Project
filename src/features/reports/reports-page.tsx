'use client';
import { useState } from 'react';
import { FileText, Printer, Plus, Search, MapPin } from 'lucide-react';
import { useIncidents, useReports } from '@/services/hooks';
import { useGeneratedReports } from './report-store';
import { IntelligenceReport, categories } from '@/types/domain';
import { PageHeader } from '@/components/shared/page-header';
import { Button, Card, Input, Select, Dialog, Badge } from '@/components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/feedback';
import { SeverityBadge, EvidenceBadge } from '@/components/shared/incidents';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { toast } from 'sonner';
export function ReportsPage({ initialIncident = '' }: { initialIncident?: string }) {
  const dateLabel = useDateFormatter();
  const q = useReports();
  const incidents = useIncidents();
  const { reports: local, generate } = useGeneratedReports();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [date, setDate] = useState('');
  const [incident, setIncident] = useState(initialIncident);
  const [view, setView] = useState<IntelligenceReport | null>(null);
  const [create, setCreate] = useState(false);
  const [generateId, setGenerateId] = useState('');
  const all = [...local, ...(q.data || [])];
  const filtered = all.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) &&
      (!cat || incidents.data?.find((i) => i.id === r.incidentId)?.category === cat) &&
      (!date || r.generatedAt.startsWith(date)) &&
      (!incident || r.incidentId === incident),
  );
  return (
    <div className="page-content">
      <PageHeader
        title="Intelligence reports"
        description="Source-aware situation briefs, built for careful review and sharing."
        actions={
          <Button variant="default" onClick={() => setCreate(true)}>
            <Plus size={15} />
            Generate report
          </Button>
        }
      />
      <div className="filter-bar">
        <div className="search-field">
          <Search size={16} />
          <Input
            aria-label="Search reports"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search intelligence reports…"
          />
        </div>
        <Select label="Report category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select
          label="Report incident"
          value={incident}
          onChange={(e) => setIncident(e.target.value)}
        >
          <option value="">All incidents</option>
          {incidents.data?.map((i) => (
            <option key={i.id} value={i.id}>
              {i.id} · {i.location.city}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          aria-label="Report generation date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setSearch('');
            setCat('');
            setDate('');
            setIncident('');
          }}
        >
          Reset
        </Button>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : !filtered.length ? (
        <EmptyState title="No reports found" />
      ) : (
        <div className="reports-grid">
          {filtered.map((r) => (
            <Card className="report-card" key={r.id}>
              <div className="report-card-top">
                <span className="report-icon">
                  <FileText size={22} />
                </span>
                <Badge>DEMO BRIEF</Badge>
              </div>
              <span className="mono muted">
                {r.id} · {r.incidentId}
              </span>
              <h2>{r.title}</h2>
              <p>{r.summary}</p>
              <div className="report-card-footer">
                <span>{dateLabel(r.generatedAt)}</span>
                <Button size="sm" onClick={() => setView(r)}>
                  Read report
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={create}
        onOpenChange={setCreate}
        title="Generate a situation brief"
        description="Creates a local template-based report from an illustrative incident. No AI service is called."
      >
        <Select
          label="Incident for report"
          value={generateId}
          onChange={(e) => setGenerateId(e.target.value)}
        >
          <option value="">Choose an incident</option>
          {incidents.data?.map((i) => (
            <option key={i.id} value={i.id}>
              {i.id} · {i.title}
            </option>
          ))}
        </Select>
        <Button
          variant="default"
          disabled={!generateId}
          onClick={() => {
            const i = incidents.data?.find((i) => i.id === generateId);
            if (i) {
              const r = generate(i);
              setCreate(false);
              setView(r);
              toast.success('Demo report generated');
            }
          }}
        >
          Generate demo report
        </Button>
      </Dialog>
      <Dialog
        open={!!view}
        onOpenChange={(v) => !v && setView(null)}
        title="Intelligence report"
        description="Print or save as PDF using your browser’s print dialog."
      >
        {view && (
          <>
            <div className="report-print-actions">
              <Button onClick={() => window.print()}>
                <Printer size={15} />
                Print / Save PDF
              </Button>
            </div>
            <article className="print-report">
              <div className="eyebrow">CRISIS LENS · ILLUSTRATIVE INTELLIGENCE</div>
              <h1>{view.title}</h1>
              <p>
                {view.id} · Incident {view.incidentId} · Generated{' '}
                {dateLabel(view.generatedAt, true)} ·{' '}
                {view.mode === 'replay' ? 'Historical replay' : 'Demo monitoring'}
              </p>
              {(() => {
                const i = incidents.data?.find((i) => i.id === view.incidentId);
                return (
                  i && (
                    <>
                      <p>
                        <MapPin size={14} />
                        {i.location.city}, {i.location.state} · {i.category}
                      </p>
                      <SeverityBadge severity={i.severity} />{' '}
                      <EvidenceBadge status={i.evidenceStatus} />
                    </>
                  )
                );
              })()}
              <h2>Executive summary</h2>
              <p>{view.summary}</p>
              <h2>Verified findings</h2>
              <p>No independently verified real-world findings are provided by this demo.</p>
              <h2>Illustrative observations & unverified claims</h2>
              <ul>
                {view.findings.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <h2>Timeline</h2>
              {incidents.data
                ?.filter((i) => i.id === view.incidentId)
                .map((i) => (
                  <p key={i.id}>
                    First detected {dateLabel(i.firstDetectedAt, true)}. Latest assessment{' '}
                    {dateLabel(i.lastUpdatedAt, true)}.
                  </p>
                ))}
              <h2>Supporting sources</h2>
              <p>
                {view.sources.join(', ')}. Illustrative evidence IDs; no archived article URLs
                claimed.
              </p>
              <h2>Limitations</h2>
              <ul>
                {view.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <h2>Response considerations</h2>
              <p>
                Verify the situation through official channels and local information. This demo
                makes no official operational recommendations.
              </p>
            </article>
          </>
        )}
      </Dialog>
    </div>
  );
}
