'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  TriangleAlert,
  MapPin,
  Plus,
  ShieldQuestion,
  Database,
  RefreshCw,
  Download,
  Radio,
  Clock3,
  ChevronRight,
  Info,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useIncidents, useSources } from '@/services/hooks';
import { PageHeader } from '@/components/shared/page-header';
import { Button, Card, Badge, Select, Input, Tooltip } from '@/components/ui/primitives';
import { CrisisMap } from '@/features/crisis-map/crisis-map';
import { SeverityChart, CategoryChart } from './charts';
import { CompactIncident } from '@/components/shared/incidents';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/feedback';
import { filterIncidents, rangeStart } from '@/features/incidents/filter';
import { DEMO_NOW } from '@/data/mock-data';
import { downloadCsv } from '@/lib/utils';
import { toast } from 'sonner';
export function Dashboard() {
  const query = useIncidents();
  const sources = useSources();
  const [range, setRange] = useState('7');
  const [from, setFrom] = useState('2026-11-01');
  const [to, setTo] = useState('2026-11-22');
  const [severity, setSeverity] = useState('');
  const [mapTab, setMapTab] = useState('all');
  const [ack, setAck] = useState<string[]>([]);
  const data = filterIncidents(query.data || [], {
    from: range === 'custom' ? `${from}T00:00:00+05:30` : rangeStart(Number(range), DEMO_NOW),
    to: range === 'custom' ? `${to}T23:59:59+05:30` : DEMO_NOW,
  });
  const active = data.filter((i) => i.lifecycleStatus !== 'Resolved');
  const critical = data.filter((i) => i.severity === 'Critical');
  const metrics = [
    {
      label: 'Active incidents',
      value: active.length,
      icon: Activity,
      note: 'Active & monitoring',
      tip: 'Incidents in Active or Monitoring lifecycle status within the selected range.',
      tone: 'blue',
    },
    {
      label: 'Critical incidents',
      value: critical.length,
      icon: TriangleAlert,
      note: 'Require close attention',
      tip: 'Incidents currently assessed as Critical.',
      tone: 'red',
    },
    {
      label: 'Regions affected',
      value: new Set(data.map((i) => i.location.state)).size,
      icon: MapPin,
      note: 'States & union territories',
      tip: 'Distinct states and union territories represented in the selected data.',
      tone: 'violet',
    },
    {
      label: 'New in last 24 hours',
      value: data.filter((i) => i.firstDetectedAt >= rangeStart(1, DEMO_NOW)).length,
      icon: Plus,
      note: 'Since demo snapshot − 24h',
      tip: 'Selected incidents first detected in the 24 hours before the fixed demo snapshot.',
      tone: 'blue',
    },
    {
      label: 'Awaiting verification',
      value: data.filter((i) => i.evidenceStatus === 'Unverified').length,
      icon: ShieldQuestion,
      note: 'Pending corroboration',
      tip: 'Incidents with Unverified evidence status.',
      tone: 'amber',
    },
    {
      label: 'Demo sources enabled',
      value: (sources.data || []).filter((s) => s.enabled && s.status !== 'Offline').length,
      icon: Database,
      note: `${sources.data?.length || 0} configured sources`,
      tip: 'Enabled simulated sources. No external integrations are connected.',
      tone: 'green',
    },
  ];
  const refresh = async () => {
    await Promise.all([query.refetch(), sources.refetch()]);
    toast.success('Demo snapshot refreshed');
  };
  return (
    <div className="page-content">
      <PageHeader
        title="Crisis overview"
        description="Your command center for crisis intelligence across India."
        actions={
          <>
            <Button
              disabled={!data.length || query.isLoading}
              onClick={() =>
                downloadCsv(
                  data.map((i) => ({
                    id: i.id,
                    title: i.title,
                    category: i.category,
                    severity: i.severity,
                    city: i.location.city,
                    state: i.location.state,
                    evidence: i.evidenceStatus,
                    detected: i.firstDetectedAt,
                  })),
                )
              }
            >
              <Download size={15} />
              Export overview
            </Button>
            <Button variant="default" onClick={refresh}>
              <RefreshCw size={15} className={query.isFetching ? 'spin' : ''} />
              Refresh data
            </Button>
          </>
        }
      />
      <div className="overview-toolbar">
        <div className="monitoring-status">
          <span className="status-dot" />
          <strong>Demo monitoring</strong>
          <span className="toolbar-separator" />
          <span>
            <Clock3 size={13} />
            Snapshot: 22 Nov 2026, 12:00 IST
          </span>
          <Badge className="freshness-badge">Fixed demo snapshot</Badge>
        </div>
        <Select
          label="Dashboard time range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="custom">Custom date range</option>
        </Select>
      </div>
      {range === 'custom' && (
        <div className="custom-range">
          <label>
            Start date
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            End date
            <Input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      )}
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState retry={() => query.refetch()} />
      ) : (
        <>
          <div className="metric-grid">
            {metrics.map((m) => (
              <Card className="metric-card" key={m.label}>
                <div className="metric-top">
                  <span>{m.label}</span>
                  <Tooltip label={m.tip}>
                    <button aria-label={`About ${m.label}`}>
                      <Info size={12} />
                    </button>
                  </Tooltip>
                </div>
                <div className="metric-value">
                  <strong>{m.value.toString().padStart(2, '0')}</strong>
                  <span className={`metric-icon ${m.tone}`}>
                    <m.icon size={19} />
                  </span>
                </div>
                <span className="metric-note">{m.note}</span>
              </Card>
            ))}
          </div>
          <div className="dashboard-main">
            <Card className="map-panel">
              <div className="panel-title">
                <div>
                  <h2>
                    <MapPin size={16} />
                    Crisis landscape
                  </h2>
                  <p>Geographical overview of illustrative incidents</p>
                </div>
                <Link className="text-link" href="/map">
                  Explore map <ExternalLink size={12} />
                </Link>
              </div>
              <div className="map-filter-row">
                <div className="segmented">
                  <button
                    className={mapTab === 'all' ? 'active' : ''}
                    onClick={() => setMapTab('all')}
                  >
                    All incidents <span>{data.length}</span>
                  </button>
                  <button
                    className={mapTab === 'active' ? 'active' : ''}
                    onClick={() => setMapTab('active')}
                  >
                    Active only
                  </button>
                </div>
                <Select
                  label="Map severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="">All severities</option>
                  {['Critical', 'High', 'Medium', 'Low', 'Unknown'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <CrisisMap
                incidents={(mapTab === 'active' ? active : data).filter(
                  (i) => !severity || i.severity === severity,
                )}
                height={383}
              />
              <div className="map-panel-footer">
                <span>
                  <Info size={12} />
                  Markers show city-level demo locations
                </span>
                <span>{new Set(data.map((i) => i.location.state)).size} regions represented</span>
              </div>
            </Card>
            <Card className="feed-panel">
              <div className="panel-title">
                <h2>
                  <Radio size={16} />
                  Recent incidents
                </h2>
                <Badge className="neutral-badge">{data.length} incidents</Badge>
              </div>
              <div className="feed-caption">Latest updates from the demo dataset</div>
              <div className="recent-feed">
                {data.length ? (
                  data.slice(0, 5).map((i) => <CompactIncident key={i.id} incident={i} />)
                ) : (
                  <EmptyState />
                )}
              </div>
              <Link className="panel-bottom-link" href="/incidents">
                View incident feed
                <ChevronRight size={14} />
              </Link>
            </Card>
          </div>
          <div className="dashboard-bottom">
            <SeverityChart incidents={data} />
            <CategoryChart incidents={data} />
            <Card className="alerts-panel">
              <div className="panel-title">
                <h2>
                  <TriangleAlert size={16} />
                  Attention required
                </h2>
                <Badge className="severity-critical">
                  {critical.filter((i) => !ack.includes(i.id)).length}
                </Badge>
              </div>
              {critical.filter((i) => !ack.includes(i.id)).length ? (
                critical
                  .filter((i) => !ack.includes(i.id))
                  .slice(0, 2)
                  .map((i) => (
                    <div key={i.id} className="alert-item">
                      <div>
                        <span className="alert-label">CRITICAL · DEMO</span>
                        <Link href={`/incidents/${i.id}`}>
                          <h3>{i.title}</h3>
                        </Link>
                        <p>
                          {i.location.city}, {i.location.state}
                        </p>
                      </div>
                      <Tooltip label="Acknowledge this demo alert">
                        <button
                          aria-label={`Acknowledge ${i.id}`}
                          onClick={() => {
                            setAck((v) => [...v, i.id]);
                            toast.success('Demo alert acknowledged');
                          }}
                        >
                          <Check size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  ))
              ) : (
                <div className="alerts-clear">
                  <Check size={20} />
                  <span>No unacknowledged critical alerts</span>
                </div>
              )}
              <div className="alerts-note">
                <Info size={12} />
                Demo assessments, not official warnings
              </div>
            </Card>
          </div>
          <Card className="source-health">
            <div>
              <span className="source-health-icon">
                <Database size={17} />
              </span>
              <h2>Source health</h2>
              <span className="source-health-sub">Simulated integrations</span>
            </div>
            <div className="source-health-items">
              {sources.isLoading ? (
                <span>Loading sources…</span>
              ) : sources.isError ? (
                <Button onClick={() => sources.refetch()}>Retry sources</Button>
              ) : (
                (sources.data || []).map((s) => (
                  <Link href="/sources" key={s.id}>
                    <span className={`status-dot ${s.status === 'Delayed' ? 'warning' : ''}`} />
                    {s.name}
                    <span className="source-status-label">{s.status}</span>
                  </Link>
                ))
              )}
            </div>
            <Link href="/sources" className="text-link">
              Manage
              <ChevronRight size={14} />
            </Link>
          </Card>
          <div className="demo-footnote">
            <Info size={13} />
            You’re exploring a demo workspace. All incidents, assessments, and ingestion activity
            are illustrative. <Link href="/help">Learn more</Link>
          </div>
        </>
      )}
    </div>
  );
}
