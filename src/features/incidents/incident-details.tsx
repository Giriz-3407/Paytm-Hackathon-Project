'use client';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Clock3, FileText, ShieldCheck, Info, ExternalLink } from 'lucide-react';
import { Incident } from '@/types/domain';
import { useEvidence, useIncidents } from '@/services/hooks';
import {
  Button,
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
} from '@/components/ui/primitives';
import { SeverityBadge, EvidenceBadge } from '@/components/shared/incidents';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/feedback';
import { CrisisMap } from '@/features/crisis-map/crisis-map';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useGeneratedReports } from '@/features/reports/report-store';
import { toast } from 'sonner';
export function IncidentDetails({
  incident: i,
  compact = false,
}: {
  incident: Incident;
  compact?: boolean;
}) {
  const dateLabel = useDateFormatter();
  const q = useEvidence(i.id);
  const [tab, setTab] = useState('overview');
  const generate = useGeneratedReports((s) => s.generate);
  const report = () => {
    const r = generate(i);
    toast.success(`Demo report ${r.id} generated. Open Intelligence Reports to view.`);
  };
  return (
    <div className="incident-details">
      <div className="detail-heading">
        <div className="detail-id">
          <span className="mono">{i.id}</span>
          <Badge>{i.lifecycleStatus}</Badge>
          <Badge>DEMO</Badge>
        </div>
        <h2>{i.title}</h2>
        <div className="detail-badges">
          <SeverityBadge severity={i.severity} />
          <EvidenceBadge status={i.evidenceStatus} />
        </div>
        <p className="location">
          <MapPin size={14} />
          {i.location.city}, {i.location.state}
        </p>
        <Button onClick={report}>
          <FileText size={15} />
          Generate demo report
        </Button>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {['Overview', 'Timeline', 'Evidence', 'AI Analysis', 'History'].map((t) => (
            <TabsTrigger value={t.toLowerCase().replace(' ', '-')} key={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <div className="detail-section">
            <h3>Situation summary</h3>
            <p>{i.summary}</p>
            <p className="muted">{i.description}</p>
            <div className="detail-facts">
              <div>
                <span>First detected</span>
                <strong>{dateLabel(i.firstDetectedAt, true)}</strong>
              </div>
              <div>
                <span>Last updated</span>
                <strong>{dateLabel(i.lastUpdatedAt, true)}</strong>
              </div>
              <div>
                <span>Supporting sources</span>
                <strong>{i.sourceCount} illustrative records</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{i.category}</strong>
              </div>
            </div>
          </div>
          <CrisisMap incidents={[i]} height={compact ? 240 : 340} />
          <div className="notice">
            <Info size={18} />
            <p>
              City-centre marker only. This fictional record does not establish an impact boundary
              or replace official guidance.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <div className="detail-section">
            <h3>Incident timeline</h3>
            <div className="timeline-item">
              <Clock3 size={15} />
              <div>
                <strong>First detected</strong>
                <p>{dateLabel(i.firstDetectedAt, true)} · Initial illustrative observation.</p>
              </div>
            </div>
            {q.data?.map((e) => (
              <div className="timeline-item" key={e.id}>
                <ShieldCheck size={15} />
                <div>
                  <strong>{e.title}</strong>
                  <p>Available {dateLabel(e.availableAt, true)}</p>
                  <p>{e.content}</p>
                </div>
              </div>
            ))}
            <div className="timeline-item">
              <Clock3 size={15} />
              <div>
                <strong>Current assessment</strong>
                <p>
                  {dateLabel(i.lastUpdatedAt, true)} · {i.severity} / {i.evidenceStatus}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          <div className="detail-section">
            <h3>Supporting evidence</h3>
            <p className="muted">
              Evidence status reflects the demo record, not an actual verification process.
            </p>
            {q.isLoading ? (
              <LoadingState />
            ) : q.isError ? (
              <ErrorState retry={() => q.refetch()} />
            ) : !q.data?.length ? (
              <EmptyState title="No evidence available" />
            ) : (
              q.data.map((e) => (
                <Card className="evidence-card" key={e.id}>
                  <div>
                    <strong>{e.title}</strong>
                    <EvidenceBadge status={e.verificationStatus} />
                  </div>
                  <p>{e.content}</p>
                  <dl>
                    <dt>Published</dt>
                    <dd>{dateLabel(e.publishedAt, true)}</dd>
                    <dt>Available</dt>
                    <dd>{dateLabel(e.availableAt, true)}</dd>
                    <dt>Ingested</dt>
                    <dd>{dateLabel(e.ingestedAt, true)}</dd>
                  </dl>
                  {e.sourceUrl ? (
                    <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                      Original source <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="muted">
                      Illustrative record · no source article or URL claimed
                    </span>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="ai-analysis">
          <div className="detail-section">
            <Badge>ILLUSTRATIVE ANALYSIS · NOT GENERATED BY A LIVE MODEL</Badge>
            <h3>Assessment at current snapshot</h3>
            <p>{i.summary}</p>
            <h3>Severity rationale</h3>
            <p>
              The sample dataset assigns {i.severity.toLowerCase()} severity to demonstrate
              prioritisation. This is not an evidence-backed risk measurement.
            </p>
            <h3>Evidence confidence</h3>
            <p>
              {i.evidenceStatus === 'Unverified'
                ? 'Insufficient evidence to establish the reported impact.'
                : 'The demo record illustrates multiple observations; actual verification has not occurred.'}{' '}
              No numerical confidence score is asserted.
            </p>
            <h3>Response considerations</h3>
            <p>
              Consult relevant official bulletins and verify local conditions before making
              operational decisions.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="detail-section">
            <h3>Record history</h3>
            <div className="timeline-item">
              <Clock3 size={15} />
              <div>
                <strong>Demo record created</strong>
                <p>{dateLabel(i.firstDetectedAt, true)}</p>
              </div>
            </div>
            <div className="timeline-item">
              <ShieldCheck size={15} />
              <div>
                <strong>Latest sample assessment</strong>
                <p>
                  {dateLabel(i.lastUpdatedAt, true)} · {i.lifecycleStatus}
                </p>
              </div>
            </div>
            <Link className="text-link" href={`/reports?incident=${i.id}`}>
              View related intelligence reports
            </Link>
          </div>
        </TabsContent>
      </Tabs>
      {compact && (
        <Link href={`/incidents/${i.id}`} className="panel-bottom-link">
          Open full incident details
          <ExternalLink size={14} />
        </Link>
      )}
    </div>
  );
}
export function IncidentDetailPage({ id }: { id: string }) {
  const q = useIncidents();
  const i = q.data?.find((i) => i.id === id);
  return (
    <div className="page-content">
      <PageHeader
        title="Incident intelligence"
        description="Evidence, timeline, and assessment in one place."
        actions={
          <Button asChild>
            <Link href="/incidents">Back to incidents</Link>
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : i ? (
        <Card>
          <IncidentDetails incident={i} />
        </Card>
      ) : (
        <EmptyState
          title="Incident not found"
          description="This incident is not available in the current dataset."
        />
      )}
    </div>
  );
}
