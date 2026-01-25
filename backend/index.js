const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Check Environment Variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}

// Connect to Database
connectDB();

// Middleware
// Middleware
app.use(cors()); // Allow all origins to fix CORS issues in production
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', require('./routes/businessRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/claims', require('./routes/claimRoutes'));

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    timestamp: new Date(),
    env: {
      jwt_secret_configured: !!process.env.JWT_SECRET,
      mongo_uri_configured: !!process.env.MONGO_URI,
      frontend_url: process.env.FRONTEND_URL
    },
    db_state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
