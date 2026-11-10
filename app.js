const express = require('express');
const carrelsRouter = require('./routes/carrels');
const studentsRouter = require('./routes/students');
const bookingsRouter = require('./routes/bookings');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware Configuration
// ============================================================================
app.use(express.json());
app.set('json spaces', 2);

// ============================================================================
// Root / Health Check Route
// ============================================================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to StudySpot Cafe API',
    status: 'Server active',
    team: {
      member1: 'Server Setup & Carrels CRUD APIs',
      member2: 'SQLite Database & Schema Design',
      member3: 'Bookings APIs & Validation',
      member4: 'Top Carrels & Integration Testing',
    },
    endpoints: {
      carrels: {
        getAll: 'GET /carrels',
        getTop: 'GET /carrels/top',
        getOne: 'GET /carrels/:id',
        create: 'POST /carrels',
        update: 'PUT /carrels/:id',
        delete: 'DELETE /carrels/:id',
      },
      students: {
        getAll: 'GET /students',
        getOne: 'GET /students/:id',
        create: 'POST /students',
      },
      bookings: {
        getAll: 'GET /bookings',
        getDetails: 'GET /bookings/details',
        getDetailsById: 'GET /bookings/details/:id',
        getOne: 'GET /bookings/:id',
        create: 'POST /bookings',
        delete: 'DELETE /bookings/:id',
      },
    },
  });
});

// ============================================================================
// Route Mounting
// ============================================================================
app.use('/carrels', carrelsRouter);
app.use('/students', studentsRouter);
app.use('/bookings', bookingsRouter);

// ============================================================================
// 404 Not Found Handler for Unmatched Routes
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl,
  });
});

// ============================================================================
// Global Error Handler
// ============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

// ============================================================================
// Server Listening Configuration
// ============================================================================
const startServer = async () => {
  try {
    // Establish database connection interface
    await initializeDatabase();

    const server = app.listen(PORT, () => {
      console.log(`StudySpot Cafe server running at: http://localhost:${PORT}`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start server when executed directly (node app.js)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
