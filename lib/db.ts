import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || "app"}:${process.env.DB_PASS || "apppass"}@${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "uncomfirmatives"}`;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
