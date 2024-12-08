import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { mealPlans, meals } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();
    const day = Object.keys(plan)[0] as
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    const type = Object.keys(plan[day])[0] as "lunch" | "dinner";
    const name = plan[day][type].name;

    const [updatedMeal] = await db
      .insert(meals)
      .values({
        mealPlanId: params.id,
        day,
        type,
        name,
      })
      .onConflictDoUpdate({
        target: [meals.mealPlanId, meals.day, meals.type],
        set: { name, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(updatedMeal);
  } catch (error) {
    console.error("Error updating meal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the meal plan and its associated meals (cascade delete is handled by the foreign key)
    await db.delete(mealPlans).where(eq(mealPlans.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
