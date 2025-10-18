const express = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /api/clicks/:urlId - get clicks for a specific URL (analytics)
router.get('/:urlId', async (req, res) => {
  const { urlId } = req.params;
  const userId = req.user.userId;

  try {
    // First, verify the URL belongs to the user
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('id')
      .eq('id', urlId)
      .eq('user_id', userId)
      .single();

    if (urlError || !url) {
      return res.status(404).json({ error: 'URL not found or access denied' });
    }

    // Get clicks for the URL
    const { data: clicks, error: clicksError } = await supabase
      .from('clicks')
      .select('*')
      .eq('url_id', urlId)
      .order('created_at', { ascending: false });

    if (clicksError) {
      return res.status(400).json({ error: clicksError.message });
    }

    res.json(clicks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
