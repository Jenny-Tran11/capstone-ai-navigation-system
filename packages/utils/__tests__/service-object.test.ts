import { describe, expect, it } from 'vitest';
import { generateId } from '../service-object';

describe('generateId', () => {
  it('prefixes Admin ids with adm_', () => {
    expect(generateId('Admin')).toMatch(/^adm_/);
  });

  it('prefixes Permission ids with prm_', () => {
    expect(generateId('Permission')).toMatch(/^prm_/);
  });

  it('prefixes Workspace ids with ws_', () => {
    expect(generateId('Workspace')).toMatch(/^ws_/);
  });

  it('appends a 16-character alphanumeric suffix', () => {
    const id = generateId('Admin');
    const suffix = id.replace(/^adm_/, '');
    expect(suffix).toMatch(/^[0-9A-Za-z]{16}$/);
  });

  it('generates unique ids on every call', () => {
    const ids = Array.from({ length: 20 }, () => generateId('Admin'));
    expect(new Set(ids).size).toBe(20);
  });
});
