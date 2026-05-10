import { z } from 'zod';

export const updateBudgetSchema = z.object({
  transport_cost:     z.number().min(0).optional(),
  accommodation_cost: z.number().min(0).optional(),
  meals_cost:         z.number().min(0).optional(),
  miscellaneous_cost: z.number().min(0).optional(),
  currency:           z.string().length(3).toUpperCase().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
