const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const passwordRoutes = require('./routes/passwords');
const taskRoutes = require('./routes/tasks');
const videoRoutes = require('./routes/videos');
const websiteRoutes = require('./routes/websites');
const searchRoutes = require('./routes/search');
const reminderRoutes = require('./routes/reminders');
const aiRoutes = require('./routes/ai');
const noteRoutes = require('./routes/notes');
const collectionRoutes = require('./routes/collections');
const statsRoutes = require('./routes/stats');
const graphRoutes = require('./routes/graph');
const reviewRoutes = require('./routes/review');
const { startReminderScheduler } = require('./services/reminderService');
const { sanitizeRequest, validateOrigin, globalLimiter, aiLimiter } = require('./middleware/security');

// Initialize Express app
const app = express();

// Trust the first proxy hop so req.ip is correct behind reverse proxies
// (used by rate limiting). Safe because only the immediate proxy is trusted.
app.set('trust proxy', 1);

// Security headers. The CSP below protects the React build when this server
// serves it in production; the Vercel deployment sets the same policy in
// vercel.json — keep both in sync.
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // React inline styles + Google Fonts CSS
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
      workerSrc: ["'self'", 'blob:'],
      manifestSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"]
    }
  }
}));

// Middleware
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  credentials: true
}));
// Bounded request bodies prevent memory-exhaustion abuse
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Security: strip NoSQL injection operators ($gt, $where, dotted keys) from
// body/query/params, and block state-changing requests from unknown origins
// (CSRF defense-in-depth; Bearer-token auth means no cookies are involved).
app.use(sanitizeRequest);
app.use(validateOrigin);

// Per-IP abuse cap across the whole API. Auth routes keep their own stricter
// limits; AI endpoints get a tighter one below (they hit paid external APIs).
app.use('/api', globalLimiter);

// Fail fast in production if required secrets are missing
if (process.env.NODE_ENV === 'production') {
  ['JWT_SECRET', 'ENCRYPTION_KEY', 'MONGODB_URI'].forEach((key) => {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      process.exit(1);
    }
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/remember')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/review', reviewRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ReMember API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  // Periodic email reminders (no-op unless RESEND_API_KEY is configured)
  startReminderScheduler();
});

module.exports = app;
