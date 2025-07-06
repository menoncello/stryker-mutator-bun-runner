export class Calculator {
  private history: number[] = [];
  private precision: number = 2;

  constructor(precision: number = 2) {
    if (precision < 0 || precision > 10) {
      throw new Error('Precision must be between 0 and 10');
    }
    this.precision = precision;
  }

  add(a: number, b: number): number {
    const result = a + b;
    this.addToHistory(result);
    return this.round(result);
  }

  subtract(a: number, b: number): number {
    const result = a - b;
    this.addToHistory(result);
    return this.round(result);
  }

  multiply(a: number, b: number): number {
    const result = a * b;
    this.addToHistory(result);
    return this.round(result);
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = a / b;
    this.addToHistory(result);
    return this.round(result);
  }

  power(base: number, exponent: number): number {
    if (exponent < 0) {
      return this.round(1 / this.power(base, -exponent));
    }
    let result = 1;
    for (let i = 0; i < exponent; i++) {
      result *= base;
    }
    this.addToHistory(result);
    return this.round(result);
  }

  factorial(n: number): number {
    if (n < 0) {
      throw new Error('Factorial of negative number');
    }
    if (n === 0 || n === 1) {
      return 1;
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    this.addToHistory(result);
    return result;
  }

  modulo(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Modulo by zero');
    }
    const result = a % b;
    this.addToHistory(result);
    return result;
  }

  absolute(n: number): number {
    const result = n < 0 ? -n : n;
    this.addToHistory(result);
    return result;
  }

  min(a: number, b: number): number {
    const result = a < b ? a : b;
    this.addToHistory(result);
    return result;
  }

  max(a: number, b: number): number {
    const result = a > b ? a : b;
    this.addToHistory(result);
    return result;
  }

  average(numbers: number[]): number {
    if (numbers.length === 0) {
      throw new Error('Cannot calculate average of empty array');
    }
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    const result = sum / numbers.length;
    this.addToHistory(result);
    return this.round(result);
  }

  median(numbers: number[]): number {
    if (numbers.length === 0) {
      throw new Error('Cannot calculate median of empty array');
    }
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    let result: number;
    if (sorted.length % 2 === 0) {
      result = (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      result = sorted[mid];
    }
    
    this.addToHistory(result);
    return this.round(result);
  }

  standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) {
      throw new Error('Cannot calculate standard deviation of empty array');
    }
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((acc, n) => acc + n, 0) / numbers.length;
    const result = Math.sqrt(avgSquaredDiff);
    this.addToHistory(result);
    return this.round(result);
  }

  isPrime(n: number): boolean {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) {
        return false;
      }
    }
    return true;
  }

  fibonacci(n: number): number {
    if (n < 0) {
      throw new Error('Fibonacci of negative number');
    }
    if (n === 0) return 0;
    if (n === 1) return 1;
    
    let prev = 0;
    let curr = 1;
    
    for (let i = 2; i <= n; i++) {
      const temp = curr;
      curr = prev + curr;
      prev = temp;
    }
    
    this.addToHistory(curr);
    return curr;
  }

  gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    
    this.addToHistory(a);
    return a;
  }

  lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    const result = Math.abs(a * b) / this.gcd(a, b);
    this.addToHistory(result);
    return Math.floor(result);
  }

  getHistory(): number[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  getLastResult(): number | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  getHistorySize(): number {
    return this.history.length;
  }

  setPrecision(precision: number): void {
    if (precision < 0 || precision > 10) {
      throw new Error('Precision must be between 0 and 10');
    }
    this.precision = precision;
  }

  getPrecision(): number {
    return this.precision;
  }

  private addToHistory(value: number): void {
    if (this.history.length >= 100) {
      this.history.shift();
    }
    this.history.push(value);
  }

  private round(value: number): number {
    const multiplier = Math.pow(10, this.precision);
    return Math.round(value * multiplier) / multiplier;
  }
}