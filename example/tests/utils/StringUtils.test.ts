import { describe, it, expect } from "bun:test";
import { StringUtils } from "../../src/utils/StringUtils";

describe("StringUtils", () => {
  describe("capitalize", () => {
    it("should capitalize strings", () => {
      expect(StringUtils.capitalize("hello")).toBe("Hello");
      expect(StringUtils.capitalize("WORLD")).toBe("World");
      expect(StringUtils.capitalize("hELLO")).toBe("Hello");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.capitalize("")).toBe("");
      expect(StringUtils.capitalize(null as any)).toBe(null);
      expect(StringUtils.capitalize("a")).toBe("A");
    });
  });

  describe("camelCase", () => {
    it("should convert to camelCase", () => {
      expect(StringUtils.camelCase("hello world")).toBe("helloWorld");
      expect(StringUtils.camelCase("hello-world")).toBe("helloWorld");
      expect(StringUtils.camelCase("hello_world")).toBe("helloWorld");
      expect(StringUtils.camelCase("Hello World")).toBe("helloWorld");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.camelCase("")).toBe("");
      expect(StringUtils.camelCase(null as any)).toBe(null);
      expect(StringUtils.camelCase("hello")).toBe("hello");
    });
  });

  describe("pascalCase", () => {
    it("should convert to PascalCase", () => {
      expect(StringUtils.pascalCase("hello world")).toBe("HelloWorld");
      expect(StringUtils.pascalCase("hello-world")).toBe("HelloWorld");
      expect(StringUtils.pascalCase("hello_world")).toBe("HelloWorld");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.pascalCase("")).toBe("");
      expect(StringUtils.pascalCase(null as any)).toBe(null);
      expect(StringUtils.pascalCase("hello")).toBe("Hello");
    });
  });

  describe("kebabCase", () => {
    it("should convert to kebab-case", () => {
      expect(StringUtils.kebabCase("helloWorld")).toBe("hello-world");
      expect(StringUtils.kebabCase("HelloWorld")).toBe("hello-world");
      expect(StringUtils.kebabCase("hello world")).toBe("hello-world");
      expect(StringUtils.kebabCase("hello_world")).toBe("hello-world");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.kebabCase("")).toBe("");
      expect(StringUtils.kebabCase(null as any)).toBe(null);
      expect(StringUtils.kebabCase("hello")).toBe("hello");
    });
  });

  describe("snakeCase", () => {
    it("should convert to snake_case", () => {
      expect(StringUtils.snakeCase("helloWorld")).toBe("hello_world");
      expect(StringUtils.snakeCase("HelloWorld")).toBe("hello_world");
      expect(StringUtils.snakeCase("hello world")).toBe("hello_world");
      expect(StringUtils.snakeCase("hello-world")).toBe("hello_world");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.snakeCase("")).toBe("");
      expect(StringUtils.snakeCase(null as any)).toBe(null);
      expect(StringUtils.snakeCase("hello")).toBe("hello");
    });
  });

  describe("titleCase", () => {
    it("should convert to Title Case", () => {
      expect(StringUtils.titleCase("hello world")).toBe("Hello World");
      expect(StringUtils.titleCase("the quick brown fox")).toBe("The Quick Brown Fox");
      expect(StringUtils.titleCase("hello and goodbye")).toBe("Hello and Goodbye");
    });

    it("should handle small words correctly", () => {
      expect(StringUtils.titleCase("the cat in the hat")).toBe("The Cat in the Hat");
      expect(StringUtils.titleCase("of mice and men")).toBe("Of Mice and Men");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.titleCase("")).toBe("");
      expect(StringUtils.titleCase(null as any)).toBe(null);
    });
  });

  describe("reverse", () => {
    it("should reverse strings", () => {
      expect(StringUtils.reverse("hello")).toBe("olleh");
      expect(StringUtils.reverse("12345")).toBe("54321");
      expect(StringUtils.reverse("a b c")).toBe("c b a");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.reverse("")).toBe("");
      expect(StringUtils.reverse(null as any)).toBe(null);
      expect(StringUtils.reverse("a")).toBe("a");
    });
  });

  describe("isPalindrome", () => {
    it("should detect palindromes", () => {
      expect(StringUtils.isPalindrome("racecar")).toBe(true);
      expect(StringUtils.isPalindrome("A man a plan a canal Panama")).toBe(true);
      expect(StringUtils.isPalindrome("hello")).toBe(false);
      expect(StringUtils.isPalindrome("12321")).toBe(true);
    });

    it("should handle edge cases", () => {
      expect(StringUtils.isPalindrome("")).toBe(true);
      expect(StringUtils.isPalindrome(null as any)).toBe(true);
      expect(StringUtils.isPalindrome("a")).toBe(true);
    });
  });

  describe("countWords", () => {
    it("should count words", () => {
      expect(StringUtils.countWords("hello world")).toBe(2);
      expect(StringUtils.countWords("the quick brown fox")).toBe(4);
      expect(StringUtils.countWords("   multiple   spaces   ")).toBe(2);
    });

    it("should handle edge cases", () => {
      expect(StringUtils.countWords("")).toBe(0);
      expect(StringUtils.countWords(null as any)).toBe(0);
      expect(StringUtils.countWords("   ")).toBe(0);
    });
  });

  describe("countVowels", () => {
    it("should count vowels", () => {
      expect(StringUtils.countVowels("hello")).toBe(2);
      expect(StringUtils.countVowels("AEIOU")).toBe(5);
      expect(StringUtils.countVowels("xyz")).toBe(0);
      expect(StringUtils.countVowels("Hello World")).toBe(3);
    });

    it("should handle edge cases", () => {
      expect(StringUtils.countVowels("")).toBe(0);
      expect(StringUtils.countVowels(null as any)).toBe(0);
    });
  });

  describe("countConsonants", () => {
    it("should count consonants", () => {
      expect(StringUtils.countConsonants("hello")).toBe(3);
      expect(StringUtils.countConsonants("xyz")).toBe(3);
      expect(StringUtils.countConsonants("aeiou")).toBe(0);
      expect(StringUtils.countConsonants("Hello World")).toBe(7);
    });

    it("should handle edge cases", () => {
      expect(StringUtils.countConsonants("")).toBe(0);
      expect(StringUtils.countConsonants(null as any)).toBe(0);
    });
  });

  describe("truncate", () => {
    it("should truncate strings", () => {
      expect(StringUtils.truncate("hello world", 5)).toBe("he...");
      expect(StringUtils.truncate("hello world", 8)).toBe("hello...");
      expect(StringUtils.truncate("hello", 10)).toBe("hello");
    });

    it("should handle custom suffix", () => {
      expect(StringUtils.truncate("hello world", 7, "...")).toBe("hell...");
      expect(StringUtils.truncate("hello world", 8, ">>")).toBe("hello >>");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.truncate("", 5)).toBe("");
      expect(StringUtils.truncate(null as any, 5)).toBe(null);
      expect(() => StringUtils.truncate("hello", -1)).toThrow("Max length must be non-negative");
      expect(StringUtils.truncate("hello", 2, "...")).toBe("..");
    });
  });

  describe("padLeft", () => {
    it("should pad strings on the left", () => {
      expect(StringUtils.padLeft("hello", 10)).toBe("     hello");
      expect(StringUtils.padLeft("123", 5, "0")).toBe("00123");
      expect(StringUtils.padLeft("test", 4)).toBe("test");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.padLeft(null as any, 5)).toBe("     ");
      expect(() => StringUtils.padLeft("hello", -1)).toThrow("Length must be non-negative");
      expect(() => StringUtils.padLeft("hello", 10, "ab")).toThrow("Pad character must be a single character");
    });
  });

  describe("padRight", () => {
    it("should pad strings on the right", () => {
      expect(StringUtils.padRight("hello", 10)).toBe("hello     ");
      expect(StringUtils.padRight("123", 5, "0")).toBe("12300");
      expect(StringUtils.padRight("test", 4)).toBe("test");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.padRight(null as any, 5)).toBe("     ");
      expect(() => StringUtils.padRight("hello", -1)).toThrow("Length must be non-negative");
      expect(() => StringUtils.padRight("hello", 10, "ab")).toThrow("Pad character must be a single character");
    });
  });

  describe("repeat", () => {
    it("should repeat strings", () => {
      expect(StringUtils.repeat("a", 5)).toBe("aaaaa");
      expect(StringUtils.repeat("hello", 3)).toBe("hellohellohello");
      expect(StringUtils.repeat("123", 2)).toBe("123123");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.repeat("", 5)).toBe("");
      expect(StringUtils.repeat(null as any, 5)).toBe("");
      expect(StringUtils.repeat("hello", 0)).toBe("");
      expect(() => StringUtils.repeat("hello", -1)).toThrow("Count must be non-negative");
    });
  });

  describe("removeWhitespace", () => {
    it("should remove all whitespace", () => {
      expect(StringUtils.removeWhitespace("hello world")).toBe("helloworld");
      expect(StringUtils.removeWhitespace("  a  b  c  ")).toBe("abc");
      expect(StringUtils.removeWhitespace("\t\n\r test \t\n\r")).toBe("test");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.removeWhitespace("")).toBe("");
      expect(StringUtils.removeWhitespace(null as any)).toBe(null);
    });
  });

  describe("normalizeWhitespace", () => {
    it("should normalize whitespace", () => {
      expect(StringUtils.normalizeWhitespace("  hello   world  ")).toBe("hello world");
      expect(StringUtils.normalizeWhitespace("\t\nhello\t\nworld\t\n")).toBe("hello world");
      expect(StringUtils.normalizeWhitespace("   a   b   c   ")).toBe("a b c");
    });

    it("should handle edge cases", () => {
      expect(StringUtils.normalizeWhitespace("")).toBe("");
      expect(StringUtils.normalizeWhitespace(null as any)).toBe(null);
    });
  });

  describe("validation functions", () => {
    it("should check if string is numeric", () => {
      expect(StringUtils.isNumeric("123")).toBe(true);
      expect(StringUtils.isNumeric("123.45")).toBe(true);
      expect(StringUtils.isNumeric("-123")).toBe(true);
      expect(StringUtils.isNumeric("abc")).toBe(false);
      expect(StringUtils.isNumeric("12a3")).toBe(false);
    });

    it("should check if string is alpha", () => {
      expect(StringUtils.isAlpha("abc")).toBe(true);
      expect(StringUtils.isAlpha("ABC")).toBe(true);
      expect(StringUtils.isAlpha("abc123")).toBe(false);
      expect(StringUtils.isAlpha("abc ")).toBe(false);
    });

    it("should check if string is alphanumeric", () => {
      expect(StringUtils.isAlphanumeric("abc123")).toBe(true);
      expect(StringUtils.isAlphanumeric("ABC123")).toBe(true);
      expect(StringUtils.isAlphanumeric("abc")).toBe(true);
      expect(StringUtils.isAlphanumeric("123")).toBe(true);
      expect(StringUtils.isAlphanumeric("abc 123")).toBe(false);
      expect(StringUtils.isAlphanumeric("abc-123")).toBe(false);
    });

    it("should handle edge cases in validation", () => {
      expect(StringUtils.isNumeric("")).toBe(false);
      expect(StringUtils.isNumeric(null as any)).toBe(false);
      expect(StringUtils.isAlpha("")).toBe(false);
      expect(StringUtils.isAlpha(null as any)).toBe(false);
      expect(StringUtils.isAlphanumeric("")).toBe(false);
      expect(StringUtils.isAlphanumeric(null as any)).toBe(false);
    });
  });

  describe("extraction functions", () => {
    it("should extract numbers", () => {
      expect(StringUtils.extractNumbers("abc123def456")).toEqual([123, 456]);
      expect(StringUtils.extractNumbers("price: $19.99")).toEqual([19.99]);
      expect(StringUtils.extractNumbers("temperature: -5.5°C")).toEqual([-5.5]);
      expect(StringUtils.extractNumbers("no numbers here")).toEqual([]);
    });

    it("should extract emails", () => {
      expect(StringUtils.extractEmails("Contact: john@example.com")).toEqual(["john@example.com"]);
      expect(StringUtils.extractEmails("Email: test@domain.co.uk or admin@site.org")).toEqual(["test@domain.co.uk", "admin@site.org"]);
      expect(StringUtils.extractEmails("No emails here")).toEqual([]);
    });

    it("should extract URLs", () => {
      expect(StringUtils.extractUrls("Visit https://example.com")).toEqual(["https://example.com"]);
      expect(StringUtils.extractUrls("Sites: http://test.org and https://www.google.com")).toEqual(["http://test.org", "https://www.google.com"]);
      expect(StringUtils.extractUrls("No URLs here")).toEqual([]);
    });

    it("should handle edge cases in extraction", () => {
      expect(StringUtils.extractNumbers("")).toEqual([]);
      expect(StringUtils.extractNumbers(null as any)).toEqual([]);
      expect(StringUtils.extractEmails("")).toEqual([]);
      expect(StringUtils.extractEmails(null as any)).toEqual([]);
      expect(StringUtils.extractUrls("")).toEqual([]);
      expect(StringUtils.extractUrls(null as any)).toEqual([]);
    });
  });

  describe("base64 functions", () => {
    it("should encode to base64", () => {
      expect(StringUtils.toBase64("hello")).toBe("aGVsbG8=");
      expect(StringUtils.toBase64("Hello World!")).toBe("SGVsbG8gV29ybGQh");
      expect(StringUtils.toBase64("")).toBe("");
    });

    it("should decode from base64", () => {
      expect(StringUtils.fromBase64("aGVsbG8=")).toBe("hello");
      expect(StringUtils.fromBase64("SGVsbG8gV29ybGQh")).toBe("Hello World!");
      expect(StringUtils.fromBase64("")).toBe("");
    });

    it("should handle invalid base64", () => {
      expect(() => StringUtils.fromBase64("invalid!@#")).toThrow("Invalid base64 string");
    });
  });

  describe("hash function", () => {
    it("should generate hash for strings", () => {
      const hash1 = StringUtils.hash("hello");
      const hash2 = StringUtils.hash("hello");
      const hash3 = StringUtils.hash("world");
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(typeof hash1).toBe("number");
      expect(hash1).toBeGreaterThan(0);
    });

    it("should handle edge cases", () => {
      expect(StringUtils.hash("")).toBe(0);
      expect(StringUtils.hash(null as any)).toBe(0);
    });
  });

  describe("levenshteinDistance", () => {
    it("should calculate edit distance", () => {
      expect(StringUtils.levenshteinDistance("kitten", "sitting")).toBe(3);
      expect(StringUtils.levenshteinDistance("saturday", "sunday")).toBe(3);
      expect(StringUtils.levenshteinDistance("hello", "hello")).toBe(0);
      expect(StringUtils.levenshteinDistance("abc", "xyz")).toBe(3);
    });

    it("should handle edge cases", () => {
      expect(StringUtils.levenshteinDistance("", "hello")).toBe(5);
      expect(StringUtils.levenshteinDistance("hello", "")).toBe(5);
      expect(StringUtils.levenshteinDistance("", "")).toBe(0);
      expect(StringUtils.levenshteinDistance(null as any, "hello")).toBe(5);
      expect(StringUtils.levenshteinDistance("hello", null as any)).toBe(5);
      expect(StringUtils.levenshteinDistance(null as any, null as any)).toBe(0);
    });
  });
});