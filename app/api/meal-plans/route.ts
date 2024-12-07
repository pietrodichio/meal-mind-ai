import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { mealPlans, meals, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getMealPlansByAccountId } from "@/lib/db/queries";

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

    // Create new meal plan
    const [mealPlan] = await db
      .insert(mealPlans)
      .values({
        accountId: user.accountId,
        createdById: session.user.id,
      })
      .returning();

    // Create empty meals for the plan
    const mealsToInsert = DAYS.flatMap((day) =>
      TYPES.map((type) => ({
        mealPlanId: mealPlan.id,
        day,
        type,
        name: "",
      }))
    );

    await db.insert(meals).values(mealsToInsert);

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
