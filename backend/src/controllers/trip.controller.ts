import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createTripSchema, updateTripSchema } from '../validators/trip.validator';
import {
  createTrip, getTrips, getTripById, updateTrip, deleteTrip,
} from '../services/trip.service';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createTripSchema.parse(req.body);
    const trip  = await createTrip(req.user!.id, input);
    res.status(201).json({ success: true, data: { trip } });
  } catch (err) { next(err); }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trips = await getTrips(req.user!.id);
    res.json({ success: true, data: { trips } });
  } catch (err) { next(err); }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await getTripById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: { trip } });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateTripSchema.parse(req.body);
    const trip  = await updateTrip(req.params.id as string, req.user!.id, input);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.id}`).emit('trip:updated', { tripId: req.params.id, trip });
    res.json({ success: true, data: { trip } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteTrip(req.params.id as string, req.user!.id);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.id}`).emit('trip:deleted', { tripId: req.params.id });
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) { next(err); }
};
