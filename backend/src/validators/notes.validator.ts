import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().trim().min(1),
  trip_id: z.string().uuid(),
  stop_id: z.string().uuid().optional(),
});

export const updateNoteSchema = z
  .object({
    content: z.string().trim().min(1).optional(),
    trip_id: z.string().uuid(),
    stop_id: z.string().uuid().optional(),
  })
  .refine(data => data.content !== undefined || data.stop_id !== undefined, {
    message: 'At least one field must be provided',
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
