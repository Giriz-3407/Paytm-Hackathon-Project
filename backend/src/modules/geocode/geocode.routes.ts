import { Router } from 'express';
import { geocodeRateLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { geocodeController } from './geocode.controller';
import { searchQuery } from './geocode.schemas';

export const geocodeRouter = Router();

// Public (the map needs it), but tightly rate limited because it proxies a shared free service.
geocodeRouter.get('/search', geocodeRateLimiter, validate({ query: searchQuery }), geocodeController.search);
