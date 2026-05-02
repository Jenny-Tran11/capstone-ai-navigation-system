import { customAlphabet } from 'nanoid';
import { ObjectIdPrefixes, type ObjectIdPrefix } from '@baseline/types/service-object';

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const nanoid = customAlphabet(alphabet, 16);

export const generateId = (objectName: ObjectIdPrefix): string => {
  const prefix = ObjectIdPrefixes[objectName] as string;
  return `${prefix || 'id'}_${nanoid()}`;
};
