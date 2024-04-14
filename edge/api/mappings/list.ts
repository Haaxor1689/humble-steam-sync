import { db } from '../db/_db';

export const config = {
	runtime: 'edge'
};

export default async function list() {
	try {
		const suggestions = await db.query.suggestions.findMany({
			columns: { approved: false }
		});
		return new Response(JSON.stringify(suggestions));
	} catch (e) {
		return new Response(
			JSON.stringify({
				message: e instanceof Error ? e.message : 'Unexpected error ocurred'
			}),
			{ status: 500 }
		);
	}
}
