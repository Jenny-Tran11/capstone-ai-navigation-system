import { z } from 'zod';

export const permissionTypeSchema = z.enum(['SUPER', 'WORKSPACE']);

export const createPermissionSchema = z.object({
  type: permissionTypeSchema,
  value: z.string().optional(),
  ownerId: z.string().min(1),
});

export const deletePermissionSchema = z.object({
  permissionId: z.string().min(1),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type DeletePermissionInput = z.infer<typeof deletePermissionSchema>;
