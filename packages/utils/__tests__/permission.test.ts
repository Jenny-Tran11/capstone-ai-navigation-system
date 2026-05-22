import { describe, expect, it } from 'vitest';
import {
  createPermissionSchema,
  deletePermissionSchema,
  permissionTypeSchema,
} from '../permission';

describe('permissionTypeSchema', () => {
  it('accepts SUPER and WORKSPACE', () => {
    expect(permissionTypeSchema.parse('SUPER')).toBe('SUPER');
    expect(permissionTypeSchema.parse('WORKSPACE')).toBe('WORKSPACE');
  });

  it('rejects unknown permission types', () => {
    expect(() => permissionTypeSchema.parse('ADMIN')).toThrow();
  });
});

describe('createPermissionSchema', () => {
  it('accepts valid input with a SUPER permission and no value', () => {
    const result = createPermissionSchema.parse({
      type: 'SUPER',
      ownerId: 'user-123',
    });
    expect(result).toEqual({ type: 'SUPER', ownerId: 'user-123' });
  });

  it('accepts a WORKSPACE permission with an optional value', () => {
    const result = createPermissionSchema.parse({
      type: 'WORKSPACE',
      value: 'ws_abc',
      ownerId: 'user-456',
    });
    expect(result.value).toBe('ws_abc');
  });

  it('rejects an empty ownerId', () => {
    expect(() =>
      createPermissionSchema.parse({ type: 'SUPER', ownerId: '' }),
    ).toThrow();
  });
});

describe('deletePermissionSchema', () => {
  it('rejects an empty permissionId', () => {
    expect(() =>
      deletePermissionSchema.parse({ permissionId: '' }),
    ).toThrow();
  });
});
