import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!connectionString && !sqlHost) {
  throw new Error("Either DATABASE_URL or SQL_HOST must be set in environment variables.");
}

const dbCredentials = connectionString
  ? { 
      url: connectionString, 
      ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : true 
    }
  : {
      host: sqlHost!,
      user: user || "postgres",
      password: password || "",
      database: sqlDbName!,
      ssl: sqlHost?.includes("neon.tech") ? { rejectUnauthorized: false } : false,
    };

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials,
  verbose: true,
});
