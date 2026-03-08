import { z } from 'zod';

export const Item = z.tuple([z.string(), z.number()]);
export type Item = z.infer<typeof Item>;

export const UserData = z.object({
	rgOwnedApps: z.array(z.number()),
	rgWishlist: z.array(z.number()),
	rgIgnoredApps: z.preprocess(
		v => (v && typeof v === 'object' ? Object.keys(v).map(Number) : []),
		z.array(z.number())
	),
	rgRecommendedApps: z.array(z.number())
});
