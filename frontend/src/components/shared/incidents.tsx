'use client';
import Link from 'next/link';
import { MapPin, Radio, Clock3, ShieldCheck, ChevronRight } from 'lucide-react';
import { Incident } from '@/types/domain';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { useDateFormatter } from '@/hooks/use-date-formatter';
export function SeverityBadge({ severity }: { severity: Incident['severity'] }) {
  return (
    <Badge className={`severity-${severity.toLowerCase()}`}>
      <span className="severity-dot" />
      {severity}
    </Badge>
  );
}
export function EvidenceBadge({ status }: { status: Incident['evidenceStatus'] }) {
  return (
    <span className="evidence-badge">
      <ShieldCheck size={12} />
      {status}
    </span>
  );
}
export function IncidentCard({
  incident: i,
  selected,
  onSelect,
}: {
  incident: Incident;
  selected?: boolean;
  onSelect?: (i: Incident) => void;
}) {
  const dateLabel = useDateFormatter(i.mode === 'replay' ? 'Asia/Kolkata' : undefined);
  const content = (
    <>
      <div className="incident-meta">
        <span className={`category-label category-${i.category.toLowerCase().replace(' ', '-')}`}>
          <Radio size={12} />
          {i.category}
        </span>
        <SeverityBadge severity={i.severity} />
      </div>
      <h3>{i.title}</h3>
      <p className="location">
        <MapPin size={13} />
        {i.location.city}, {i.location.state}
      </p>
      <p className="incident-summary">{i.summary}</p>
      <div className="incident-footer">
        <EvidenceBadge status={i.evidenceStatus} />
        <span>
          {i.sourceCount} sources · {dateLabel(i.lastUpdatedAt, true)}
        </span>
      </div>
    </>
  );
  return onSelect ? (
    <button className={cn('incident-card', selected && 'selected')} onClick={() => onSelect(i)}>
      {content}
    </button>
  ) : (
    <Link className="incident-card" href={`/incidents/${i.id}`}>
      {content}
    </Link>
  );
}
export function CompactIncident({ incident: i }: { incident: Incident }) {
  const dateLabel = useDateFormatter();
  return (
    <Link className="compact-incident" href={`/incidents/${i.id}`}>
      <span className={`incident-line severity-bg-${i.severity.toLowerCase()}`} />
      <div>
        <div className="compact-heading">
          <span>{i.category}</span>
          <SeverityBadge severity={i.severity} />
        </div>
        <h3>{i.title}</h3>
        <div className="compact-meta">
          <span>
            <MapPin size={12} />
            {i.location.city}, {i.location.state}
          </span>
          <span>
            <Clock3 size={12} />
            {dateLabel(i.lastUpdatedAt, true)}
          </span>
        </div>
      </div>
      <ChevronRight size={16} />
    </Link>
  );
}
