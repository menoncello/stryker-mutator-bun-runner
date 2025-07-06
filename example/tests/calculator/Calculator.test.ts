import { describe, it, expect, beforeEach } from "bun:test";
import { Calculator } from "../../src/calculator/Calculator";

describe("Calculator", () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe("basic arithmetic", () => {
    it("should add two numbers", () => {
      expect(calculator.add(2, 3)).toBe(5);
      expect(calculator.add(-1, 1)).toBe(0);
      expect(calculator.add(0.1, 0.2)).toBe(0.3);
    });

    it("should subtract two numbers", () => {
      expect(calculator.subtract(5, 3)).toBe(2);
      expect(calculator.subtract(-1, -1)).toBe(0);
      expect(calculator.subtract(0.3, 0.1)).toBe(0.2);
    });

    it("should multiply two numbers", () => {
      expect(calculator.multiply(3, 4)).toBe(12);
      expect(calculator.multiply(-2, 3)).toBe(-6);
      expect(calculator.multiply(0.1, 0.2)).toBe(0.02);
    });

    it("should divide two numbers", () => {
      expect(calculator.divide(10, 2)).toBe(5);
      expect(calculator.divide(-10, 2)).toBe(-5);
      expect(calculator.divide(1, 3)).toBe(0.33);
    });

    it("should throw error on division by zero", () => {
      expect(() => calculator.divide(10, 0)).toThrow("Division by zero");
    });
  });

  describe("power operations", () => {
    it("should calculate power with positive exponent", () => {
      expect(calculator.power(2, 3)).toBe(8);
      expect(calculator.power(5, 2)).toBe(25);
      expect(calculator.power(10, 0)).toBe(1);
    });

    it("should calculate power with negative exponent", () => {
      expect(calculator.power(2, -2)).toBe(0.25);
      expect(calculator.power(5, -1)).toBe(0.2);
    });
  });

  describe("factorial", () => {
    it("should calculate factorial", () => {
      expect(calculator.factorial(0)).toBe(1);
      expect(calculator.factorial(1)).toBe(1);
      expect(calculator.factorial(5)).toBe(120);
      expect(calculator.factorial(10)).toBe(3628800);
    });

    it("should throw error for negative numbers", () => {
      expect(() => calculator.factorial(-1)).toThrow("Factorial of negative number");
    });
  });

  describe("modulo", () => {
    it("should calculate modulo", () => {
      expect(calculator.modulo(10, 3)).toBe(1);
      expect(calculator.modulo(20, 6)).toBe(2);
      expect(calculator.modulo(-10, 3)).toBe(-1);
    });

    it("should throw error on modulo by zero", () => {
      expect(() => calculator.modulo(10, 0)).toThrow("Modulo by zero");
    });
  });

  describe("absolute value", () => {
    it("should return absolute value", () => {
      expect(calculator.absolute(5)).toBe(5);
      expect(calculator.absolute(-5)).toBe(5);
      expect(calculator.absolute(0)).toBe(0);
    });
  });

  describe("min and max", () => {
    it("should find minimum", () => {
      expect(calculator.min(5, 3)).toBe(3);
      expect(calculator.min(-5, -3)).toBe(-5);
      expect(calculator.min(0, 0)).toBe(0);
    });

    it("should find maximum", () => {
      expect(calculator.max(5, 3)).toBe(5);
      expect(calculator.max(-5, -3)).toBe(-3);
      expect(calculator.max(0, 0)).toBe(0);
    });
  });

  describe("statistical functions", () => {
    it("should calculate average", () => {
      expect(calculator.average([1, 2, 3, 4, 5])).toBe(3);
      expect(calculator.average([10, 20])).toBe(15);
      expect(calculator.average([1.5, 2.5, 3.5])).toBe(2.5);
    });

    it("should throw error for empty array in average", () => {
      expect(() => calculator.average([])).toThrow("Cannot calculate average of empty array");
    });

    it("should calculate median", () => {
      expect(calculator.median([1, 2, 3, 4, 5])).toBe(3);
      expect(calculator.median([1, 2, 3, 4])).toBe(2.5);
      expect(calculator.median([5, 1, 3, 2, 4])).toBe(3);
    });

    it("should throw error for empty array in median", () => {
      expect(() => calculator.median([])).toThrow("Cannot calculate median of empty array");
    });

    it("should calculate standard deviation", () => {
      expect(calculator.standardDeviation([2, 4, 6, 8])).toBe(2.24);
      expect(calculator.standardDeviation([1, 1, 1, 1])).toBe(0);
    });

    it("should throw error for empty array in standard deviation", () => {
      expect(() => calculator.standardDeviation([])).toThrow("Cannot calculate standard deviation of empty array");
    });
  });

  describe("number theory functions", () => {
    it("should check if number is prime", () => {
      expect(calculator.isPrime(2)).toBe(true);
      expect(calculator.isPrime(3)).toBe(true);
      expect(calculator.isPrime(4)).toBe(false);
      expect(calculator.isPrime(17)).toBe(true);
      expect(calculator.isPrime(100)).toBe(false);
      expect(calculator.isPrime(1)).toBe(false);
      expect(calculator.isPrime(0)).toBe(false);
      expect(calculator.isPrime(-5)).toBe(false);
    });

    it("should calculate fibonacci numbers", () => {
      expect(calculator.fibonacci(0)).toBe(0);
      expect(calculator.fibonacci(1)).toBe(1);
      expect(calculator.fibonacci(5)).toBe(5);
      expect(calculator.fibonacci(10)).toBe(55);
    });

    it("should throw error for negative fibonacci", () => {
      expect(() => calculator.fibonacci(-1)).toThrow("Fibonacci of negative number");
    });

    it("should calculate GCD", () => {
      expect(calculator.gcd(12, 8)).toBe(4);
      expect(calculator.gcd(18, 24)).toBe(6);
      expect(calculator.gcd(17, 19)).toBe(1);
      expect(calculator.gcd(-12, 8)).toBe(4);
    });

    it("should calculate LCM", () => {
      expect(calculator.lcm(12, 8)).toBe(24);
      expect(calculator.lcm(6, 9)).toBe(18);
      expect(calculator.lcm(0, 5)).toBe(0);
    });
  });

  describe("history management", () => {
    it("should track calculation history", () => {
      calculator.add(5, 3);
      calculator.multiply(2, 4);
      const history = calculator.getHistory();
      expect(history).toContain(8);
      expect(history).toContain(8);
      expect(calculator.getHistorySize()).toBe(2);
    });

    it("should get last result", () => {
      calculator.add(5, 3);
      expect(calculator.getLastResult()).toBe(8);
      calculator.multiply(2, 4);
      expect(calculator.getLastResult()).toBe(8);
    });

    it("should return null for empty history", () => {
      expect(calculator.getLastResult()).toBe(null);
    });

    it("should clear history", () => {
      calculator.add(5, 3);
      calculator.clearHistory();
      expect(calculator.getHistorySize()).toBe(0);
      expect(calculator.getLastResult()).toBe(null);
    });

    it("should limit history to 100 entries", () => {
      for (let i = 0; i < 105; i++) {
        calculator.add(i, 1);
      }
      expect(calculator.getHistorySize()).toBe(100);
    });
  });

  describe("precision management", () => {
    it("should set and get precision", () => {
      calculator.setPrecision(4);
      expect(calculator.getPrecision()).toBe(4);
    });

    it("should validate precision range", () => {
      expect(() => calculator.setPrecision(-1)).toThrow("Precision must be between 0 and 10");
      expect(() => calculator.setPrecision(11)).toThrow("Precision must be between 0 and 10");
    });

    it("should round results according to precision", () => {
      calculator.setPrecision(2);
      expect(calculator.divide(1, 3)).toBe(0.33);
      calculator.setPrecision(4);
      expect(calculator.divide(1, 3)).toBe(0.3333);
    });

    it("should validate precision in constructor", () => {
      expect(() => new Calculator(-1)).toThrow("Precision must be between 0 and 10");
      expect(() => new Calculator(11)).toThrow("Precision must be between 0 and 10");
    });
  });
});