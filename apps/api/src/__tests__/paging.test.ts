import { describe, expect, it } from 'vitest';
import { pageData } from '../util/paging';

const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));

describe('pageData', () => {
  it('returns the first page slice with correct metadata', () => {
    const result = pageData({ items, limit: 10, offset: 0 });
    expect(result.data).toHaveLength(10);
    expect(result.data[0]).toEqual({ id: 0 });
    expect(result.pagination.totalRecords).toBe(25);
    expect(result.pagination.currentPage).toBe(0);
    expect(result.pagination.nextFrom).toBe(10);
  });

  it('returns the last partial page with no nextFrom', () => {
    const result = pageData({ items, limit: 10, offset: 20 });
    expect(result.data).toHaveLength(5);
    expect(result.pagination.nextFrom).toBeUndefined();
    expect(result.pagination.currentPage).toBe(2);
  });

  it('parses string limit and offset', () => {
    const result = pageData({ items, limit: '5', offset: '5' });
    expect(result.data).toHaveLength(5);
    expect(result.data[0]).toEqual({ id: 5 });
    expect(result.pagination.limit).toBe(5);
  });

  it('falls back to limit=10 for unparseable values', () => {
    const result = pageData({ items, limit: 'bad', offset: 'bad' });
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.currentPage).toBe(0);
  });
});
