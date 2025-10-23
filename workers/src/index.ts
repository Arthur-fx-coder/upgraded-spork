export interface Env {
  // Define your bindings here
  // Example: MY_KV: KVNamespace;
}

export default {
  async fetch(
    request: Request,
    _env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response('Hello from Cloudflare Worker!', {
        headers: {
          'content-type': 'text/plain',
        },
      });
    }

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' });
    }

    return new Response('Not Found', { status: 404 });
  },
};
