import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import { createLodgingSchema, updateLodgingSchema } from '../validators/lodging.validator';
import {
  createTripLodging,
  deleteTripLodging,
  getTripLodging,
  syncLodgingBudget,
  updateTripLodging,
} from '../services/lodging.service';
import { getTripBudget } from '../services/budget.service';

const broadcastLodgingAndBudget = async (
  io: SocketIOServer | undefined,
  tripId: string,
  userId: string
) => {
  await syncLodgingBudget(tripId);
  const [lodging, budget] = await Promise.all([
    getTripLodging(tripId, userId),
    getTripBudget(tripId, userId),
  ]);

  io?.to(`trip:${tripId}`).emit('lodging:updated', { tripId, lodging });
  io?.to(`trip:${tripId}`).emit('budget:updated', { tripId, budget });

  return { lodging, budget };
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lodging = await getTripLodging(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data: lodging });
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId as string;
    const input = createLodgingSchema.parse(req.body);
    await createTripLodging(tripId, req.user!.id, input);

    const io = req.app.get('io') as SocketIOServer | undefined;
    const { lodging, budget } = await broadcastLodgingAndBudget(io, tripId, req.user!.id);

    res.status(201).json({ success: true, data: { ...lodging, budget } });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId as string;
    const input = updateLodgingSchema.parse(req.body);
    await updateTripLodging(tripId, req.params.lodgingId as string, req.user!.id, input);

    const io = req.app.get('io') as SocketIOServer | undefined;
    const { lodging, budget } = await broadcastLodgingAndBudget(io, tripId, req.user!.id);

    res.json({ success: true, data: { ...lodging, budget } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId as string;
    await deleteTripLodging(tripId, req.params.lodgingId as string, req.user!.id);

    const io = req.app.get('io') as SocketIOServer | undefined;
    const { lodging, budget } = await broadcastLodgingAndBudget(io, tripId, req.user!.id);

    res.json({ success: true, data: { ...lodging, budget } });
  } catch (err) { next(err); }
};
