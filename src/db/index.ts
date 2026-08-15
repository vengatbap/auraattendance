import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon, neonConfig } from '@neondatabase/serverless';
neonConfig.fetchConnectionCache = true;
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
