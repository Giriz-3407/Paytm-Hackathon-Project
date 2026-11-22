import { z } from 'zod';

const isoDate = z.iso.datetime({ offset: true });

export const createEvidenceBody = z.strictObject({
  sourceId: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(300),
  sourceUrl: z.url({ protocol: /^https?$/ }).max(2048).nullish(),
  publishedAt: isoDate,
  /** Defaults to the ingestion time. */
  availableAt: isoDate.optional(),
  content: z.string().trim().min(1).max(10_000),
  verificationStatus: z.enum(['Corroborated', 'Developing', 'Unverified']).default('Unverified'),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceBody>;
