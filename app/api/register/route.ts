import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users, accounts, mealPlans, meals } from "@/lib/db/schema";

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

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const [account] = await db
      .insert(accounts)
      .values({
        name: `${name}'s Family`,
      })
      .returning();

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        accountId: account.id,
      })
      .returning();

    // Create initial meal plan
    const [mealPlan] = await db
      .insert(mealPlans)
      .values({
        accountId: account.id,
        createdById: user.id,
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

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
