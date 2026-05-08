import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../lib/config.js";

const queryClient = postgres(config.databaseUrl);
export const db = drizzle(queryClient);
