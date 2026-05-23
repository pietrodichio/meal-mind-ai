import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mealPlans, meals, groceryLists, users } from "@/lib/db/schema";
import { isValidImportKey } from "@/lib/import-auth";
import { importPayloadSchema } from "@/lib/import-schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isValidImportKey(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const importEmail = process.env.MEAL_IMPORT_USER_EMAIL;
    if (!importEmail) {
      return NextResponse.json(
        { error: "MEAL_IMPORT_USER_EMAIL not configured" },
        { status: 500 }
      );
    }

    const parsed = importPayloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, importEmail),
    });
    if (!user) {
      return NextResponse.json(
        { error: "Import user not found" },
        { status: 404 }
      );
    }

    const mealPlanId = await db.transaction(async (tx) => {
      // Reuse the given plan only if it belongs to this account; else create one.
      let planId: string | null = payload.mealPlanId ?? null;
      if (planId) {
        const existing = await tx.query.mealPlans.findFirst({
          where: and(
            eq(mealPlans.id, planId),
            eq(mealPlans.accountId, user.accountId)
          ),
        });
        if (!existing) planId = null;
      }

      if (!planId) {
        const [created] = await tx
          .insert(mealPlans)
          .values({ accountId: user.accountId, createdById: user.id })
          .returning();
        planId = created.id;
      } else {
        await tx
          .update(mealPlans)
          .set({ updatedAt: new Date() })
          .where(eq(mealPlans.id, planId));
      }

      // Upsert the 14 meals on the existing (mealPlanId, day, type) unique index.
      for (const m of payload.meals) {
        await tx
          .insert(meals)
          .values({ mealPlanId: planId, day: m.day, type: m.type, name: m.name })
          .onConflictDoUpdate({
            target: [meals.mealPlanId, meals.day, meals.type],
            set: { name: m.name, updatedAt: new Date() },
          });
      }

      // Upsert the grocery list (no unique constraint -> find then update/insert).
      const existingList = await tx.query.groceryLists.findFirst({
        where: eq(groceryLists.mealPlanId, planId),
      });
      if (existingList) {
        await tx
          .update(groceryLists)
          .set({
            categories: payload.groceryList.categories,
            isEdited: true,
            updatedAt: new Date(),
          })
          .where(eq(groceryLists.mealPlanId, planId));
      } else {
        await tx.insert(groceryLists).values({
          mealPlanId: planId,
          categories: payload.groceryList.categories,
          isEdited: true,
        });
      }

      return planId;
    });

    return NextResponse.json({ mealPlanId, ok: true });
  } catch (error) {
    console.error("Error importing meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
