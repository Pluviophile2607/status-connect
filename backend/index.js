const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
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

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
