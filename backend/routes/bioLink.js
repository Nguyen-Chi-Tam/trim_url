const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// POST /api/bio-links - create bio url link
router.post('/', async (req, res) => {
  const { bio_id, url_id } = req.body;
  const userId = req.user.userId;

  if (!bio_id || !url_id) {
    return res.status(400).json({ error: 'Bio ID and URL ID are required' });
  }

  try {
    // Verify bio belongs to user
    const { data: bio } = await supabase
      .from('bio_page')
      .select('id')
      .eq('id', bio_id)
      .eq('user_id', userId)
      .single();

    if (!bio) {
      return res.status(404).json({ error: 'Bio page not found or access denied' });
    }

    // Optionally verify url belongs to user
    const { data: urlData } = await supabase
      .from('urls')
      .select('id')
      .eq('id', url_id)
      .eq('user_id', userId)
      .single();

    if (!urlData) {
      return res.status(404).json({ error: 'URL not found or access denied' });
    }

    const { data, error } = await supabase
      .from('bio_urls')
      .insert({
        bio_id,
        url_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Fetch with joins for full response
    const { data: fullData, error: fetchError } = await supabase
      .from('bio_urls')
      .select(`
        *,
        bio_page!bio_urls_bio_id_fkey (id, title, url, description, profile_pic, background),
        urls!bio_urls_url_id_fkey (id, title, original_url, short_url)
      `)
      .eq('id', data.id)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    res.status(201).json(fullData);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bio-links - get user's bio url links (optionally filtered by bio_id)
router.get('/', async (req, res) => {
  const { bio_id } = req.query;
  const userId = req.user.userId;

  try {
    let query = supabase
      .from('bio_urls')
      .select(`
        *,
        bio_page!bio_urls_bio_id_fkey (id, title, url, description, profile_pic, background),
        urls!bio_urls_url_id_fkey (id, title, original_url, short_url, qr_code)
      `)
      .eq('bio_page.user_id', userId);

    if (bio_id) {
      query = query.eq('bio_id', bio_id);
    }

    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bio-links/:id - get specific bio url link
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const { data, error } = await supabase
      .from('bio_urls')
      .select(`
        *,
        bio_page!bio_urls_bio_id_fkey (id, title, url, description, profile_pic, background),
        urls!bio_urls_url_id_fkey (id, title, original_url, short_url, qr_code)
      `)
      .eq('id', id)
      .eq('bio_page.user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bio url link not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bio-links/:id - update bio url link (change bio_id or url_id)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { bio_id, url_id } = req.body;
  const userId = req.user.userId;

  if (!bio_id || !url_id) {
    return res.status(400).json({ error: 'Bio ID and URL ID are required for update' });
  }

  try {
    // Verify ownership
    const { data: link, error: linkError } = await supabase
      .from('bio_urls')
      .select('id, bio_page!inner(user_id)')
      .eq('id', id)
      .eq('bio_page.user_id', userId)
      .single();

    if (linkError || !link) {
      return res.status(404).json({ error: 'Bio url link not found or access denied' });
    }

    // Verify new bio and url belong to user
    const { data: newBio } = await supabase
      .from('bio_page')
      .select('id')
      .eq('id', bio_id)
      .eq('user_id', userId)
      .single();

    if (!newBio) {
      return res.status(404).json({ error: 'New bio page not found or access denied' });
    }

    const { data: newUrl } = await supabase
      .from('urls')
      .select('id')
      .eq('id', url_id)
      .eq('user_id', userId)
      .single();

    if (!newUrl) {
      return res.status(404).json({ error: 'New URL not found or access denied' });
    }

    const { data, error } = await supabase
      .from('bio_urls')
      .update({ bio_id, url_id })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({ error: error.message });
    }

    // Fetch with joins
    const { data: fullData, error: fetchError } = await supabase
      .from('bio_urls')
      .select(`
        *,
        bio_page!bio_urls_bio_id_fkey (id, title, url, description, profile_pic, background),
        urls!bio_urls_url_id_fkey (id, title, original_url, short_url, qr_code)
      `)
      .eq('id', data.id)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    res.json(fullData);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/bio-links/:id - delete bio url link
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Verify ownership
    const { data: link, error: linkError } = await supabase
      .from('bio_urls')
      .select('id, bio_page!inner(user_id)')
      .eq('id', id)
      .eq('bio_page.user_id', userId)
      .single();

    if (linkError || !link) {
      return res.status(404).json({ error: 'Bio url link not found or access denied' });
    }

    const { error } = await supabase
      .from('bio_urls')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Bio url link deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
