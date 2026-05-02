export const ObjectIdPrefixes = {
  Admin: 'adm',
} as const;

export type ObjectIdPrefix = keyof typeof ObjectIdPrefixes;
