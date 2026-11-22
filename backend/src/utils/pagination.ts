import { z } from 'zod';
import { PAGINATION } from '../constants';
import type { PaginationMeta } from './api-response';

/** Reusable query fragment: `?page=1&pageSize=50`. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

export type PaginationParams = z.infer<typeof paginationQuery>;

export const toSkipTake = ({ page, pageSize }: PaginationParams) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

export const buildMeta = ({ page, pageSize }: PaginationParams, total: number): PaginationMeta => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
