import { test, expect } from 'bun:test';

test('slow test', async () => {
  await new Promise(resolve => setTimeout(resolve, 200)); // 200ms to exceed 100ms timeout
  expect(true).toBe(true);
});