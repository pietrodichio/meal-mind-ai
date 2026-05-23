import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isValidImportKey } from "./import-auth";

const ORIGINAL = process.env.MEAL_IMPORT_API_KEY;

describe("isValidImportKey", () => {
  beforeEach(() => {
    process.env.MEAL_IMPORT_API_KEY = "s3cr3t-key-value";
  });
  afterEach(() => {
    process.env.MEAL_IMPORT_API_KEY = ORIGINAL;
  });

  it("accepts the correct bearer key", () => {
    expect(isValidImportKey("Bearer s3cr3t-key-value")).toBe(true);
  });

  it("rejects a wrong key", () => {
    expect(isValidImportKey("Bearer wrong")).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(isValidImportKey(null)).toBe(false);
    expect(isValidImportKey(undefined)).toBe(false);
  });

  it("rejects a header without the Bearer prefix", () => {
    expect(isValidImportKey("s3cr3t-key-value")).toBe(false);
  });

  it("fails closed when the env var is unset", () => {
    delete process.env.MEAL_IMPORT_API_KEY;
    expect(isValidImportKey("Bearer s3cr3t-key-value")).toBe(false);
  });
});
