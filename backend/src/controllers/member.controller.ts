import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { inviteMemberSchema } from '../validators/member.validator';
import { getTripMembers, inviteTripMember, removeTripMember } from '../services/member.service';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const members = await getTripMembers(req.params.tripId as string, req.user!.id);
    res.json({ success: true, data: { members } });
  } catch (err) { next(err); }
};

export const invite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = inviteMemberSchema.parse(req.body);
    const member = await inviteTripMember(req.params.tripId as string, req.user!.id, input.email);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:members:updated', { tripId: req.params.tripId });
    res.status(201).json({ success: true, data: { member } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await removeTripMember(req.params.tripId as string, req.user!.id, req.params.userId as string);
    const io = req.app.get('io');
    io?.to(`trip:${req.params.tripId}`).emit('trip:members:updated', { tripId: req.params.tripId });
    res.json({ success: true, message: 'Trip member removed' });
  } catch (err) { next(err); }
};
