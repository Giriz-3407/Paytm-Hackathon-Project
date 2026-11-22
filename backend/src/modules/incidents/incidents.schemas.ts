import { z } from 'zod';
import { CATEGORIES } from '../../constants';
import { paginationQuery } from '../../utils/pagination';

const severity = z.enum(['Critical', 'High', 'Medium', 'Low', 'Unknown']);
const evidenceStatus = z.enum(['Corroborated', 'Developing', 'Unverified']);
const lifecycleStatus = z.enum(['Active', 'Monitoring', 'Resolved']);
const category = z.enum(CATEGORIES);
const isoDate = z.iso.datetime({ offset: true });

/** Accepts `?categories=Flood,Fire` and `?categories=Flood&categories=Fire`. */
const listOf = <T extends z.ZodType>(item: T) =>
  z.preprocess(
    (v) =>
      v === undefined
        ? undefined
        : (Array.isArray(v) ? v : [v]).flatMap((s) => String(s).split(',')).filter(Boolean),
    z.array(item).max(20).optional(),
  );

export const idParam = z.object({ id: z.string().trim().min(1).max(64) });

export const listIncidentsQuery = paginationQuery.extend({
  search: z.string().trim().max(100).optional(),
  categories: listOf(category),
  severities: listOf(severity),
  evidence: evidenceStatus.optional(),
  lifecycleStatus: lifecycleStatus.optional(),
  state: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  sourceId: z.string().trim().max(64).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  sort: z.enum(['newest', 'severity', 'updated']).default('newest'),
});

export const createIncidentBody = z.strictObject({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(5000),
  category,
  severity: severity.default('Unknown'),
  evidenceStatus: evidenceStatus.default('Unverified'),
  lifecycleStatus: lifecycleStatus.default('Active'),
  location: z.strictObject({
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
  }),
  coordinates: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
  summary: z.string().trim().min(1).max(2000),
  firstDetectedAt: isoDate.optional(),
});

export const updateIncidentBody = z
  .strictObject({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(1).max(5000),
    severity,
    evidenceStatus,
    lifecycleStatus,
    summary: z.string().trim().min(1).max(2000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export type ListIncidentsQuery = z.infer<typeof listIncidentsQuery>;
export type CreateIncidentInput = z.infer<typeof createIncidentBody>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentBody>;
