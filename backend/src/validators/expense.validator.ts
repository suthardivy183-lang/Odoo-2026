import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, 'Expense name is required').max(160),
  category: z.enum(['transport', 'accommodation', 'meals', 'activities', 'miscellaneous']).default('miscellaneous'),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().trim().length(3).toUpperCase().default('USD'),
  exchange_rate_to_budget: z.number().positive('Exchange rate must be greater than zero').optional(),
  paid_by: z.string().uuid().optional(),
  split_user_ids: z.array(z.string().uuid()).min(1, 'Choose at least one person to split with').optional(),
  expense_date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
