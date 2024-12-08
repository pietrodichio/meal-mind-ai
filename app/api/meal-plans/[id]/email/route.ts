import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { mealPlans, meals, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sendMealPlanEmail } from "@/lib/email";
import { generateGroceryList } from "@/lib/meal-generator";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's email
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 404 }
      );
    }

    // Get all meals for this plan
    const mealsList = await db.query.meals.findMany({
      where: eq(meals.mealPlanId, params.id),
    });

    // Generate grocery list
    const groceryList = await generateGroceryList(
      mealsList as { name: string; day: string; type: string }[]
    );

    // Send email
    await sendMealPlanEmail(user.email, {
      meals: mealsList as { name: string; day: string; type: string }[],
      groceryList,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending meal plan email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
