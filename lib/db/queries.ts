import { asc, desc, eq, sql } from "drizzle-orm";
import { mealPlans, meals } from "./schema";
import { db } from ".";

// Define meal plan with meals relation
export const getMealPlansWithMeals = db.query.mealPlans.findMany({
  with: {
    meals: true,
  },
});

// Prepare the query builder
export const getMealPlansByAccountId = (
  accountId: string,
  limit: number,
  offset: number
) =>
  db
    .select({
      id: mealPlans.id,
      accountId: mealPlans.accountId,
      createdById: mealPlans.createdById,
      createdAt: mealPlans.createdAt,
      updatedAt: mealPlans.updatedAt,
      meals: sql<any>`json_agg(
        json_build_object(
          'id', ${meals.id},
          'day', ${meals.day},
          'type', ${meals.type},
          'name', ${meals.name}
        )
      )`.as("meals"),
    })
    .from(mealPlans)
    .leftJoin(meals, eq(meals.mealPlanId, mealPlans.id))
    .where(eq(mealPlans.accountId, accountId))
    .groupBy(mealPlans.id)
    .orderBy(asc(mealPlans.createdAt))
    .limit(limit)
    .offset(offset);
