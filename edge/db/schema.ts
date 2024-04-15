import { integer, sqliteTableCreator, text } from 'drizzle-orm/sqlite-core';

export const sqliteTable = sqliteTableCreator(
	name => `humble-steam-sync_${name}`
);

export const suggestions = sqliteTable('suggestions', {
	steam_name: text('steam_name', { length: 255 }).notNull(),
	humble_name: text('humble_name', { length: 255 }).notNull(),
	approved: integer('approved', { mode: 'boolean' })
		.default(0 as never)
		.notNull()
});
