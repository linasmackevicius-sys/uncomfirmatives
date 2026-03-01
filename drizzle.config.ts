import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3307,
    database: process.env.DB_NAME || "uncomfirmatives",
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASS || "apppass",
  },
});