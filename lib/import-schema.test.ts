import { describe, it, expect } from "vitest";
import { importPayloadSchema } from "./import-schema";

const DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

function full14() {
  return DAYS.flatMap((day) => [
    { day, type: "lunch", name: `${day} lunch` },
    { day, type: "dinner", name: `${day} dinner` },
  ]);
}

const validGrocery = {
  categories: {
    "Frutta e Verdura": [{ item: "Carote", quantity: "300 g" }],
    Dispensa: [{ item: "Pasta integrale", quantity: "560 g", note: "2 confezioni" }],
  },
};

describe("importPayloadSchema", () => {
  it("accepts a complete 14-meal payload", () => {
    const r = importPayloadSchema.safeParse({
      meals: full14(),
      groceryList: validGrocery,
    });
    expect(r.success).toBe(true);
  });

  it("accepts an optional mealPlanId (uuid)", () => {
    const r = importPayloadSchema.safeParse({
      mealPlanId: "11111111-1111-1111-1111-111111111111",
      meals: full14(),
      groceryList: validGrocery,
    });
    expect(r.success).toBe(true);
  });

  it("rejects fewer than 14 meals", () => {
    const meals = full14().slice(0, 13);
    const r = importPayloadSchema.safeParse({ meals, groceryList: validGrocery });
    expect(r.success).toBe(false);
  });

  it("rejects 14 meals that do not cover each day+type uniquely", () => {
    const meals = full14();
    meals[1] = { day: "monday", type: "lunch", name: "dup" };
    const r = importPayloadSchema.safeParse({ meals, groceryList: validGrocery });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid day", () => {
    const meals = full14();
    (meals[0] as any).day = "funday";
    const r = importPayloadSchema.safeParse({ meals, groceryList: validGrocery });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed grocery list", () => {
    const r = importPayloadSchema.safeParse({
      meals: full14(),
      groceryList: { categories: "not-an-object" },
    });
    expect(r.success).toBe(false);
  });
});
