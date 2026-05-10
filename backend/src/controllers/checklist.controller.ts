import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createChecklistSchema, updateChecklistSchema } from '../validators/checklist.validator';
import {
  getChecklist, addChecklistItem, updateChecklistItem,
  toggleChecklistItem, deleteChecklistItem,
} from '../services/checklist.service';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await getChecklist(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
};

export const add = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createChecklistSchema.parse(req.body);
    const item  = await addChecklistItem(req.params.tripId as string, req.user!.id, input);
    res.status(201).json({ success: true, data: { item } });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateChecklistSchema.parse(req.body);
    const item  = await updateChecklistItem(
      req.params.tripId as string, req.params.itemId as string, req.user!.id, input
    );
    res.json({ success: true, data: { item } });
  } catch (err) { next(err); }
};

export const toggle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await toggleChecklistItem(
      req.params.tripId as string, req.params.itemId as string, req.user!.id
    );
    res.json({ success: true, data: { item } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteChecklistItem(
      req.params.tripId as string, req.params.itemId as string, req.user!.id
    );
    res.json({ success: true, message: 'Item removed' });
  } catch (err) { next(err); }
};
