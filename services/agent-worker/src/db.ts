import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://openfinch:openfinch@localhost:5432/openfinch";

const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient);

export async function closeDb(): Promise<void> {
  await queryClient.end({ timeout: 5 });
}