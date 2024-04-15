import { db } from '../../db/';
import { handler } from '../../helpers';

export const config = {
	runtime: 'edge'
};

export default handler(async () => {
	const suggestions = await db.query.suggestions.findMany({
		columns: { approved: false }
	});
	return new Response(JSON.stringify(suggestions));
});
