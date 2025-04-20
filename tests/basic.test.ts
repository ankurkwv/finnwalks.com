import { describe, test, expect } from 'vitest';

describe('Basic Test Suite', () => {
  test('basic test passes', () => {
    expect(true).toBe(true);
  });
  
  test('math works', () => {
    expect(1 + 1).toBe(2);
  });
});