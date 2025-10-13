const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    message: 'Kerala Horizon Backend is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend API is working',
    data: {
      version: '1.0.0',
      environment: 'development'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kerala Horizon Backend Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
});

// Handle server errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});





