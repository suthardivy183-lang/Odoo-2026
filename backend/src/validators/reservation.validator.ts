import { z } from 'zod';

const TYPES = ['flight', 'hotel', 'train', 'car_rental', 'other'] as const;

export const createReservationSchema = z.object({
  type:          z.enum(TYPES),
  title:         z.string().min(1).max(200),
  provider:      z.string().max(200).optional(),
  booking_ref:   z.string().max(100).optional(),
  from_location: z.string().max(200).optional(),
  to_location:   z.string().max(200).optional(),
  start_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time:    z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_time:      z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cost:          z.number().min(0).optional(),
  notes:         z.string().max(2000).optional(),
});

export const updateReservationSchema = createReservationSchema.partial();

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
