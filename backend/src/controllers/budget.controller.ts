import { Response, NextFunction } from 'express';
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
    const input  = updateBudgetSchema.parse(req.body);
    const budget = await updateTripBudget(req.params.tripId as string, req.user!.id, input);
    res.json({ success: true, data: { budget } });
  } catch (err) { next(err); }
};
