import { Response, NextFunction } from 'express';
import { AuthRequest as Request } from '../middleware/auth';
import { createReservationSchema, updateReservationSchema } from '../validators/reservation.validator';
import * as svc from '../services/reservation.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.listReservations(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createReservationSchema.parse(req.body);
    const data  = await svc.createReservation(req.params.tripId as string, req.user!.id, input);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateReservationSchema.parse(req.body);
    const data  = await svc.updateReservation(
      req.params.tripId as string,
      req.params.reservationId as string,
      req.user!.id,
      input
    );
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deleteReservation(
      req.params.tripId as string,
      req.params.reservationId as string,
      req.user!.id
    );
    res.json({ success: true });
  } catch (e) { next(e); }
};
