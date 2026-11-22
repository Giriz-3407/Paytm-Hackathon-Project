import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <p>This view is not available.</p>
      <Link className="button button-primary" href="/dashboard">
        Return to overview
      </Link>
    </div>
  );
}
