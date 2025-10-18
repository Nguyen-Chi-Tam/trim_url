import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { cors } from 'hono/cors';

// Embedded OpenAPI (Swagger) spec so Workers can serve it without filesystem access
const OPENAPI_YAML = `openapi: 3.0.0
info:
  title: URL Shortener API
  version: 1.0.0
  description: API for a URL shortening service, with endpoints for a custom authentication server and for direct interaction with the Supabase REST API.

servers:
  # Primary: Cloudflare Worker endpoint
  - url: https://url-shortener-backend.fegeltronics.workers.dev
    description: Cloudflare Worker
  # Supabase REST endpoint (for direct table access examples)
  - url: https://ruvgkxrldmguhwvdbgrf.supabase.co/rest/v1
    description: Supabase Server

components:
  securitySchemes:
    # New scheme for the Supabase API Key
    supabaseKey:
      type: apiKey
      in: header
      name: apikey
    # Kept bearerAuth for your custom server endpoints
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    # Schemas remain unchanged as they model the data correctly
    users:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
    bio_page:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        title:
          type: string
        url:
          type: string
        description:
          type: string
        profile_pic:
          type: string
        background:
          type: string
        created_at:
          type: string
          format: date-time
    bio_urls:
      type: object
      properties:
        id:
          type: string
        bio_id:
          type: string
        url_id:
          type: string
        created_at:
          type: string
          format: date-time
    urls:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        original_url:
          type: string
        short_url:
          type: string
        custom_url:
          type: string
        title:
          type: string
        qr_code:
          type: string
        is_temporary:
          type: boolean
        expiration_time:
          type: string
          format: date-time
        profile_pic:
          type: string
        created_at:
          type: string
          format: date-time
    clicks:
      type: object
      properties:
        id:
          type: string
        url_id:
          type: string
        created_at:
          type: string
          format: date-time
        city:
          type: string
          nullable: true
        device:
          type: string
        country:
          type: string
          nullable: true
    Error:
      type: object
      properties:
        error:
          type: string

paths:
  # --- Custom Server Endpoints (Auth, Redirects) ---
  
  /api/auth/signup:
    # This endpoint belongs to your custom server, so it remains unchanged.
    summary: Sign up a new user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [email, password]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                minLength: 6
    responses:
      '201':
        description: User created successfully
      '400':
        description: Bad request

  /api/auth/login:
    # This endpoint belongs to your custom server, so it remains unchanged.
    summary: Log in a user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [email, password]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
    responses:
      '200':
        description: Login successful
      '400':
        description: Bad request
  
  /{shortUrl}:
    # This redirect endpoint likely belongs to your custom server.
    summary: Redirect to original URL
    parameters:
      - name: shortUrl
        in: path
        required: true
        schema:
          type: string
    responses:
      '302':
        description: Redirect to original URL
      '404':
        description: URL not found

  # --- Supabase Direct Table Access Endpoints ---

  /bio_page:
    get:
      summary: Get bio pages (direct Supabase query)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          # CHANGED: More explicit instructions
          description: "**IMPORTANT:** You must include the 'eq.' prefix. To find ID 9, you must enter 'eq.9'."
          required: false # Making it optional so the user can fetch all pages
          schema:
            type: string
            # CHANGED: A clear example of the required format
            example: "eq.9"
        - name: select
          in: query
          description: 'Fields to return. Use * for all fields.'
          schema:
            type: string
            example: "*"
      responses:
        '200':
          description: A list of bio pages
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/bio_page'
    post:
      summary: Create a new bio page (direct Supabase insert)
      security:
        - supabaseKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              # The request body should be a single bio_page object
              $ref: '#/components/schemas/bio_page'
      responses:
        '201':
          description: Bio page created
        '400':
          description: Bad request

    patch:
      # REWRITTEN: Changed PUT to PATCH, which is used for Supabase updates.
      summary: Update a bio page (direct Supabase update)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the page to update. Example: "eq.9"'
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/bio_page'
      responses:
        '200':
          description: Bio page updated
        '404':
          description: Bio page not found

    delete:
      summary: Delete a bio page (direct Supabase delete)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the page to delete. Example: "eq.9"'
          schema:
            type: string
      responses:
        '204':
          description: Bio page successfully deleted (No Content)
        '404':
          description: Bio page not found

  /bio_urls:
    get:
      summary: Get bio URLs (direct Supabase query)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          description: "**IMPORTANT:** You must include the 'eq.' prefix. To find ID 9, you must enter 'eq.9'."
          required: false
          schema:
            type: string
            example: "eq.9"
        - name: bio_id
          in: query
          description: "Filter by bio page ID. Use 'eq.' prefix, e.g., 'eq.9' to get all bio URLs for bio page ID 9."
          required: false
          schema:
            type: string
            example: "eq.9"
        - name: select
          in: query
          description: 'Fields to return. Use * for all fields.'
          schema:
            type: string
            example: "*"
      responses:
        '200':
          description: A list of bio URLs
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/bio_urls'
    post:
      summary: Create a new bio URL (direct Supabase insert)
      security:
        - supabaseKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/bio_urls'
      responses:
        '201':
          description: Bio URL created
        '400':
          description: Bad request

    patch:
      summary: Update a bio URL (direct Supabase update)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the bio URL to update. Example: "eq.9"'
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/bio_urls'
      responses:
        '200':
          description: Bio URL updated
        '404':
          description: Bio URL not found

    delete:
      summary: Delete a bio URL (direct Supabase delete)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the bio URL to delete. Example: "eq.9"'
          schema:
            type: string
      responses:
        '204':
          description: Bio URL successfully deleted (No Content)
        '404':
          description: Bio URL not found

  /urls:
    get:
      summary: Get URLs (direct Supabase query)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          description: "**IMPORTANT:** You must include the 'eq.' prefix. To find ID 9, you must enter 'eq.9'."
          required: false
          schema:
            type: string
            example: "eq.9"
        - name: select
          in: query
          description: 'Fields to return. Use * for all fields.'
          schema:
            type: string
            example: "*"
      responses:
        '200':
          description: A list of URLs
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/urls'
    post:
      summary: Create a new URL (direct Supabase insert)
      security:
        - supabaseKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/urls'
      responses:
        '201':
          description: URL created
        '400':
          description: Bad request

    patch:
      summary: Update a URL (direct Supabase update)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the URL to update. Example: "eq.9"'
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/urls'
      responses:
        '200':
          description: URL updated
        '404':
          description: URL not found

    delete:
      summary: Delete a URL (direct Supabase delete)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the URL to delete. Example: "eq.9"'
          schema:
            type: string
      responses:
        '204':
          description: URL successfully deleted (No Content)
        '404':
          description: URL not found

  /clicks:
    get:
      summary: Get clicks (direct Supabase query)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          description: "**IMPORTANT:** You must include the 'eq.' prefix. To find ID 9, you must enter 'eq.9'."
          required: false
          schema:
            type: string
            example: "eq.9"
        - name: url_id
          in: query
          description: "Filter by URL ID. Use 'eq.' prefix, e.g., 'eq.9' to get all clicks for URL ID 9."
          required: false
          schema:
            type: string
            example: "eq.9"
        - name: select
          in: query
          description: 'Fields to return. Use * for all fields.'
          schema:
            type: string
            example: "*"
      responses:
        '200':
          description: A list of clicks
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/clicks'
    post:
      summary: Create a new click (direct Supabase insert)
      security:
        - supabaseKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/clicks'
      responses:
        '201':
          description: Click created
        '400':
          description: Bad request

    patch:
      summary: Update a click (direct Supabase update)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the click to update. Example: "eq.9"'
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/clicks'
      responses:
        '200':
          description: Click updated
        '404':
          description: Click not found

    delete:
      summary: Delete a click (direct Supabase delete)
      security:
        - supabaseKey: []
      parameters:
        - name: id
          in: query
          required: true
          description: 'The ID of the click to delete. Example: "eq.9"'
          schema:
            type: string
      responses:
        '204':
          description: Click successfully deleted (No Content)
        '404':
          description: Click not found
`;

