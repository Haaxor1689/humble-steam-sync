import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
	throw new Error('Missing env vars DATABASE_URL or DATABASE_AUTH_TOKEN');
}

export const db = drizzle(
	createClient({
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	}),
	{ schema }
);
