import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createNoteSchema, updateNoteSchema } from '../validators/notes.validator';
import { getNotes, createNote, updateNote, deleteNote } from '../services/notes.service';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stopId = req.query.stop_id as string | undefined;
    const notes  = await getNotes(req.params.tripId as string, req.user!.id, stopId);
    res.json({ success: true, data: { notes } });
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createNoteSchema.parse({ ...req.body, trip_id: req.params.tripId });
    const note  = await createNote(req.params.tripId as string, req.user!.id, input);
    res.status(201).json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateNoteSchema.parse({ ...req.body, trip_id: req.params.tripId });
    const note  = await updateNote(
      req.params.tripId as string, req.params.noteId as string, req.user!.id, input
    );
    res.json({ success: true, data: { note } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteNote(
      req.params.tripId as string, req.params.noteId as string, req.user!.id
    );
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) { next(err); }
};
