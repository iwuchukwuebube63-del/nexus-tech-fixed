import { defineConfig } from "drizzle-kit";
import path from "path";

// Use SQLite file-based database
const dbPath = path.resolve(process.cwd(), "data.db");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${dbPath}`,
  },
});
