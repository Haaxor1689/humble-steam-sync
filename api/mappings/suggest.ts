import { DatabaseError } from '@planetscale/database';
import db, { SuggestionSchema } from '../_db';

export const config = {
  runtime: 'edge'
};

export default async function profile(request: Request) {
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

    const results = await db.execute(
      'INSERT INTO suggestions (steam_name, humble_name, approved) VALUES (:steam_name, :humble_name, false)',
      body.data
    );

    console.log({ results });

    return new Response(JSON.stringify({ status: 'created' }));
  } catch (e) {
    console.log({ e });
    if (e instanceof DatabaseError) {
      return new Response(JSON.stringify({ status: 'exists' }));
    }

    return new Response(
      JSON.stringify({
        status: 'error',
        message: e instanceof Error ? e.message : 'Unexpected error'
      }),
      { status: 500 }
    );
  }
}
