import { test, expect } from 'bun:test';
import { add, subtract, multiply, divide, isPositive, isEven } from './math.js';

test('add should add two numbers', () => {
  expect(add(1, 2)).toBe(3);
  expect(add(-1, 1)).toBe(0);
});

test('subtract should subtract two numbers', () => {
  expect(subtract(5, 3)).toBe(2);
  expect(subtract(0, 1)).toBe(-1);
});

test('multiply should multiply two numbers', () => {
  expect(multiply(3, 4)).toBe(12);
  expect(multiply(-2, 3)).toBe(-6);
});

test('divide should divide two numbers', () => {
  expect(divide(10, 2)).toBe(5);
  expect(divide(7, 2)).toBe(3.5);
});

test('divide should throw on division by zero', () => {
  expect(() => divide(5, 0)).toThrow('Division by zero');
});

test('isPositive should check if number is positive', () => {
  expect(isPositive(5)).toBe(true);
  expect(isPositive(0)).toBe(false);
  expect(isPositive(-3)).toBe(false);
});

test('isEven should check if number is even', () => {
  expect(isEven(4)).toBe(true);
  expect(isEven(3)).toBe(false);
  expect(isEven(0)).toBe(true);
});