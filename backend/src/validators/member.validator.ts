import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
