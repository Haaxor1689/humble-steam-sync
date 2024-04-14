import { db } from '../db/_db';
import { SuggestionSchema } from '../../../src/worker/schemas';
import { suggestions } from '../db/_schema';

export const config = {
	runtime: 'edge'
};

export default async function suggest(request: Request) {
	try {
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
	} catch (e) {
		console.log(e);

		return new Response(
			JSON.stringify({
				status: 'error',
				message: e instanceof Error ? e.message : 'Unexpected error'
			}),
			{ status: 500 }
		);
	}
}
