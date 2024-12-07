import "next-auth";
import { users } from "./db/schema";
import { InferSelectModel } from "drizzle-orm";

type DBUser = InferSelectModel<typeof users>;

declare module "next-auth" {
  interface User extends DBUser {}

  interface Session {
    user: User & {
      id: string;
      accountId: string;
    };
  }
}

export interface Meal {
  name: string;
  description?: string;
}

export interface DayMeals {
  lunch: Meal;
  dinner: Meal;
}

export interface MealPlan {
  id: string;
  userId: string;
  meals: {
    id: string;
    day: DayOfWeek;
    type: "lunch" | "dinner";
    name: string;
  }[];
  createdAt: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
