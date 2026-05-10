import { Router, Request, Response, NextFunction } from 'express';
import { getPublicTrip, copyPublicTrip } from '../services/trip.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/trips/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await getPublicTrip(req.params.slug as string);
    res.json({ success: true, data: { trip } });
  } catch (err) { next(err); }
});

router.post('/trips/:slug/copy', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await copyPublicTrip(req.params.slug as string, req.user!.id);
    res.status(201).json({ success: true, data: { trip } });
  } catch (err) { next(err); }
});

export default router;
