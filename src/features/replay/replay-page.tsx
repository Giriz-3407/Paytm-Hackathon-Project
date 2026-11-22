'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  History,
  Clock3,
  Info,
  Radio,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import {
  Button,
  Card,
  Select,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
} from '@/components/ui/primitives';
import { useScenarios } from '@/services/hooks';
import { ReplayScenario } from '@/types/domain';
import { VirtualClock } from './engine/clock';
import { reconstruct } from './engine/reconstruct';
import { CrisisMap } from '@/features/crisis-map/crisis-map';
import { IncidentCard } from '@/components/shared/incidents';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/feedback';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useUI } from '@/stores/ui-store';
import { useReplaySnapshot } from '@/stores/replay-snapshot';
export function ReplayPage() {
  const q = useScenarios();
  const [id, setId] = useState('mumbai-2005');
  const scenario = q.data?.find((s) => s.id === id) || q.data?.[0];
  return (
    <div className="page-content">
      <PageHeader
        eyebrow="THE HISTORICAL CRISIS TIME MACHINE"
        title="Historical replay"
        description="Go back in time. Watch intelligence evolve as evidence becomes available."
      />
      <div className="notice replay-notice">
        <Info size={18} />
        <p>
          <strong>Illustrative training simulation.</strong> Historical context, synthetic reports
          and exact timestamps. No archived articles or verified historical claims are represented.
        </p>
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : scenario ? (
        <>
          <div className="scenario-picker">
            <label>
              Historical scenario
              <Select
                label="Historical scenario"
                value={id}
                onChange={(e) => setId(e.target.value)}
              >
                {q.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </label>
            <span>
              <History size={16} />
              Available knowledge follows the virtual clock
            </span>
          </div>
          <ReplaySession key={scenario.id} scenario={scenario} />
        </>
      ) : (
        <EmptyState title="No scenarios available" />
      )}
    </div>
  );
}
export function ReplayControls({
  status,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeed,
}: {
  status: string;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeed: (v: number) => void;
}) {
  return (
    <div className="replay-controls">
      <Button
        variant="default"
        onClick={status === 'playing' ? onPause : onPlay}
        disabled={status === 'completed'}
      >
        {status === 'playing' ? <Pause size={16} /> : <Play size={16} />}{' '}
        {status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start replay'}
      </Button>
      <Button aria-label="Reset replay" onClick={onReset}>
        <RotateCcw size={15} />
        Reset
      </Button>
      <Select label="Replay speed" value={speed} onChange={(e) => onSpeed(Number(e.target.value))}>
        {[1, 10, 60, 600, 3600].map((v) => (
          <option key={v} value={v}>
            {v}× speed
          </option>
        ))}
      </Select>
    </div>
  );
}
function ReplaySession({ scenario: s }: { scenario: ReplayScenario }) {
  const dateLabel = useDateFormatter('Asia/Kolkata');
  const clock = useMemo(
    () => new VirtualClock(Date.parse(s.startTime), Date.parse(s.endTime)),
    [s],
  );
  const [time, setTime] = useState(clock.time);
  const [status, setStatus] = useState(clock.status);
  const [speed, setSpeed] = useState(600);
  const [startAt, setStartAt] = useState(s.startTime.slice(0, 16));
  const [tab, setTab] = useState('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const replayAlerts = useUI((v) => v.replayAlerts);
  const state = useMemo(() => reconstruct(s.events, time), [s.events, time]);
  // Snapshot updates only when the eligible event boundary changes, not on clock ticks.
  const boundary = state.released.at(-1)?.availableAt || s.startTime;
  useEffect(() => {
    useReplaySnapshot
      .getState()
      .setSnapshot(reconstruct(s.events, Date.parse(boundary)).incidents, s.title, boundary);
  }, [boundary, s]);
  const sync = () => {
    setTime(clock.time);
    setStatus(clock.status);
  };
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(clock.time);
      setStatus(clock.status);
    }, 150);
    return () => {
      clearInterval(timer);
      clock.pause();
    };
  }, [clock]);
  useEffect(() => {
    if (status === 'completed' && replayAlerts) toast.success('Historical replay completed');
  }, [status, replayAlerts]);
  const start = () => {
    if (status === 'ready') {
      const t = Date.parse(`${startAt}:00Z`);
      clock.seek(Number.isFinite(t) ? t : clock.start);
    }
    clock.play();
    sync();
  };
  const progress = ((time - clock.start) / (clock.end - clock.start)) * 100;
  const seek = (t: number) => {
    clock.seek(t);
    sync();
  };
  return (
    <>
      <Card className="replay-console">
        <div className="replay-console-main">
          <div>
            <span className="eyebrow">VIRTUAL TIME · ASIA/KOLKATA</span>
            <h2 data-testid="virtual-clock">
              {new Intl.DateTimeFormat('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Kolkata',
              }).format(time)}
            </h2>
            <span>
              {dateLabel(time)}{' '}
              <Badge className={status === 'playing' ? 'freshness-badge' : 'neutral-badge'}>
                {status}
              </Badge>
            </span>
          </div>
          <div className="replay-config">
            <label>
              Start date (UTC)
              <Input
                type="date"
                aria-label="Replay start date"
                min={s.startTime.slice(0, 10)}
                max={s.endTime.slice(0, 10)}
                value={startAt.slice(0, 10)}
                disabled={status !== 'ready'}
                onChange={(e) => setStartAt(`${e.target.value}T${startAt.slice(11, 16)}`)}
              />
            </label>
            <label>
              Start time (UTC)
              <Input
                type="time"
                aria-label="Replay start time"
                value={startAt.slice(11, 16)}
                disabled={status !== 'ready'}
                onChange={(e) => setStartAt(`${startAt.slice(0, 10)}T${e.target.value}`)}
              />
            </label>
          </div>
          <ReplayControls
            status={status}
            onPlay={start}
            onPause={() => {
              clock.pause();
              sync();
            }}
            onReset={() => {
              clock.reset();
              setStartAt(s.startTime.slice(0, 16));
              sync();
            }}
            speed={speed}
            onSpeed={(v) => {
              clock.setSpeed(v);
              setSpeed(v);
              sync();
            }}
          />
        </div>
        <div className="replay-stats">
          <span>
            <Radio size={14} />
            <strong data-testid="released-count">{state.released.length}</strong> /{' '}
            {s.events.length} events released
          </span>
          <span>
            <MapPinIcon />
            <strong>{state.incidents.length}</strong> known incidents
          </span>
          <span>
            <Clock3 size={14} />
            {Math.round(progress)}% complete
          </span>
          <span className="muted">System time and virtual time are independent</span>
        </div>
      </Card>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="map">Incident Map</TabsTrigger>
          <TabsTrigger value="feed">Event Feed</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence Evolution</TabsTrigger>
          <TabsTrigger value="evaluation">Final Evaluation</TabsTrigger>
        </TabsList>
        <TabsContent value="map">
          <div className="replay-grid">
            <Card>
              <div className="panel-title">
                <h2>Known situation at virtual time</h2>
                <Badge>{s.location}</Badge>
              </div>
              <CrisisMap
                incidents={state.incidents}
                height={400}
                onSelect={(incident) => setSelectedId(incident.id)}
              />
            </Card>
            <Card className="replay-feed">
              <div className="panel-title">
                <h2>Current incidents</h2>
                <Badge>{state.incidents.length}</Badge>
              </div>
              {state.incidents.length ? (
                state.incidents.map((i) => (
                  <IncidentCard
                    key={i.id}
                    incident={i}
                    onSelect={(incident) => setSelectedId(incident.id)}
                  />
                ))
              ) : (
                <EmptyState
                  title="Waiting for the first observation"
                  description="Start playback or seek forward. The first event becomes available 10 virtual minutes into this scenario."
                />
              )}
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="feed">
          <Card className="event-feed">
            <h2>Available event feed</h2>
            {state.released.length ? (
              state.released.map((e) => (
                <div className="timeline-item" key={e.id}>
                  <Radio size={15} />
                  <div>
                    <strong>
                      {e.eventType === 'incident'
                        ? e.payload.title
                        : e.eventType === 'evidence'
                          ? e.payload.title
                          : `Assessment update: ${e.payload.severity}`}
                    </strong>
                    <p>
                      {dateLabel(e.availableAt, true)} · {e.eventType} · Illustrative
                    </p>
                    <p>{e.eventType === 'evidence' ? e.payload.content : e.payload.summary}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No events available yet" />
            )}
          </Card>
        </TabsContent>
        <TabsContent value="intelligence">
          <Card className="event-feed">
            <h2>Intelligence available now</h2>
            <p className="muted">
              Deterministic demo assessment using only eligible reports. No live AI model is
              connected.
            </p>
            {state.incidents.length ? (
              state.incidents.map((i) => (
                <div className="detail-section" key={i.id}>
                  <h3>{i.title}</h3>
                  <p>{i.summary}</p>
                  <p>
                    {i.severity} severity · {i.evidenceStatus} evidence · {i.sourceCount} available
                    source records
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Insufficient evidence"
                description="No reports have become available at this virtual time."
              />
            )}
          </Card>
        </TabsContent>
        <TabsContent value="evaluation">
          <Card className="event-feed">
            <Badge className="severity-medium">OUT-OF-BAND EVALUATION · FUTURE INFORMATION</Badge>
            <h2>Synthetic scenario outcome</h2>
            <p>{s.evaluation}</p>
            <p className="muted">
              This tab is explicitly separate from the replay engine and does not affect its
              incident assessments.
            </p>
            <h3>Data quality</h3>
            <p>{s.dataQualityNotes}</p>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="replay-timeline">
        <div className="panel-title">
          <h2>
            <History size={16} />
            Scenario timeline
          </h2>
          <span>
            {dateLabel(s.startTime, true)} – {dateLabel(s.endTime, true)}
          </span>
        </div>
        <div className="timeline-track">
          <input
            aria-label="Seek replay timeline"
            type="range"
            min={clock.start}
            max={clock.end}
            value={time}
            step={60000}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="event-markers">
            {s.events.map((e, n) => (
              <button
                key={e.id}
                className={Date.parse(e.availableAt) <= time ? 'released' : ''}
                style={{
                  left: `${((Date.parse(e.availableAt) - clock.start) / (clock.end - clock.start)) * 100}%`,
                }}
                title={`${dateLabel(e.availableAt, true)} · ${e.eventType}`}
                aria-label={`Seek to event ${n + 1}`}
                onClick={() => seek(Date.parse(e.availableAt))}
              />
            ))}
          </div>
        </div>
        <div className="timeline-controls">
          <Button
            size="sm"
            onClick={() =>
              seek(
                [...s.events].reverse().find((e) => Date.parse(e.availableAt) < time)?.availableAt
                  ? Date.parse(
                      [...s.events].reverse().find((e) => Date.parse(e.availableAt) < time)!
                        .availableAt,
                    )
                  : clock.start,
              )
            }
          >
            <SkipBack size={14} />
            Previous event
          </Button>
          <span>Seek backward to reconstruct earlier knowledge</span>
          <Button
            size="sm"
            onClick={() =>
              seek(
                Date.parse(
                  s.events.find((e) => Date.parse(e.availableAt) > time)?.availableAt || s.endTime,
                ),
              )
            }
          >
            Next event
            <SkipForward size={14} />
          </Button>
        </div>
      </Card>
      <Card className="released-reports">
        <div className="panel-title">
          <h2>Newly available reports</h2>
          <span>{state.evidence.length} released</span>
        </div>
        {state.evidence.length ? (
          state.evidence.map((e) => (
            <div key={e.id} className="report-strip">
              <FileIcon />
              <div>
                <strong>{e.title}</strong>
                <p>{e.content}</p>
                <small>
                  Published {dateLabel(e.publishedAt, true)} · Available{' '}
                  {dateLabel(e.availableAt, true)} · Synthetic source
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="muted padded">No supporting reports available at this virtual time.</p>
        )}
      </Card>
      <Dialog
        open={!!selectedId && state.incidents.some((i) => i.id === selectedId)}
        onOpenChange={(v) => !v && setSelectedId(null)}
        title="Replay incident intelligence"
        description="Only knowledge available at the current virtual time is shown."
      >
        {state.incidents
          .filter((i) => i.id === selectedId)
          .map((i) => (
            <div key={i.id}>
              <h2>{i.title}</h2>
              <p className="muted">
                {i.severity} severity · {i.evidenceStatus} · {i.lifecycleStatus}
              </p>
              <p className="padded">{i.summary}</p>
              <h3>Available evidence</h3>
              {state.evidence
                .filter((e) => e.incidentId === i.id)
                .map((e) => (
                  <div key={e.id} className="notice">
                    <div>
                      <strong>{e.title}</strong>
                      <p>{e.content}</p>
                      <p>Available {dateLabel(e.availableAt, true)}</p>
                    </div>
                  </div>
                ))}
            </div>
          ))}
      </Dialog>
    </>
  );
}
function MapPinIcon() {
  return <span aria-hidden="true">◎</span>;
}
function FileIcon() {
  return (
    <span className="report-file-icon" aria-hidden="true">
      ▤
    </span>
  );
}
