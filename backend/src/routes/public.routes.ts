import { Router, Request, Response, NextFunction } from 'express';
import { getPublicTrip } from '../services/trip.service';

const router = Router();

router.get('/trips/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await getPublicTrip(req.params.slug as string);
    res.json({ success: true, data: { trip } });
  } catch (err) { next(err); }
});

export default router;