const app = new Hono();

// CORS for API routes
app.use('/api/*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Serve OpenAPI YAML
app.get('/api/openapi.yaml', (c) => {
  return c.newResponse(OPENAPI_YAML, {
    headers: { 'content-type': 'text/yaml; charset=utf-8' },
  });
});

// Serve Swagger UI using CDN, pointing to our YAML
app.get('/api/docs', (c) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>URL Shortener API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
      <style>body { margin:0; } #swagger-ui { height: 100vh; }</style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <script>
        window.ui = SwaggerUIBundle({
          url: '/api/openapi.yaml',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout'
        });
      </script>
    </body>
  </html>`;
  return c.html(html);
});

// --- API routes (register BEFORE short-link routes to avoid interception) ---
app.get('/api/admin/users', async (c) => {
  try {
    const supabaseUrl = c.env.SUPABASE_URL;
    const serviceRole = c.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRole) {
      return c.json({ error: 'Server not configured' }, 500);
    }
    const adminClient = createClient(supabaseUrl, serviceRole);
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();
    if (error) return c.json({ error: error.message }, 500);
    const userList = users.map(u => ({
      id: u.id,
      name: u.user_metadata?.full_name || u.user_metadata?.name || '',
      email: u.email,
    }));
    return c.json(userList);
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.all('/api/*', (c) => c.json({ error: 'API endpoint not implemented on Workers' }, 501));

// Health/root route
app.get('/', (c) => c.json({ message: 'URL Shortener API is running.' }));

// Public redirect route: GET /:shortUrl - redirect and track click
app.get('/:shortUrl', async (c) => {
  const { shortUrl } = c.req.param();
  try {
    // Create Supabase client from Workers env bindings
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseKey = c.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the URL
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('short_url', shortUrl)
      .single();

    if (urlError || !url) {
      return c.json({ error: 'URL not found' }, 404);
    }

    // Simple device detection from user agent
    const userAgent = c.req.header('User-Agent') || '';
    let device = 'unknown';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    else if (/tablet/i.test(userAgent)) device = 'tablet';
    else device = 'desktop';

    // Track click (best-effort)
    try {
      const { error: clickError } = await supabase
        .from('clicks')
        .insert({
          url_id: url.id,
          city: null,
          device,
          country: null,
        });
      if (clickError) console.error('Error tracking click:', clickError);
    } catch (_) {}

    // Redirect
    return c.redirect(url.original_url, 302);
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Public redirect route with id + short segment to match UI links: /:id/:shortUrl
app.get('/:id/:shortUrl', async (c) => {
  const { shortUrl } = c.req.param();
  try {
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseKey = c.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('short_url', shortUrl)
      .single();

    if (urlError || !url) {
      return c.json({ error: 'URL not found' }, 404);
    }

    const userAgent = c.req.header('User-Agent') || '';
    let device = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

    try {
      const { error: clickError } = await supabase
        .from('clicks')
        .insert({ url_id: url.id, city: null, device, country: null });
      if (clickError) console.error('Error tracking click:', clickError);
    } catch (_) {}

    return c.redirect(url.original_url, 302);
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// (API routes are registered above)

export default app;
