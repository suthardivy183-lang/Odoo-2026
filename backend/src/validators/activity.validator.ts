import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const activityQuerySchema = z.object({
  city_id:  z.coerce.number().int().positive().optional(),
  type:     z.enum(['sightseeing','food','adventure','culture','shopping','nightlife','nature','wellness']).optional(),
  min_cost: z.coerce.number().min(0).optional(),
  max_cost: z.coerce.number().min(0).optional(),
});

export const addStopActivitySchema = z.object({
  activity_id:     z.number().int().positive(),
  scheduled_date:  z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  scheduled_time:  z.string().regex(timeRegex, 'Time must be HH:MM').optional(),
  custom_cost:     z.number().min(0, 'Cost cannot be negative').optional(),
});

export const updateStopActivitySchema = z.object({
  scheduled_date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  scheduled_time: z.string().regex(timeRegex, 'Time must be HH:MM').optional(),
  custom_cost:    z.number().min(0, 'Cost cannot be negative').optional(),
});

export type ActivityQueryInput      = z.infer<typeof activityQuerySchema>;
export type AddStopActivityInput    = z.infer<typeof addStopActivitySchema>;
export type UpdateStopActivityInput = z.infer<typeof updateStopActivitySchema>;
