import { connect } from '@planetscale/database';
import { z } from 'zod';

export const SuggestionSchema = z
  .object({
    steam_name: z.string().min(1),
    humble_name: z.string().min(1)
  })
  .strict();

export type SuggestionSchema = z.infer<typeof SuggestionSchema>;

const db = connect({
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

export default db;
