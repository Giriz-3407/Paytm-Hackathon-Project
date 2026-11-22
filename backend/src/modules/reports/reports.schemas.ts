import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';

export const reportIdParam = z.object({ id: z.string().trim().min(1).max(64) });

export const listReportsQuery = paginationQuery.extend({
  incidentId: z.string().trim().min(1).max(64).optional(),
});

export const generateReportBody = z.strictObject({
  incidentId: z.string().trim().min(1).max(64),
});

export type ListReportsQuery = z.infer<typeof listReportsQuery>;
export type GenerateReportInput = z.infer<typeof generateReportBody>;
