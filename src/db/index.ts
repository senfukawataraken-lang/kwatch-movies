import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';

dotenv.config();

export const createPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const useSSL = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
    return new Pool({
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 15000,
    });
  }

  if (!process.env.SQL_HOST) {
    throw new Error(
      'Neither DATABASE_URL nor SQL_HOST environment variable is provided. Please set DATABASE_URL in your environment settings (or .env file) to connect your PostgreSQL database.'
    );
  }

  const host = process.env.SQL_HOST;
  const useSSL = host && !host.includes('localhost') && !host.includes('127.0.0.1');
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
