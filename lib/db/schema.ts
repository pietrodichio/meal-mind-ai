import { relations } from "drizzle-orm";
import { pgTable, uuid, timestamp, jsonb, text } from "drizzle-orm/pg-core";

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

// Meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  // Store the entire meal plan as JSONB
  plan: jsonb("plan")
    .$type<{
      monday: { lunch: { name: string }; dinner: { name: string } };
      tuesday: { lunch: { name: string }; dinner: { name: string } };
      wednesday: { lunch: { name: string }; dinner: { name: string } };
      thursday: { lunch: { name: string }; dinner: { name: string } };
      friday: { lunch: { name: string }; dinner: { name: string } };
      saturday: { lunch: { name: string }; dinner: { name: string } };
      sunday: { lunch: { name: string }; dinner: { name: string } };
    }>()
    .notNull(),
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

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  account: one(accounts, {
    fields: [mealPlans.accountId],
    references: [accounts.id],
  }),
  createdBy: one(users, {
    fields: [mealPlans.createdById],
    references: [users.id],
  }),
}));
