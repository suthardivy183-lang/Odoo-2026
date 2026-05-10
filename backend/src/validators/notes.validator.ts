import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().trim().min(1),
  title:   z.string().trim().min(1).max(200).optional(),
  stop_id: z.string().uuid().optional(),
});

export const updateNoteSchema = z.object({
  content: z.string().trim().min(1).optional(),
  title:   z.string().trim().min(1).max(200).optional(),
  stop_id: z.string().uuid().nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
