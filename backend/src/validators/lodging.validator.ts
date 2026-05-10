import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createLodgingSchema = z
  .object({
    stop_id: z.string().uuid(),
    lodging_option_id: z.number().int().positive().optional(),
    custom_name: z.string().trim().min(1).max(160).optional(),
    check_in: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    check_out: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    nightly_rate: z.number().min(0).optional(),
    currency: z.string().length(3).toUpperCase().optional(),
    guests: z.number().int().positive().optional(),
    status: z.enum(['saved', 'booked']).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(data => data.lodging_option_id || data.custom_name, {
    message: 'Choose a lodging option or enter a custom lodging name',
    path: ['lodging_option_id'],
  })
  .refine(data => data.check_out >= data.check_in, {
    message: 'check_out must be on or after check_in',
    path: ['check_out'],
  });

export const updateLodgingSchema = z.object({
  status: z.enum(['saved', 'booked']).optional(),
  notes: z.string().trim().max(500).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type CreateLodgingInput = z.infer<typeof createLodgingSchema>;
export type UpdateLodgingInput = z.infer<typeof updateLodgingSchema>;
