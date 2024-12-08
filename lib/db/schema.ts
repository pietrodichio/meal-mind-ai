import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  timestamp,
  text,
  uniqueIndex,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Accounts table (for families)
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table (family members)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create a meals table for better structure
export const meals = pgTable(
  "meals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mealPlanId: uuid("meal_plan_id")
      .notNull()
      .references(() => mealPlans.id, { onDelete: "cascade" }),
    day: text("day", {
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    }).notNull(),
    type: text("type", { enum: ["lunch", "dinner"] }).notNull(),
    name: text("name").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Add unique constraint for mealPlanId + day + type combination
    unq: uniqueIndex("meal_unique_constraint").on(
      table.mealPlanId,
      table.day,
      table.type
    ),
  })
);

// Simplified meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groceryLists = pgTable("grocery_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  mealPlanId: uuid("meal_plan_id")
    .notNull()
    .references(() => mealPlans.id, { onDelete: "cascade" }),
  categories: jsonb("categories").notNull(),
  isEdited: boolean("is_edited").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(users),
  mealPlans: many(mealPlans),
}));

export const usersRelations = relations(users, ({ one }) => ({
  account: one(accounts, {
    fields: [users.accountId],
    references: [accounts.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ many }) => ({
  meals: many(meals),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [meals.mealPlanId],
    references: [mealPlans.id],
  }),
}));

export const groceryListsRelations = relations(groceryLists, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [groceryLists.mealPlanId],
    references: [mealPlans.id],
  }),
}));
