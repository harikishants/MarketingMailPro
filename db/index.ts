// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
// import * as schema from "@shared/schema";
// import 'dotenv/config';  // loads .env variables

// // This is the correct way neon config - DO NOT change this
// neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "DATABASE_URL must be set. Did you forget to provision a database?",
//   );
// }

// export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle({ client: pool, schema });

import 'dotenv/config';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

const pg = await import('pg');
const Client = pg.default.Client;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

export const db = drizzle(client, { schema });
