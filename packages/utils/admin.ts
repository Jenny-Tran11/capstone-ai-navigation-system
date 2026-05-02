import { z } from 'zod';

export const createAdminSchema = z.object({
  userEmail: z.string().email(),
});

export const deleteAdminSchema = z.object({
  adminId: z.string(),
});
