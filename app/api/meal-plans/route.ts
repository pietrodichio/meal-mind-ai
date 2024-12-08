import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { mealPlans, meals, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getMealPlansByAccountId } from "@/lib/db/queries";
import { generateMealPlan, PastMeal } from "@/lib/meal-generator";

export const dynamic = "force-dynamic";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const TYPES = ["lunch", "dinner"] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = 5;

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Query meal plans with their meals
    const items = await getMealPlansByAccountId(
      user.accountId,
      limit + 1,
      cursor ? parseInt(cursor) : 0
    );

    // If no meal plans exist, create a default one
    if (items.length === 0) {
      const [newMealPlan] = await db
        .insert(mealPlans)
        .values({
          accountId: user.accountId,
          createdById: session.user.id,
        })
        .returning();

      const mealsToInsert = DAYS.flatMap((day) =>
        TYPES.map((type) => ({
          mealPlanId: newMealPlan.id,
          day,
          type,
          name: "",
        }))
      );

      const insertedMeals = await db
        .insert(meals)
        .values(mealsToInsert)
        .returning();

      items.push({ ...newMealPlan, meals: insertedMeals });
    }

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore
      ? cursor
        ? parseInt(cursor) + limit
        : limit
      : null;

    return NextResponse.json({
      items: data,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Fetch last 20 meals for reference
    const pastMeals = await db
      .select({
        name: meals.name,
        day: meals.day,
        type: meals.type,
        createdAt: mealPlans.createdAt,
      })
      .from(meals)
      .innerJoin(mealPlans, eq(meals.mealPlanId, mealPlans.id))
      .where(eq(mealPlans.accountId, user.accountId))
      .orderBy(desc(mealPlans.createdAt))
      .limit(20);

    // Generate AI meal plan with past meals context
    const weeklyPlan = await generateMealPlan(pastMeals as PastMeal[]);

    // Validate the weekly plan
    if (!weeklyPlan || typeof weeklyPlan !== "object") {
      throw new Error("Invalid meal plan generated");
    }

    // Create new meal plan
    const [mealPlan] = await db
      .insert(mealPlans)
      .values({
        accountId: user.accountId,
        createdById: session.user.id,
      })
      .returning();

    // Create meals from the AI-generated plan with validation
    const mealsToInsert = Object.entries(weeklyPlan).flatMap(
      ([day, dayMeals]) => {
        const lunchName = dayMeals?.lunch?.description || `Lunch for ${day}`;
        const dinnerName = dayMeals?.dinner?.description || `Dinner for ${day}`;

        return [
          {
            mealPlanId: mealPlan.id,
            day: day as any,
            type: "lunch" as const,
            name: lunchName,
          },
          {
            mealPlanId: mealPlan.id,
            day: day as any,
            type: "dinner" as const,
            name: dinnerName,
          },
        ];
      }
    );

    const insertedMeals = await db
      .insert(meals)
      .values(mealsToInsert)
      .returning();

    return NextResponse.json({ ...mealPlan, meals: insertedMeals });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
