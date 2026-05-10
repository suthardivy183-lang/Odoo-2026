import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  activityQuerySchema,
  addStopActivitySchema,
  updateStopActivitySchema,
} from '../validators/activity.validator';
import {
  searchActivities, getActivityById,
  addStopActivity, getStopActivities,
  updateStopActivity, deleteStopActivity,
} from '../services/activity.service';

// ── Public activity browse ───────────────────────────────────────────────────

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params     = activityQuerySchema.parse(req.query);
    const activities = await searchActivities(params);
    res.json({ success: true, data: { activities } });
  } catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const activity = await getActivityById(id);
    res.json({ success: true, data: { activity } });
  } catch (err) { next(err); }
};

// ── Stop activity management ─────────────────────────────────────────────────

export const addToStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input    = addStopActivitySchema.parse(req.body);
    const activity = await addStopActivity(
      req.params.tripId as string, req.params.stopId as string, req.user!.id, input
    );
    res.status(201).json({ success: true, data: { activity } });
  } catch (err) { next(err); }
};

export const listForStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activities = await getStopActivities(
      req.params.tripId as string, req.params.stopId as string, req.user!.id
    );
    res.json({ success: true, data: { activities } });
  } catch (err) { next(err); }
};

export const updateOnStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input    = updateStopActivitySchema.parse(req.body);
    const activity = await updateStopActivity(
      req.params.tripId as string, req.params.stopId as string,
      req.params.activityId as string, req.user!.id, input
    );
    res.json({ success: true, data: { activity } });
  } catch (err) { next(err); }
};

export const removeFromStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteStopActivity(
      req.params.tripId as string, req.params.stopId as string,
      req.params.activityId as string, req.user!.id
    );
    res.json({ success: true, message: 'Activity removed from stop' });
  } catch (err) { next(err); }
};
