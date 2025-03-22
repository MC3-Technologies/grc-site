// File: amplify/functions/user-management/__tests__/utils.test.ts
import { log, generateId, isValidEmail } from "../src/utils";

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Mock console methods
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe("Utils Module", () => {
  describe("log utility", () => {
    test("should log info messages", () => {
      log.info("Test info message");
      expect(console.log).toHaveBeenCalledWith("[INFO] Test info message");
    });

    test("should log info messages with additional arguments", () => {
      log.info("Test info message", { data: "example" });
      expect(console.log).toHaveBeenCalledWith("[INFO] Test info message", {
        data: "example",
      });
    });

    test("should log warning messages", () => {
      log.warn("Test warning message");
      expect(console.warn).toHaveBeenCalledWith("[WARN] Test warning message");
    });

    test("should log error messages", () => {
      log.error("Test error message");
      expect(console.error).toHaveBeenCalledWith("[ERROR] Test error message");
    });
  });

  describe("generateId function", () => {
    test("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    test("should include prefix when provided", () => {
      const prefix = "test-";
      const id = generateId(prefix);
      expect(id.startsWith(prefix)).toBe(true);
    });

    test("should generate string IDs", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
    });
  });

  describe("isValidEmail function", () => {
    test("should validate correct email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("first.last@example.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    test("should reject invalid email addresses", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@example")).toBe(false); // Missing TLD
      expect(isValidEmail("user.example.com")).toBe(false); // Missing @
      expect(isValidEmail("user@exam ple.com")).toBe(false); // Spaces not allowed
    });
  });
});
