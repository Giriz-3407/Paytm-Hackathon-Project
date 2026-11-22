import { BookOpen, History, ShieldCheck, Map, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shared/page-header';
export function HelpPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Help & about"
        description="A clear view of what Crisis Lens does, how to use it, and where its limits are."
      />
      <div className="help-intro">
        <span className="help-icon">
          <BookOpen size={32} />
        </span>
        <div>
          <h2>Clarity when it matters.</h2>
          <p>
            Crisis Lens brings incidents, geographical context, and source-aware intelligence into
            one workspace. This frontend is a demonstration, with no live ingestion or AI model
            connected.
          </p>
        </div>
      </div>
      <div className="help-grid">
        {[
          {
            icon: Map,
            title: 'Explore the situation',
            text: 'Start on Overview for the fixed demo snapshot. Use the map and incident filters to narrow by category, severity, evidence, state, or time.',
            href: '/dashboard',
            link: 'Open overview',
          },
          {
            icon: History,
            title: 'Travel back in time',
            text: 'Choose a scenario in Historical Replay, then start the clock. Events appear only when their available timestamp is reached. Seek backward to reconstruct earlier knowledge.',
            href: '/replay',
            link: 'Explore historical replay',
          },
          {
            icon: ShieldCheck,
            title: 'Read evidence carefully',
            text: 'Severity describes potential impact. Evidence status describes corroboration. They are separate assessments. In this demo, both are illustrative.',
            href: '/incidents',
            link: 'Browse incidents',
          },
        ].map((h) => (
          <Card className="help-card" key={h.title}>
            <h.icon size={24} />
            <h2>{h.title}</h2>
            <p>{h.text}</p>
            <Link className="text-link" href={h.href}>
              {h.link}
            </Link>
          </Card>
        ))}
      </div>
      <Card className="settings-card">
        <h2>Understanding the data</h2>
        <p>
          <strong>Demo monitoring:</strong> fictional incidents referenced to 22 November 2026 at
          12:00 IST. Nothing in this workspace should be interpreted as a current emergency.
        </p>
        <p>
          <strong>Historical replay:</strong> real historical scenario names with synthetic
          observations and timestamps. No historical article URLs, exact publication times, or
          verified impact claims are invented.
        </p>
        <p>
          <strong>Timestamp semantics:</strong> publication is when a source says it was published;
          availability is when the system can use it; ingestion is when processing records it. The
          replay gates on availability.
        </p>
        <h2>Official information</h2>
        <p>
          Consult official authorities and local channels for emergency guidance. Crisis Lens
          provides situational awareness and does not replace official warnings.
        </p>
        <a className="text-link" href="https://ndma.gov.in" target="_blank" rel="noreferrer">
          National Disaster Management Authority
          <ExternalLink size={13} />
        </a>
        <a className="text-link" href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer">
          India Meteorological Department
          <ExternalLink size={13} />
        </a>
      </Card>
    </div>
  );
}
