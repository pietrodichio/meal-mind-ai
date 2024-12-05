import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { mealPlans, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get cursor from query string
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = 5;

    // Get user's account ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Query meal plans
    const items = await db.query.mealPlans.findMany({
      where: eq(mealPlans.accountId, user.accountId),
      orderBy: [desc(mealPlans.createdAt)],
      limit: limit + 1, // get one extra to check if there are more
      offset: cursor ? parseInt(cursor) : 0,
    });

    // Check if there are more items
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

    const body = await req.json();

    const mealPlan = await db
      .insert(mealPlans)
      .values({
        accountId: user.accountId,
        createdById: session.user.id,
        plan: body.plan,
      })
      .returning();

    return NextResponse.json(mealPlan[0]);
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
