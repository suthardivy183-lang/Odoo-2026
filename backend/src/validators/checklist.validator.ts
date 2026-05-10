import { z } from 'zod';

const CATEGORIES = ['clothing', 'documents', 'electronics', 'toiletries', 'other'] as const;

export const createChecklistSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    category: z.enum(CATEGORIES),
    is_packed: z.boolean().default(false),
  })
  .transform(({ name, ...data }) => ({
    item_name: name,
    ...data,
  }));

export const updateChecklistSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    category: z.enum(CATEGORIES).optional(),
    is_packed: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .transform(({ name, ...data }) => ({
    ...(name !== undefined ? { item_name: name } : {}),
    ...data,
  }));

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
