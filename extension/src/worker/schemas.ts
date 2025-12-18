import { z } from 'zod';

export const SuggestionSchema = z
	.object({
		steam_name: z.string().min(1),
		humble_name: z.string().min(1)
	})
	.strict();
export type SuggestionSchema = z.infer<typeof SuggestionSchema>;

export const Item = z.tuple([z.string(), z.number()]);
export type Item = z.infer<typeof Item>;

export const CachedData = z.object({
	status: z.enum(['ok', 'noData']).default('ok'),
	cacheTime: z.string().nullish(),
	library: z.array(Item).default([]),
	wishlist: z.array(Item).default([]),
	ignored: z.array(Item).default([]),
	recommended: z.array(Item).default([]),
	steamName: z.string().optional(),
	steamId: z.string().optional(),
	avatar: z.string().optional(),
	store: z.boolean().optional(),
	alwaysShowTag: z.boolean().optional()
});
export type CachedData = z.infer<typeof CachedData>;
