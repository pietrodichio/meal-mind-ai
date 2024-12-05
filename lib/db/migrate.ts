import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, migrationClient } from ".";

export async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: "./lib/db/migrations" });
    console.log("Migrations completed");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}
