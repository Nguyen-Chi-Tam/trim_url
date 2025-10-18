const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// POST /api/bios - create bio page
router.post('/', async (req, res) => {
  const { title, url, description, profile_pic, background } = req.body;
  const userId = req.user.userId;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  try {
    const { data, error } = await supabase
      .from('bio_page')
      .insert({
        user_id: userId,
        title,
        url,
        description,
        profile_pic,
        background,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bios - get user's bio pages
router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const { data, error } = await supabase
      .from('bio_page')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bios/:id - get specific bio page
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const { data, error } = await supabase
      .from('bio_page')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bio page not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bios/:id - update bio page
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, url, description, profile_pic, background } = req.body;
  const userId = req.user.userId;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  try {
    const { data, error } = await supabase
      .from('bio_page')
      .update({ 
        title,
        url,
        description,
        profile_pic,
        background 
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bio page not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/bios/:id - delete bio page
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const { error } = await supabase
      .from('bio_page')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Bio page deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// Public GET /api/bio-pages/:id - get bio page by id (no auth)
router.get('/public/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('bio_page')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bio page not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
