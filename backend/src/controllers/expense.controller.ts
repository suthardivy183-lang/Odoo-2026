import { Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuthRequest } from '../middleware/auth';
import { createExpenseSchema } from '../validators/expense.validator';
import { createExpense, deleteExpense, getExpenseSummary } from '../services/expense.service';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getExpenseSummary(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId as string;
    const input = createExpenseSchema.parse(req.body);
    const expense = await createExpense(tripId, req.user!.id, input);
    const summary = await getExpenseSummary(tripId, req.user!.id);

    const io = req.app.get('io') as SocketIOServer | undefined;
    io?.to(`trip:${tripId}`).emit('expenses:updated', { tripId, summary });

    res.status(201).json({ success: true, data: { expense, ...summary } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId as string;
    await deleteExpense(tripId, req.params.expenseId as string, req.user!.id);
    const summary = await getExpenseSummary(tripId, req.user!.id);

    const io = req.app.get('io') as SocketIOServer | undefined;
    io?.to(`trip:${tripId}`).emit('expenses:updated', { tripId, summary });

    res.json({ success: true, message: 'Expense deleted', data: summary });
  } catch (err) { next(err); }
};
