import { z } from 'zod';
import { db } from '../../db';
import { suggestions } from '../../db/schema';
import { handler } from '../../helpers';

const SuggestionSchema = z
	.object({
		steam_name: z.string().min(1),
		humble_name: z.string().min(1)
	})
	.strict();

export const config = {
	runtime: 'edge'
};

export default handler(async request => {
	const json = await request.json().catch(() => ({}));
	const body = SuggestionSchema.safeParse(json);
	if (body.success === false)
		return new Response(
			JSON.stringify({
				status: 'badRequest',
				message: body.error
			}),
			{ status: 400 }
		);

	await db.insert(suggestions).values(body.data);

	return new Response(JSON.stringify({ status: 'created' }));
});
