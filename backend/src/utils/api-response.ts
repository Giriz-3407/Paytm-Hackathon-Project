import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta: PaginationMeta | null;
}

export interface ApiFailure {
  success: false;
  message: string;
  error: { code: string; details?: unknown; requestId?: string };
}

interface SuccessOptions {
  message?: string;
  status?: number;
  meta?: PaginationMeta | null;
}

export function sendSuccess<T>(res: Response, data: T, options: SuccessOptions = {}) {
  const body: ApiSuccess<T> = {
    success: true,
    message: options.message ?? 'Operation completed successfully',
    data,
    meta: options.meta ?? null,
  };
  return res.status(options.status ?? 200).json(body);
}

export function buildFailure(
  message: string,
  code: string,
  details?: unknown,
  requestId?: string,
): ApiFailure {
  return { success: false, message, error: { code, details, requestId } };
}
