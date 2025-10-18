const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /api/admin/users - List all users (id, name, email)
router.get('/users', async (req, res) => {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // Map to only id, name, email
    const userList = users.map(u => ({
      id: u.id,
      name: u.user_metadata?.full_name || u.user_metadata?.name || '',
      email: u.email
    }));
    res.json(userList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
