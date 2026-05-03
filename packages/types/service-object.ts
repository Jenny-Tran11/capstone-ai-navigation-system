export const ObjectIdPrefixes = {
  Admin: 'adm',
  Permission: 'prm',
  Workspace: 'ws',
} as const;

export type ObjectIdPrefix = keyof typeof ObjectIdPrefixes;
