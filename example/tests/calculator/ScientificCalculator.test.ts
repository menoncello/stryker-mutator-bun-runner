import { describe, it, expect, beforeEach } from "bun:test";
import { ScientificCalculator } from "../../src/calculator/ScientificCalculator";

describe("ScientificCalculator", () => {
  let calculator: ScientificCalculator;

  beforeEach(() => {
    calculator = new ScientificCalculator();
  });

  describe("angle mode", () => {
    it("should set and get angle mode", () => {
      expect(calculator.getAngleMode()).toBe('rad');
      calculator.setAngleMode('deg');
      expect(calculator.getAngleMode()).toBe('deg');
      calculator.setAngleMode('rad');
      expect(calculator.getAngleMode()).toBe('rad');
    });

    it("should throw error for invalid angle mode", () => {
      expect(() => calculator.setAngleMode('invalid' as any)).toThrow("Invalid angle mode");
    });
  });

  describe("trigonometric functions in radians", () => {
    beforeEach(() => {
      calculator.setAngleMode('rad');
    });

    it("should calculate sin", () => {
      expect(calculator.sin(0)).toBe(0);
      expect(calculator.sin(Math.PI / 2)).toBe(1);
      expect(calculator.sin(Math.PI)).toBeCloseTo(0, 10);
    });

    it("should calculate cos", () => {
      expect(calculator.cos(0)).toBe(1);
      expect(calculator.cos(Math.PI / 2)).toBeCloseTo(0, 10);
      expect(calculator.cos(Math.PI)).toBe(-1);
    });

    it("should calculate tan", () => {
      expect(calculator.tan(0)).toBe(0);
      expect(calculator.tan(Math.PI / 4)).toBeCloseTo(1, 10);
    });
  });

  describe("trigonometric functions in degrees", () => {
    beforeEach(() => {
      calculator.setAngleMode('deg');
    });

    it("should calculate sin in degrees", () => {
      expect(calculator.sin(0)).toBe(0);
      expect(calculator.sin(90)).toBe(1);
      expect(calculator.sin(180)).toBeCloseTo(0, 10);
    });

    it("should calculate cos in degrees", () => {
      expect(calculator.cos(0)).toBe(1);
      expect(calculator.cos(90)).toBeCloseTo(0, 10);
      expect(calculator.cos(180)).toBe(-1);
    });

    it("should calculate tan in degrees", () => {
      expect(calculator.tan(0)).toBe(0);
      expect(calculator.tan(45)).toBeCloseTo(1, 10);
    });
  });

  describe("inverse trigonometric functions", () => {
    it("should calculate asin", () => {
      calculator.setAngleMode('rad');
      expect(calculator.asin(0)).toBe(0);
      expect(calculator.asin(1)).toBeCloseTo(Math.PI / 2, 1);
      
      calculator.setAngleMode('deg');
      expect(calculator.asin(0)).toBe(0);
      expect(calculator.asin(1)).toBeCloseTo(90, 1);
    });

    it("should validate asin input", () => {
      expect(() => calculator.asin(1.5)).toThrow("Value must be between -1 and 1");
      expect(() => calculator.asin(-1.5)).toThrow("Value must be between -1 and 1");
    });

    it("should calculate acos", () => {
      calculator.setAngleMode('rad');
      expect(calculator.acos(1)).toBe(0);
      expect(calculator.acos(0)).toBeCloseTo(Math.PI / 2, 1);
      
      calculator.setAngleMode('deg');
      expect(calculator.acos(1)).toBe(0);
      expect(calculator.acos(0)).toBeCloseTo(90, 1);
    });

    it("should validate acos input", () => {
      expect(() => calculator.acos(1.5)).toThrow("Value must be between -1 and 1");
      expect(() => calculator.acos(-1.5)).toThrow("Value must be between -1 and 1");
    });

    it("should calculate atan", () => {
      calculator.setAngleMode('rad');
      expect(calculator.atan(0)).toBe(0);
      expect(calculator.atan(1)).toBeCloseTo(Math.PI / 4, 1);
      
      calculator.setAngleMode('deg');
      expect(calculator.atan(0)).toBe(0);
      expect(calculator.atan(1)).toBeCloseTo(45, 1);
    });

    it("should calculate atan2", () => {
      calculator.setAngleMode('rad');
      expect(calculator.atan2(0, 1)).toBe(0);
      expect(calculator.atan2(1, 0)).toBeCloseTo(Math.PI / 2, 1);
      
      calculator.setAngleMode('deg');
      expect(calculator.atan2(0, 1)).toBe(0);
      expect(calculator.atan2(1, 0)).toBeCloseTo(90, 1);
    });
  });

  describe("hyperbolic functions", () => {
    it("should calculate sinh", () => {
      expect(calculator.sinh(0)).toBe(0);
      expect(calculator.sinh(1)).toBeCloseTo(1.175, 2);
    });

    it("should calculate cosh", () => {
      expect(calculator.cosh(0)).toBe(1);
      expect(calculator.cosh(1)).toBeCloseTo(1.543, 2);
    });

    it("should calculate tanh", () => {
      expect(calculator.tanh(0)).toBe(0);
      expect(calculator.tanh(1)).toBeCloseTo(0.76, 1);
    });
  });

  describe("logarithmic functions", () => {
    it("should calculate log with base 10", () => {
      expect(calculator.log(10)).toBe(1);
      expect(calculator.log(100)).toBe(2);
      expect(calculator.log(1)).toBe(0);
    });

    it("should calculate log with custom base", () => {
      expect(calculator.log(8, 2)).toBe(3);
      expect(calculator.log(27, 3)).toBe(3);
    });

    it("should validate log inputs", () => {
      expect(() => calculator.log(0)).toThrow("Logarithm of non-positive number");
      expect(() => calculator.log(-1)).toThrow("Logarithm of non-positive number");
      expect(() => calculator.log(10, 0)).toThrow("Invalid logarithm base");
      expect(() => calculator.log(10, 1)).toThrow("Invalid logarithm base");
      expect(() => calculator.log(10, -2)).toThrow("Invalid logarithm base");
    });

    it("should calculate natural logarithm", () => {
      expect(calculator.ln(1)).toBe(0);
      expect(calculator.ln(Math.E)).toBeCloseTo(1, 1);
    });

    it("should validate ln input", () => {
      expect(() => calculator.ln(0)).toThrow("Natural logarithm of non-positive number");
      expect(() => calculator.ln(-1)).toThrow("Natural logarithm of non-positive number");
    });

    it("should calculate exponential", () => {
      expect(calculator.exp(0)).toBe(1);
      expect(calculator.exp(1)).toBeCloseTo(Math.E, 1);
      expect(calculator.exp(2)).toBeCloseTo(Math.E * Math.E, 1);
    });
  });

  describe("root functions", () => {
    it("should calculate square root", () => {
      expect(calculator.sqrt(0)).toBe(0);
      expect(calculator.sqrt(4)).toBe(2);
      expect(calculator.sqrt(9)).toBe(3);
      expect(calculator.sqrt(2)).toBeCloseTo(1.414, 2);
    });

    it("should validate sqrt input", () => {
      expect(() => calculator.sqrt(-1)).toThrow("Square root of negative number");
    });

    it("should calculate cube root", () => {
      expect(calculator.cbrt(0)).toBe(0);
      expect(calculator.cbrt(8)).toBe(2);
      expect(calculator.cbrt(-8)).toBe(-2);
      expect(calculator.cbrt(27)).toBe(3);
    });

    it("should calculate nth root", () => {
      expect(calculator.nthRoot(16, 4)).toBe(2);
      expect(calculator.nthRoot(32, 5)).toBe(2);
      expect(calculator.nthRoot(27, 3)).toBe(3);
    });

    it("should validate nth root inputs", () => {
      expect(() => calculator.nthRoot(16, 0)).toThrow("Root index cannot be zero");
      expect(() => calculator.nthRoot(-16, 4)).toThrow("Even root of negative number");
    });
  });

  describe("rounding functions", () => {
    it("should calculate ceil", () => {
      expect(calculator.ceil(4.3)).toBe(5);
      expect(calculator.ceil(4.7)).toBe(5);
      expect(calculator.ceil(-4.3)).toBe(-4);
      expect(calculator.ceil(5)).toBe(5);
    });

    it("should calculate floor", () => {
      expect(calculator.floor(4.3)).toBe(4);
      expect(calculator.floor(4.7)).toBe(4);
      expect(calculator.floor(-4.3)).toBe(-5);
      expect(calculator.floor(5)).toBe(5);
    });

    it("should calculate round", () => {
      expect(calculator.round(4.3)).toBe(4);
      expect(calculator.round(4.5)).toBe(5);
      expect(calculator.round(4.7)).toBe(5);
      expect(calculator.round(-4.5)).toBe(-4);
    });

    it("should calculate sign", () => {
      expect(calculator.sign(5)).toBe(1);
      expect(calculator.sign(-5)).toBe(-1);
      expect(calculator.sign(0)).toBe(0);
    });
  });

  describe("percentage functions", () => {
    it("should calculate percentage", () => {
      expect(calculator.percentage(100, 20)).toBe(20);
      expect(calculator.percentage(50, 10)).toBe(5);
      expect(calculator.percentage(200, 50)).toBe(100);
    });

    it("should calculate percentage change", () => {
      expect(calculator.percentageChange(100, 120)).toBe(20);
      expect(calculator.percentageChange(100, 80)).toBe(-20);
      expect(calculator.percentageChange(50, 75)).toBe(50);
    });

    it("should validate percentage change input", () => {
      expect(() => calculator.percentageChange(0, 100)).toThrow("Cannot calculate percentage change from zero");
    });
  });

  describe("inheritance from Calculator", () => {
    it("should have access to basic arithmetic", () => {
      expect(calculator.add(2, 3)).toBe(5);
      expect(calculator.subtract(5, 3)).toBe(2);
      expect(calculator.multiply(3, 4)).toBe(12);
      expect(calculator.divide(10, 2)).toBe(5);
    });

    it("should maintain history through inheritance", () => {
      // Use inherited methods that properly track history
      calculator.add(5, 3);
      calculator.multiply(2, 4);
      const history = calculator.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history).toContain(8); // 5 + 3 = 8
      expect(history).toContain(8); // 2 * 4 = 8
    });
  });
});