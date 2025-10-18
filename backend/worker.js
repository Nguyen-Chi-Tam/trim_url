import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS for API routes
app.use('/api/*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

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

// Placeholder for API routes (not yet ported to Workers)
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

export default app;
