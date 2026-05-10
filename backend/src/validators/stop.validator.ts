import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const addStopSchema = z
  .object({
    city_id:        z.number().int().positive(),
    arrival_date:   z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    departure_date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    notes:          z.string().trim().max(500).optional(),
    stop_order:     z.number().int().min(0).optional(),
  })
  .refine((d) => d.departure_date >= d.arrival_date, {
    message: 'departure_date must be on or after arrival_date',
    path: ['departure_date'],
  });

export const updateStopSchema = z
  .object({
    arrival_date:   z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
    departure_date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
    notes:          z.string().trim().max(500).optional(),
  })
  .refine(
    (d) => !(d.arrival_date && d.departure_date) || d.departure_date >= d.arrival_date,
    { message: 'departure_date must be on or after arrival_date', path: ['departure_date'] }
  );

export const reorderSchema = z.object({
  stops: z
    .array(z.object({ id: z.string().uuid(), stop_order: z.number().int().min(0) }))
    .min(1, 'Provide at least one stop to reorder'),
});

export type AddStopInput    = z.infer<typeof addStopSchema>;
export type UpdateStopInput = z.infer<typeof updateStopSchema>;
export type ReorderInput    = z.infer<typeof reorderSchema>;
