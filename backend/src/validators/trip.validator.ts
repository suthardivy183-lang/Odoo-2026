import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createTripSchema = z
  .object({
    name: z.string().trim().min(2, 'Trip name must be at least 2 characters').max(150),
    description: z.string().trim().max(1000).optional(),
    start_date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    end_date:   z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    cover_photo: z.string().url('Invalid URL').optional(),
    total_budget: z.number().positive('Budget must be positive').optional(),
    status: z.enum(['draft', 'active', 'completed']).default('draft'),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: 'end_date must be on or after start_date',
    path: ['end_date'],
  });

export const updateTripSchema = z
  .object({
    name:         z.string().trim().min(2).max(150).optional(),
    description:  z.string().trim().max(1000).optional(),
    start_date:   z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
    end_date:     z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
    cover_photo:  z.string().url('Invalid URL').optional(),
    total_budget: z.number().positive().optional(),
    status:       z.enum(['draft', 'active', 'completed']).optional(),
    is_public:    z.boolean().optional(),
  })
  .refine(
    (d) => !(d.start_date && d.end_date) || d.end_date! >= d.start_date!,
    { message: 'end_date must be on or after start_date', path: ['end_date'] }
  );

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
