import { BaseObject } from './base-object';

export interface Workspace extends BaseObject {
  workspaceId: string;
  name: string;
  description?: string;
  imageUrl?: string;
}
