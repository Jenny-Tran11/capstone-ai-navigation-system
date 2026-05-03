import { BaseObject } from './base-object';

export type PermissionType = 'SUPER' | 'WORKSPACE';

export interface Permission extends BaseObject {
  permissionId: string;
  type: PermissionType;
  value?: string;
  compositeKey: string;
  ownerId: string;
}
