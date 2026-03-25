import { describe, it, expect } from 'vitest';

describe('Basic Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello').toBe('hello');
  });

  it('should handle arrays', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });
});
