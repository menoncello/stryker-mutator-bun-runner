import { Calculator } from './Calculator';

export class ScientificCalculator extends Calculator {
  private angleMode: 'rad' | 'deg' = 'rad';

  setAngleMode(mode: 'rad' | 'deg'): void {
    if (mode !== 'rad' && mode !== 'deg') {
      throw new Error('Invalid angle mode');
    }
    this.angleMode = mode;
  }

  getAngleMode(): 'rad' | 'deg' {
    return this.angleMode;
  }

  sin(angle: number): number {
    const radians = this.toRadians(angle);
    const result = Math.sin(radians);
    return this.roundAndStore(result);
  }

  cos(angle: number): number {
    const radians = this.toRadians(angle);
    const result = Math.cos(radians);
    return this.roundAndStore(result);
  }

  tan(angle: number): number {
    const radians = this.toRadians(angle);
    const result = Math.tan(radians);
    return this.roundAndStore(result);
  }

  asin(value: number): number {
    if (value < -1 || value > 1) {
      throw new Error('Value must be between -1 and 1');
    }
    const result = Math.asin(value);
    return this.roundAndStore(this.fromRadians(result));
  }

  acos(value: number): number {
    if (value < -1 || value > 1) {
      throw new Error('Value must be between -1 and 1');
    }
    const result = Math.acos(value);
    return this.roundAndStore(this.fromRadians(result));
  }

  atan(value: number): number {
    const result = Math.atan(value);
    return this.roundAndStore(this.fromRadians(result));
  }

  atan2(y: number, x: number): number {
    const result = Math.atan2(y, x);
    return this.roundAndStore(this.fromRadians(result));
  }

  sinh(value: number): number {
    const result = (Math.exp(value) - Math.exp(-value)) / 2;
    return this.roundAndStore(result);
  }

  cosh(value: number): number {
    const result = (Math.exp(value) + Math.exp(-value)) / 2;
    return this.roundAndStore(result);
  }

  tanh(value: number): number {
    const result = this.sinh(value) / this.cosh(value);
    return this.roundAndStore(result);
  }

  log(value: number, base: number = 10): number {
    if (value <= 0) {
      throw new Error('Logarithm of non-positive number');
    }
    if (base <= 0 || base === 1) {
      throw new Error('Invalid logarithm base');
    }
    const result = Math.log(value) / Math.log(base);
    return this.roundAndStore(result);
  }

  ln(value: number): number {
    if (value <= 0) {
      throw new Error('Natural logarithm of non-positive number');
    }
    const result = Math.log(value);
    return this.roundAndStore(result);
  }

  exp(value: number): number {
    const result = Math.exp(value);
    return this.roundAndStore(result);
  }

  sqrt(value: number): number {
    if (value < 0) {
      throw new Error('Square root of negative number');
    }
    const result = Math.sqrt(value);
    return this.roundAndStore(result);
  }

  cbrt(value: number): number {
    const result = Math.cbrt(value);
    return this.roundAndStore(result);
  }

  nthRoot(value: number, n: number): number {
    if (n === 0) {
      throw new Error('Root index cannot be zero');
    }
    if (value < 0 && n % 2 === 0) {
      throw new Error('Even root of negative number');
    }
    const result = Math.pow(value, 1 / n);
    return this.roundAndStore(result);
  }

  ceil(value: number): number {
    const result = Math.ceil(value);
    return this.roundAndStore(result);
  }

  floor(value: number): number {
    const result = Math.floor(value);
    return this.roundAndStore(result);
  }

  round(value: number): number {
    const result = Math.round(value);
    return this.roundAndStore(result);
  }

  sign(value: number): number {
    let result: number;
    if (value > 0) result = 1;
    else if (value < 0) result = -1;
    else result = 0;
    return this.roundAndStore(result);
  }

  percentage(value: number, percentage: number): number {
    const result = (value * percentage) / 100;
    return this.roundAndStore(result);
  }

  percentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) {
      throw new Error('Cannot calculate percentage change from zero');
    }
    const result = ((newValue - oldValue) / oldValue) * 100;
    return this.roundAndStore(result);
  }

  private toRadians(angle: number): number {
    return this.angleMode === 'deg' ? (angle * Math.PI) / 180 : angle;
  }

  private fromRadians(radians: number): number {
    return this.angleMode === 'deg' ? (radians * 180) / Math.PI : radians;
  }

  private roundAndStore(value: number): number {
    const multiplier = Math.pow(10, this.getPrecision());
    const rounded = Math.round(value * multiplier) / multiplier;
    this.getHistory().push(rounded);
    return rounded;
  }
}