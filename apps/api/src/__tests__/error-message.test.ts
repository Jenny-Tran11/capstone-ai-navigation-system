import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../util/error-message';

describe('getErrorMessage', () => {
  it('returns the message property from an Error instance', () => {
    expect(getErrorMessage(new Error('something went wrong'))).toBe(
      'something went wrong',
    );
  });

  it('stringifies non-Error values', () => {
    expect(getErrorMessage('plain string')).toBe('plain string');
    expect(getErrorMessage(404)).toBe('404');
    expect(getErrorMessage(null)).toBe('null');
  });

  it('returns the message from a subclassed Error', () => {
    class CustomError extends Error {}
    expect(getErrorMessage(new CustomError('custom'))).toBe('custom');
  });
});
