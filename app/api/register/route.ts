import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users, accounts } from "@/lib/db/schema";

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
