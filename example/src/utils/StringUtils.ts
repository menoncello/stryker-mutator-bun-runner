export class StringUtils {
  static capitalize(str: string): string {
    if (!str || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static camelCase(str: string): string {
    if (!str || str.length === 0) return str;

    const words = str.split(/[\s-_]+/);
    if (words.length === 0) return str;

    return (
      words[0].toLowerCase() +
      words
        .slice(1)
        .map(word => this.capitalize(word))
        .join('')
    );
  }

  static pascalCase(str: string): string {
    if (!str || str.length === 0) return str;

    const words = str.split(/[\s-_]+/);
    return words.map(word => this.capitalize(word)).join('');
  }

  static kebabCase(str: string): string {
    if (!str || str.length === 0) return str;

    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  static snakeCase(str: string): string {
    if (!str || str.length === 0) return str;

    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  static titleCase(str: string): string {
    if (!str || str.length === 0) return str;

    const smallWords = [
      'a',
      'an',
      'and',
      'as',
      'at',
      'but',
      'by',
      'for',
      'if',
      'in',
      'of',
      'on',
      'or',
      'the',
      'to',
      'up'
    ];
    const words = str.toLowerCase().split(/\s+/);

    return words
      .map((word, index) => {
        if (index === 0 || !smallWords.includes(word)) {
          return this.capitalize(word);
        }
        return word;
      })
      .join(' ');
  }

  static reverse(str: string): string {
    if (!str || str.length === 0) return str;
    return str.split('').reverse().join('');
  }

  static isPalindrome(str: string): boolean {
    if (!str || str.length === 0) return true;

    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reversed = this.reverse(cleaned);
    return cleaned === reversed;
  }

  static countWords(str: string): number {
    if (!str || str.length === 0) return 0;

    const words = str.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }

  static countVowels(str: string): number {
    if (!str || str.length === 0) return 0;

    const matches = str.match(/[aeiouAEIOU]/g);
    return matches ? matches.length : 0;
  }

  static countConsonants(str: string): number {
    if (!str || str.length === 0) return 0;

    const matches = str.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g);
    return matches ? matches.length : 0;
  }

  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (!str || str.length === 0) return str;
    if (maxLength < 0) throw new Error('Max length must be non-negative');
    if (str.length <= maxLength) return str;

    const truncLength = maxLength - suffix.length;
    if (truncLength < 0) return suffix.substring(0, maxLength);

    return str.substring(0, truncLength) + suffix;
  }

  static padLeft(str: string, length: number, padChar: string = ' '): string {
    if (!str) str = '';
    if (length < 0) throw new Error('Length must be non-negative');
    if (padChar.length !== 1) throw new Error('Pad character must be a single character');

    while (str.length < length) {
      str = padChar + str;
    }
    return str;
  }

  static padRight(str: string, length: number, padChar: string = ' '): string {
    if (!str) str = '';
    if (length < 0) throw new Error('Length must be non-negative');
    if (padChar.length !== 1) throw new Error('Pad character must be a single character');

    while (str.length < length) {
      str = str + padChar;
    }
    return str;
  }

  static repeat(str: string, count: number): string {
    if (!str || str.length === 0) return '';
    if (count < 0) throw new Error('Count must be non-negative');
    if (count === 0) return '';

    let result = '';
    for (let i = 0; i < count; i++) {
      result += str;
    }
    return result;
  }

  static removeWhitespace(str: string): string {
    if (!str || str.length === 0) return str;
    return str.replace(/\s+/g, '');
  }

  static normalizeWhitespace(str: string): string {
    if (!str || str.length === 0) return str;
    return str.replace(/\s+/g, ' ').trim();
  }

  static isNumeric(str: string): boolean {
    if (!str || str.length === 0) return false;
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
  }

  static isAlpha(str: string): boolean {
    if (!str || str.length === 0) return false;
    return /^[a-zA-Z]+$/.test(str);
  }

  static isAlphanumeric(str: string): boolean {
    if (!str || str.length === 0) return false;
    return /^[a-zA-Z0-9]+$/.test(str);
  }

  static extractNumbers(str: string): number[] {
    if (!str || str.length === 0) return [];

    const matches = str.match(/-?\d+(\.\d+)?/g);
    return matches ? matches.map(match => parseFloat(match)) : [];
  }

  static extractEmails(str: string): string[] {
    if (!str || str.length === 0) return [];

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = str.match(emailRegex);
    return matches || [];
  }

  static extractUrls(str: string): string[] {
    if (!str || str.length === 0) return [];

    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
    const matches = str.match(urlRegex);
    return matches || [];
  }

  static toBase64(str: string): string {
    if (!str) return '';
    return btoa(str);
  }

  static fromBase64(str: string): string {
    if (!str) return '';
    try {
      return atob(str);
    } catch (e) {
      throw new Error('Invalid base64 string');
    }
  }

  static hash(str: string): number {
    if (!str || str.length === 0) return 0;

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  static levenshteinDistance(str1: string, str2: string): number {
    if (!str1) return str2 ? str2.length : 0;
    if (!str2) return str1.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
