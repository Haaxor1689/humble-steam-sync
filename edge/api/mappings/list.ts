import db from '../_db';

export const config = {
  runtime: 'edge'
};

export default async function profile() {
  try {
    const suggestions = await db.execute(
      'SELECT steam_name, humble_name FROM suggestions WHERE approved = true',
      [],
      { as: 'object' }
    );
    return new Response(JSON.stringify(suggestions.rows));
  } catch (e) {
    return new Response(
      JSON.stringify({
        message: e instanceof Error ? e.message : 'Unexpected error ocurred'
      }),
      { status: 500 }
    );
  }
}
