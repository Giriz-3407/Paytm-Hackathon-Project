import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/app-error';

type Part = 'body' | 'query' | 'params';
type Schemas = Partial<Record<Part, ZodType>>;

/**
 * Validates and normalises request parts with Zod. Parsed (trimmed, coerced, defaulted)
 * values are stored on `req.validated`; read them with `getValidated`.
 * Express 5 makes `req.query` read-only, hence the separate property.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const issues: { part: Part; path: string; message: string }[] = [];
    req.validated = {};

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        req.validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ part, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    next(issues.length ? AppError.validation(issues) : undefined);
  };
}

export function getValidated<T>(req: Request, part: Part): T {
  return req.validated[part] as T;
}
