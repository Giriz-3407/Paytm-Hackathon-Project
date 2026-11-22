'use client';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
export function LoadingState() {
  return (
    <div role="status" aria-label="Loading data" className="loading-grid">
      {[0, 1, 2, 3].map((n) => (
        <div className="skeleton" key={n} />
      ))}
    </div>
  );
}
export function EmptyState({
  title = 'No incidents found',
  description = 'Try broadening your filters or choosing a different time range.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <Inbox size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="empty-state">
      <AlertCircle size={28} />
      <h3>Unable to load this data</h3>
      <p>Check your connection and try again.</p>
      <Button onClick={retry}>
        <RefreshCw size={15} />
        Retry
      </Button>
    </div>
  );
}
