import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { geocodeRouter } from '../modules/geocode/geocode.routes';
import { healthRouter } from '../modules/health/health.routes';
import { incidentsRouter } from '../modules/incidents/incidents.routes';
import { ingestionRouter } from '../modules/ingestion/ingestion.routes';
import { replayRouter } from '../modules/replay/replay.routes';
import { reportsRouter } from '../modules/reports/reports.routes';
import { sourcesRouter } from '../modules/sources/sources.routes';

/** Central registration of every module, mounted under `/api/v1` by app.ts. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/geocode', geocodeRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/incidents', incidentsRouter);
apiRouter.use('/ingestion', ingestionRouter);
apiRouter.use('/sources', sourcesRouter);
apiRouter.use('/replay', replayRouter);
apiRouter.use('/reports', reportsRouter);
