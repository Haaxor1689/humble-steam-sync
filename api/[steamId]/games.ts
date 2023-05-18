import type { RequestContext } from '@vercel/edge';

export const config = {
  runtime: 'edge'
};

export default function MyEdgeFunction(
  request: Request,
  context: RequestContext
) {
  return new Response(`Hello, from ${request.url} I'm an Edge Function!`);
}
