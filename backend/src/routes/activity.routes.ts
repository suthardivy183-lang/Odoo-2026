import { Router } from 'express';
import { list, getOne, addToStop, listForStop, updateOnStop, removeFromStop } from '../controllers/activity.controller';
import { authMiddleware } from '../middleware/auth';

// Public activity browser
const publicRouter = Router();
publicRouter.get('/',    list);
publicRouter.get('/:id', getOne);

// Nested under /api/trips/:tripId/stops/:stopId/activities  (mergeParams)
const stopRouter = Router({ mergeParams: true });
stopRouter.use(authMiddleware);
stopRouter.get('/',              listForStop);
stopRouter.post('/',             addToStop);
stopRouter.put('/:activityId',   updateOnStop);
stopRouter.delete('/:activityId', removeFromStop);

export { publicRouter as activityRouter, stopRouter as stopActivityRouter };
