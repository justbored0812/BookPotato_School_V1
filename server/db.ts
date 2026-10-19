import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Enable WebSockets for the Neon serverless driver to work in Node environments
neonConfig.webSocketConstructor = ws.WebSocket || ws;
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Always use SSL for Neon
  max: 10, // Limit connections to prevent exhaustion
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
});

// Handle pool errors to prevent crashes on unexpected terminations
pool.on('error', (err: any) => {
  const message = err.message || (err.error && err.error.message) || 'Unknown database error';
  console.error('❌ Unexpected database pool error:', message);
  if (message.includes('WebSocket')) {
    console.warn('⚠️ Neon WebSocket connection issue detected. The pool will attempt to recover.');
  }
});

// Let connections be established lazily by pg/drizzle on demand.
export const db = drizzle(pool, { schema });
