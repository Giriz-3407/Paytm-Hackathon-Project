import { Incident, ReplayEvent, ReplayScenario } from '@/types/domain';
function scenario(
  id: string,
  title: string,
  date: string,
  city: string,
  state: string,
  coordinates: [number, number],
): ReplayScenario {
  const start = Date.parse(date);
  const at = (minutes: number) => new Date(start + minutes * 60000).toISOString();
  const incident = (n: number, place: string, severity: Incident['severity']): Incident => ({
    id: `${id}-${n}`,
    title: `Illustrative flooding observation — ${place}`,
    description:
      'Simulated event for replay training. This record is not an archived article or verified historical claim.',
    category: 'Flood',
    severity,
    evidenceStatus: 'Unverified',
    lifecycleStatus: 'Active',
    location: { city: place, state, district: city },
    coordinates,
    firstDetectedAt: at(n === 1 ? 10 : 90),
    lastUpdatedAt: at(n === 1 ? 10 : 90),
    sourceCount: 0,
    summary: `An illustrative initial observation in ${place}. Extent of impact remains uncertain.`,
    relatedEvidenceIds: [],
    mode: 'replay',
  });
  const events: ReplayEvent[] = [
    {
      id: `${id}-1`,
      scenarioId: id,
      availableAt: at(10),
      eventType: 'incident',
      payload: incident(1, city, 'Medium'),
    },
    {
      id: `${id}-2`,
      scenarioId: id,
      availableAt: at(25),
      eventType: 'evidence',
      payload: {
        id: `${id}-e1`,
        incidentId: `${id}-1`,
        relatedIncidentId: `${id}-1`,
        sourceId: 'training-archive',
        title: 'Illustrative first field observation',
        sourceUrl: null,
        publishedAt: at(20),
        availableAt: at(25),
        ingestedAt: at(25),
        content:
          'Simulated report describes water accumulating in low-lying areas. No confirmed impact figures are available.',
        verificationStatus: 'Unverified',
        category: 'Flood',
        location: { city, state, district: city },
      },
    },
    {
      id: `${id}-3`,
      scenarioId: id,
      availableAt: at(50),
      eventType: 'update',
      payload: {
        incidentId: `${id}-1`,
        severity: 'High',
        summary:
          'Additional illustrative observations indicate transport disruption. Assessment escalated using only currently available evidence.',
        evidenceStatus: 'Developing',
      },
    },
    {
      id: `${id}-4`,
      scenarioId: id,
      availableAt: at(90),
      eventType: 'incident',
      payload: incident(2, `${city} outskirts`, 'Medium'),
    },
    {
      id: `${id}-5`,
      scenarioId: id,
      availableAt: at(110),
      eventType: 'evidence',
      payload: {
        id: `${id}-e2`,
        incidentId: `${id}-1`,
        relatedIncidentId: `${id}-1`,
        sourceId: 'training-archive',
        title: 'Illustrative corroborating observation',
        sourceUrl: null,
        publishedAt: at(100),
        availableAt: at(110),
        ingestedAt: at(110),
        content:
          'A second simulated account describes continued disruption. Independently verified casualty information is unavailable.',
        verificationStatus: 'Developing',
        category: 'Flood',
        location: { city, state, district: city },
      },
    },
    {
      id: `${id}-6`,
      scenarioId: id,
      availableAt: at(150),
      eventType: 'update',
      payload: {
        incidentId: `${id}-1`,
        severity: 'Critical',
        summary:
          'Multiple simulated observations now indicate widespread disruption in the training scenario.',
        evidenceStatus: 'Corroborated',
      },
    },
    {
      id: `${id}-7`,
      scenarioId: id,
      availableAt: at(200),
      eventType: 'update',
      payload: {
        incidentId: `${id}-2`,
        severity: 'High',
        summary: 'Illustrative peripheral disruption grows; local conditions remain uncertain.',
        evidenceStatus: 'Developing',
      },
    },
    {
      id: `${id}-8`,
      scenarioId: id,
      availableAt: at(250),
      eventType: 'update',
      payload: {
        incidentId: `${id}-1`,
        severity: 'High',
        summary: 'Simulated reports indicate stabilising conditions. Monitoring continues.',
        evidenceStatus: 'Corroborated',
        lifecycleStatus: 'Monitoring',
      },
    },
  ];
  return {
    id,
    title,
    description:
      'A time-aware, illustrative training simulation inspired by a historical flood. All event content and exact times are synthetic.',
    location: city,
    startTime: at(0),
    endTime: at(300),
    events,
    dataQualityNotes:
      'All timestamps, observations, and assessments in this replay are illustrative. No real historical articles, exact publication times, or official findings are represented.',
    evaluation:
      'Training outcome: the initial incident escalated and later stabilised; a second area developed disruption. This synthetic outcome is shown only in Final Evaluation and is excluded from the replay state.',
  };
}
export const replayScenarios = [
  scenario(
    'mumbai-2005',
    'Mumbai Floods · July 2005',
    '2005-07-26T03:30:00Z',
    'Mumbai',
    'Maharashtra',
    [19.076, 72.8777],
  ),
  scenario(
    'kerala-2018',
    'Kerala Floods · August 2018',
    '2018-08-15T03:30:00Z',
    'Kochi',
    'Kerala',
    [9.9312, 76.2673],
  ),
];
