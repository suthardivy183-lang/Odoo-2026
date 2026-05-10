import { z } from 'zod';

const CATEGORIES = ['clothing', 'documents', 'electronics', 'toiletries', 'medicines', 'other'] as const;

export const addItemSchema = z.object({
  item_name: z.string().trim().min(1).max(150),
  category:  z.enum(CATEGORIES).default('other'),
});

export const updateItemSchema = z.object({
  item_name: z.string().trim().min(1).max(150).optional(),
  category:  z.enum(CATEGORIES).optional(),
  is_packed: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type AddItemInput    = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
