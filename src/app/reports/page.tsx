import { ReportsPage } from '@/features/reports/reports-page';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ incident?: string }>;
}) {
  const params = await searchParams;
  return <ReportsPage initialIncident={params.incident} />;
}
