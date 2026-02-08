// Fantasy Rugby League - Backend Server
// Main Express application entry point

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for Vercel
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview and production domains
    if (origin.includes('vercel.app') || 
        origin === 'http://localhost:3000' || 
        origin === 'http://localhost:3001') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Import routes
const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');
const teamsRoutes = require('./routes/teams');
const transfersRoutes = require('./routes/transfers');
const leaguesRoutes = require('./routes/leagues');
const adminRoutes = require('./routes/admin');
const gameweeksRoutes = require('./routes/gameweeks');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gameweeks', gameweeksRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Fantasy Rugby League API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            players: '/api/players',
            teams: '/api/teams',
            transfers: '/api/transfers',
            leagues: '/api/leagues',
            admin: '/api/admin',
            gameweeks: '/api/gameweeks'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// For Vercel serverless, export the app instead of listening
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🏉 Fantasy Rugby League API running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
}

module.exports = app;
