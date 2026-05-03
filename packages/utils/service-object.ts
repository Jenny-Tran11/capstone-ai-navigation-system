import {
  type ObjectIdPrefix,
  ObjectIdPrefixes,
} from '@baseline/types/service-object';
import { customAlphabet } from 'nanoid';

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const nanoid = customAlphabet(alphabet, 16);

export const generateId = (objectName: ObjectIdPrefix): string => {
  const prefix = ObjectIdPrefixes[objectName] as string;
  return `${prefix || 'id'}_${nanoid()}`;
};
