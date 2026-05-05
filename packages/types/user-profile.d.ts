import type { BaseObject } from './base-object';

export interface UserProfile extends BaseObject {
  userId: string;
  displayName?: string;
  avatarKey?: string;
  preferences?: Record<string, unknown>;
}
