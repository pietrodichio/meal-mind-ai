import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { mealPlans, meals, groceryLists } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { generateGroceryList } from "@/lib/meal-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, try to get existing grocery list
    const existingList = await db.query.groceryLists.findFirst({
      where: eq(groceryLists.mealPlanId, params.id),
    });

    if (existingList) {
      return NextResponse.json(existingList);
    }

    // If no list exists, generate a new one
    const mealsList = await db.query.meals.findMany({
      where: eq(meals.mealPlanId, params.id),
    });

    const filteredMealsList = mealsList.filter(
      (meal) => meal?.name !== null
    ) as { name: string }[];

    const groceryList = await generateGroceryList(filteredMealsList);

    // Save the generated list
    const [savedList] = await db
      .insert(groceryLists)
      .values({
        mealPlanId: params.id,
        categories: groceryList.categories,
      })
      .returning();

    return NextResponse.json(savedList);
  } catch (error) {
    console.error("Error with grocery list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categories } = await req.json();

    // Update the grocery list
    const [updatedList] = await db
      .update(groceryLists)
      .set({
        categories,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(groceryLists.mealPlanId, params.id))
      .returning();

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("Error updating grocery list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
