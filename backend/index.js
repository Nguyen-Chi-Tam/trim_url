// require('dotenv').config(); // Disable for Cloudflare Workers (no filesystem)
const express = require('express');
const cors = require('cors');
// const swaggerUi = require('swagger-ui-express'); // Disabled for Workers
// const yaml = require('yamljs'); // Disabled for Workers
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Import routes
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const clickRoutes = require('./routes/click');
const bioRoutes = require('./routes/bio');
const bioLinkRoutes = require('./routes/bioLink');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

const app = express();
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
// Only enable express.json() when running in a Node/Express environment (not in Cloudflare Workers)
if (process.env.NODE_ENV !== 'worker') {
  app.use(express.json());
}

// Swagger setup (disabled on Workers)
// Note: Serving swagger UI relies on Node-specific modules and body-parser.
// Consider hosting docs separately or enabling only in a Node environment.
// const swaggerDocument = yaml.load('./swagger.yaml');
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/', publicRoutes); // Public redirection route
app.use('/api/auth', authRoutes);
app.use('/api/bios', authenticateToken, bioRoutes); // Protected
app.use('/api/bio-links', authenticateToken, bioLinkRoutes); // Protected
app.use('/api/urls', authenticateToken, urlRoutes); // Protected
app.use('/api/clicks', authenticateToken, clickRoutes); // Protected
app.use('/api/admin', adminRoutes); // Admin routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Remove the server start logic
/*
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});
*/

// If this file is run directly (node index.js), start the server. When imported (e.g. tests or Workers), don't start.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app; // Export the app
