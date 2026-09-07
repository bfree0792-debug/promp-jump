const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, 'config.env'), override: true });

const express = require('express');
const cors = require('cors');
const { errorMiddleware } = require('../database/error/error');
const { globalApiLimiter } = require('../middlewares/rateLimiter');

// Import routes
const authRoute = require('../routers/authRoute');
const promptRoute = require('../routers/promptRoute');
const userRoute = require('../routers/userRoute');
const categoryRoute = require('../routers/categoryRoute');
const subscriptionRoute = require('../routers/subscriptionRoute');
const announcementRoute = require('../routers/announcementRoute');
const libraryRoute = require('../routers/libraryRoute');

const app = express();

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://promp-jump.vercel.app',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-admin-id', 'x-user-role'],
  })
);

app.options('/*splat', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Supabase is used as the primary database & auth provider

// Global API rate limiting protection
app.use('/api', globalApiLimiter);

// Register routes
app.use('/api/auth', authRoute);
app.use('/api/prompts', promptRoute);
app.use('/api/users', userRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/subscriptions', subscriptionRoute);
app.use('/api/announcements', announcementRoute);
app.use('/api/library', libraryRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use(errorMiddleware);

module.exports = app;





