const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// Root route
router.get('/', (req, res) => {
  res.json({ message: 'URL Shortener API is running. Visit /api-docs for Swagger documentation.' });
});

// Public route: GET /:shortUrl - redirect and track click
router.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    // Find the URL
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('short_url', shortUrl)
      .single();

    if (urlError || !url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Simple device detection from user agent
    const userAgent = req.get('User-Agent') || '';
    let device = 'unknown';
    if (/mobile/i.test(userAgent)) {
      device = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      device = 'tablet';
    } else {
      device = 'desktop';
    }

    // Track click
    const { error: clickError } = await supabase
      .from('clicks')
      .insert({
        url_id: url.id,
        city: null, // TODO: implement IP geolocation for city
        device,
        country: null, // TODO: implement IP geolocation for country
      });

    if (clickError) {
      console.error('Error tracking click:', clickError);
    }

    // Redirect
    res.redirect(url.original_url);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
