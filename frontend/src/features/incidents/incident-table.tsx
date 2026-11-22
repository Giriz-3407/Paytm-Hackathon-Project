'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowUpDown, Columns3 } from 'lucide-react';
import { Incident } from '@/types/domain';
import { Button, Dialog } from '@/components/ui/primitives';
import { SeverityBadge, EvidenceBadge } from '@/components/shared/incidents';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { severityRank } from './filter';
export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  const dateLabel = useDateFormatter();
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<'title' | 'severity' | 'date'>('date');
  const [asc, setAsc] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const cols = ['Category', 'Evidence', 'Status', 'First detected', 'Updated', 'Sources'];
  const sorted = [...incidents].sort(
    (a, b) =>
      (sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'severity'
          ? severityRank[a.severity] - severityRank[b.severity]
          : Date.parse(a.firstDetectedAt) - Date.parse(b.firstDetectedAt)) * (asc ? 1 : -1),
  );
  const pages = Math.max(1, Math.ceil(sorted.length / 8));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * 8, current * 8 + 8);
  const toggleSort = (s: typeof sort) => {
    setSort(s);
    setAsc(sort === s ? !asc : true);
  };
  const has = (c: string) => !hidden.includes(c);
  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <span>
          {selected.filter((id) => incidents.some((i) => i.id === id)).length} selected ·{' '}
          {incidents.length} incidents
        </span>
        <Button size="sm" onClick={() => setColumnsOpen(true)}>
          <Columns3 size={14} />
          Columns
        </Button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  checked={visible.length > 0 && visible.every((i) => selected.includes(i.id))}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...new Set([...selected, ...visible.map((i) => i.id)])]
                        : selected.filter((id) => !visible.some((i) => i.id === id)),
                    )
                  }
                />
              </th>
              <th>Incident ID</th>
              <th>
                <button onClick={() => toggleSort('title')}>
                  Incident
                  <ArrowUpDown size={12} />
                </button>
              </th>
              {has('Category') && <th>Category</th>}
              <th>Location</th>
              <th>
                <button onClick={() => toggleSort('severity')}>
                  Severity
                  <ArrowUpDown size={12} />
                </button>
              </th>
              {has('Evidence') && <th>Evidence</th>}
              {has('Status') && <th>Status</th>}
              {has('First detected') && (
                <th>
                  <button onClick={() => toggleSort('date')}>
                    First detected
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              )}
              {has('Updated') && <th>Updated</th>}
              {has('Sources') && <th>Sources</th>}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <tr key={i.id}>
                <td>
                  <input
                    aria-label={`Select ${i.id}`}
                    type="checkbox"
                    checked={selected.includes(i.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, i.id]
                          : selected.filter((id) => id !== i.id),
                      )
                    }
                  />
                </td>
                <td className="mono">{i.id}</td>
                <td className="title-cell">
                  <Link href={`/incidents/${i.id}`}>{i.title}</Link>
                </td>
                {has('Category') && <td>{i.category}</td>}
                <td>
                  {i.location.city}
                  <small>{i.location.state}</small>
                </td>
                <td>
                  <SeverityBadge severity={i.severity} />
                </td>
                {has('Evidence') && (
                  <td>
                    <EvidenceBadge status={i.evidenceStatus} />
                  </td>
                )}
                {has('Status') && <td>{i.lifecycleStatus}</td>}
                {has('First detected') && <td>{dateLabel(i.firstDetectedAt, true)}</td>}
                {has('Updated') && <td>{dateLabel(i.lastUpdatedAt, true)}</td>}
                {has('Sources') && <td>{i.sourceCount}</td>}
                <td>
                  <Link className="text-link" href={`/incidents/${i.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>
          Showing {incidents.length ? current * 8 + 1 : 0}–
          {Math.min((current + 1) * 8, incidents.length)} of {incidents.length}
        </span>
        <div>
          <Button
            size="icon"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={15} />
          </Button>
          <span>
            Page {current + 1} of {pages}
          </span>
          <Button
            size="icon"
            aria-label="Next page"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
      <Dialog open={columnsOpen} onOpenChange={setColumnsOpen} title="Visible columns">
        {cols.map((c) => (
          <label className="checkbox-row" key={c}>
            <input
              type="checkbox"
              checked={has(c)}
              onChange={(e) =>
                setHidden(e.target.checked ? hidden.filter((h) => h !== c) : [...hidden, c])
              }
            />
            {c}
          </label>
        ))}
      </Dialog>
    </div>
  );
}
