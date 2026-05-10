import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { addStopSchema, updateStopSchema, reorderSchema } from '../validators/stop.validator';
import { addStop, getStops, updateStop, deleteStop, reorderStops, optimizeStops } from '../services/stop.service';

export const add = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = addStopSchema.parse(req.body);
    const stop  = await addStop(req.params.tripId as string, req.user!.id, input);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:changed', { tripId: req.params.tripId, resource: 'stops' });
    res.status(201).json({ success: true, data: { stop } });
  } catch (err) { next(err); }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stops = await getStops(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data: { stops } });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateStopSchema.parse(req.body);
    const stop  = await updateStop(req.params.tripId as string, req.params.stopId as string, req.user!.id, input);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:changed', { tripId: req.params.tripId, resource: 'stops' });
    res.json({ success: true, data: { stop } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteStop(req.params.tripId as string, req.params.stopId as string, req.user!.id);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:changed', { tripId: req.params.tripId, resource: 'stops' });
    res.json({ success: true, message: 'Stop removed' });
  } catch (err) { next(err); }
};

export const reorder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = reorderSchema.parse(req.body);
    const stops = await reorderStops(req.params.tripId as string, req.user!.id, input);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:changed', { tripId: req.params.tripId, resource: 'stops' });
    res.json({ success: true, data: { stops } });
  } catch (err) { next(err); }
};

export const optimize = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await optimizeStops(req.params.tripId as string, req.user!.id);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:changed', { tripId: req.params.tripId, resource: 'stops' });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
