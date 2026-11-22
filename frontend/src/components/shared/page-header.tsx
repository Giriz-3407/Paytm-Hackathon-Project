import { LIVE } from '@/lib/live';
import { Badge } from '@/components/ui/primitives';
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="page-title-row">
          <h1>{title}</h1>
          <Badge className="demo-badge">{LIVE ? 'LIVE DATA' : 'DEMO DATA'}</Badge>
        </div>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
