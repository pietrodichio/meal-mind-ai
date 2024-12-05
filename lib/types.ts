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
  monday: DayMeals;
  tuesday: DayMeals;
  wednesday: DayMeals;
  thursday: DayMeals;
  friday: DayMeals;
  saturday: DayMeals;
  sunday: DayMeals;
  createdAt: string;
}

export type DayOfWeek = keyof Omit<MealPlan, "id" | "userId" | "createdAt">;

// Example:
export const exampleMealPlan: MealPlan = {
  id: "mp_123",
  userId: "user_456",
  monday: {
    lunch: {
      name: "Pollo con broccoli e riso Pollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e risoPollo con broccoli e riso",
    },
    dinner: { name: "Zuppa di ceci e zucca con pane" },
  },
  tuesday: {
    lunch: { name: "Insalata di tonno" },
    dinner: { name: "Pasta al pomodoro" },
  },
  wednesday: {
    lunch: { name: "" },
    dinner: { name: "" },
  },
  thursday: {
    lunch: { name: "" },
    dinner: { name: "" },
  },
  friday: {
    lunch: { name: "" },
    dinner: { name: "" },
  },
  saturday: {
    lunch: { name: "" },
    dinner: { name: "" },
  },
  sunday: {
    lunch: { name: "" },
    dinner: { name: "" },
  },
  createdAt: "2024-03-17T10:00:00Z",
};
