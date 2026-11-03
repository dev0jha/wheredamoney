import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://wheredamoney:wheredamoney@localhost:5433/wheredamoney",
  },
  strict: true,
  verbose: true,
});
