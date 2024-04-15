import { type Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
	throw new Error('Missing env vars DATABASE_URL and DATABASE_AUTH_TOKEN');
}

export default {
	schema: './edge/db/schema.ts',
	driver: 'turso',
	dbCredentials: {
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN
	},
	tablesFilter: ['humble-steam-sync_*']
} satisfies Config;
