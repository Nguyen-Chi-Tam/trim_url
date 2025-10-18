// require('dotenv').config(); // Disable for Cloudflare Workers (no filesystem)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description: 'API documentation for URL Shortener backend',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
