import { IncidentDetailPage } from '@/features/incidents/incident-details';
export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  return <IncidentDetailPage id={incidentId} />;
}
