// casomer.com is the relay (BUSINESS 5.3, 5.5): this Worker serves the
// static site and forwards a handful of /api routes to Casomer Cloud,
// which holds the signing key and the registry. Nothing here decides
// anything; the source is open, so it carries no secret beyond the
// relay token that Cloudflare injects at runtime.
//
// wrangler.jsonc binds: ASSETS (the dist folder), CLOUD_ORIGIN (a var),
// CLOUD_RELAY_TOKEN (a secret: wrangler secret put CLOUD_RELAY_TOKEN).

interface Env
{
    readonly ASSETS: { fetch: ( request: Request ) => Promise<Response> };
    readonly CLOUD_ORIGIN: string;
    readonly CLOUD_RELAY_TOKEN: string;
}

// Public routes on casomer.com and where they land on cloud.
const routes: readonly { readonly pattern: RegExp; readonly methods: readonly string[]; readonly target: ( match: RegExpExecArray ) => string; readonly cors?: boolean }[] = [
    { pattern: /^\/api\/keys\/verify$/, methods: [ 'POST' ], target: () => '/v1/keys/verify' },
    { pattern: /^\/api\/checkout$/, methods: [ 'POST' ], target: () => '/v1/checkout', cors: true },
    { pattern: /^\/api\/checkout\/([^/]+)$/, methods: [ 'GET' ], target: ( match ) => `/v1/checkout/${match[ 1 ]}`, cors: true },
    { pattern: /^\/api\/licenses\/activate$/, methods: [ 'POST' ], target: () => '/v1/licenses/activate' },
    { pattern: /^\/api\/supporters\/wall$/, methods: [ 'GET', 'POST', 'DELETE' ], target: () => '/v1/supporters/wall', cors: true },
    { pattern: /^\/api\/supporters\/([^/]+)\/avatar$/, methods: [ 'GET' ], target: ( match ) => `/v1/supporters/${match[ 1 ]}/avatar`, cors: true },
];

const BODY_LIMIT = 512 * 1024;

function corsHeaders (): Record<string, string>
{
    return {
        'access-control-allow-origin': 'https://casomer.com',
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type',
    };
}

export default {
    async fetch ( request: Request, env: Env ): Promise<Response>
    {
        const url = new URL( request.url );

        if ( !url.pathname.startsWith( '/api/' ) ) { return env.ASSETS.fetch( request ); }

        for ( const route of routes )
        {
            const match = route.pattern.exec( url.pathname );

            if ( match === null ) { continue; }

            if ( request.method === 'OPTIONS' && route.cors === true )
            {
                return new Response( null, { status: 204, headers: corsHeaders() } );
            }

            if ( !route.methods.includes( request.method ) )
            {
                return Response.json( { error: 'method not allowed' }, { status: 405 } );
            }

            const length = Number( request.headers.get( 'content-length' ) ?? '0' );

            if ( length > BODY_LIMIT ) { return Response.json( { error: 'body too large' }, { status: 413 } ); }

            const body = request.method === 'GET' ? undefined : await request.text();

            if ( body !== undefined && body.length > BODY_LIMIT ) { return Response.json( { error: 'body too large' }, { status: 413 } ); }

            const upstream = await fetch( `${env.CLOUD_ORIGIN}${route.target( match )}`, {
                method: request.method,
                headers: {
                    authorization: `Bearer ${env.CLOUD_RELAY_TOKEN}`,
                    'content-type': 'application/json',
                    'x-forwarded-for': request.headers.get( 'cf-connecting-ip' ) ?? '',
                },
                ...( body === undefined ? {} : { body } ),
            } );

            const headers = new Headers( { 'cache-control': 'no-store' } );
            const type = upstream.headers.get( 'content-type' );

            if ( type !== null ) { headers.set( 'content-type', type ); }
            if ( route.cors === true ) { for ( const [ name, value ] of Object.entries( corsHeaders() ) ) { headers.set( name, value ); } }
            if ( url.pathname.endsWith( '/avatar' ) ) { headers.set( 'cache-control', 'public, max-age=3600' ); }

            return new Response( upstream.body, { status: upstream.status, headers } );
        }

        return Response.json( { error: 'no such route' }, { status: 404 } );
    },
};
