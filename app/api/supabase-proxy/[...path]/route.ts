import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
    const realSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!realSupabaseUrl) {
        return new Response('Supabase URL not configured', { status: 500 });
    }

    const path = params.path.join('/');
    const searchParams = req.nextUrl.searchParams.toString();
    const query = searchParams ? `?${searchParams}` : '';

    const targetUrl = `${realSupabaseUrl}/${path}${query}`;

    // Copy headers from the incoming request
    const headers = new Headers(req.headers);

    // Remove headers that should not be forwarded or might break the request
    headers.delete('host');
    headers.delete('connection');
    headers.delete('keep-alive');
    headers.delete('transfer-encoding');
    // Remove content-encoding so we don't forward compressed bodies
    headers.delete('content-encoding');

    try {
        const fetchOptions: RequestInit = {
            method: req.method,
            headers,
            redirect: 'manual',
            cache: 'no-store'
        };

        // Forward the body if it's not a GET/HEAD request.
        // CRITICAL FIX: Buffer the body fully as an ArrayBuffer before forwarding.
        // Passing req.body as a ReadableStream can silently fail on some Android phones
        // and mobile networks (body arrives fragmented or empty), causing Supabase to
        // reject the signup request with a cryptic "error saving new user" message.
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            try {
                const bodyBuffer = await req.arrayBuffer();
                if (bodyBuffer.byteLength > 0) {
                    fetchOptions.body = bodyBuffer;
                    headers.set('content-length', String(bodyBuffer.byteLength));
                }
            } catch (bodyErr: any) {
                console.error('[Supabase Proxy] Failed to read request body:', bodyErr.message);
            }
        }

        const response = await fetch(targetUrl, fetchOptions);

        // Copy headers back from Supabase response
        const outHeaders = new Headers(response.headers);

        // Let Vercel/Next.js handle encoding — don't forward compressed responses
        outHeaders.delete('content-encoding');
        outHeaders.delete('transfer-encoding');

        // Buffer the response body fully to avoid partial-read issues on slow connections
        const responseBody = await response.arrayBuffer();

        return new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: outHeaders
        });
    } catch (error: any) {
        console.error('[Supabase Proxy] Network Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
