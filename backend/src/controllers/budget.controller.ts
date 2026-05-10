import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import { updateBudgetSchema } from '../validators/budget.validator';
import { getTripBudget, updateTripBudget } from '../services/budget.service';

export const getBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const budget = await getTripBudget(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data: { budget } });
  } catch (err) { next(err); }
};

export const updateBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId as string;
    const input  = updateBudgetSchema.parse(req.body);
    await updateTripBudget(tripId, req.user!.id, input);

    // Re-fetch with computed totals so all clients receive identical data
    const budget = await getTripBudget(tripId, req.user!.id);

    // Broadcast to everyone in this trip's room (including the sender)
    const io = req.app.get('io') as SocketIOServer | undefined;
    io?.to(`trip:${tripId}`).emit('budget:updated', { tripId, budget });

    res.json({ success: true, data: { budget } });
  } catch (err) { next(err); }
};
