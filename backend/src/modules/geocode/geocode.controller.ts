import type { Request, Response } from 'express';
import { getValidated } from '../../middleware/validate';
import { sendSuccess } from '../../utils/api-response';
import type { SearchQuery } from './geocode.schemas';
import { geocodeService } from './geocode.service';

export const geocodeController = {
  async search(req: Request, res: Response) {
    const { q, limit } = getValidated<SearchQuery>(req, 'query');
    const results = await geocodeService.search(q, limit);
    sendSuccess(res, results, { message: results.length ? 'Places found' : 'No places found' });
  },
};
