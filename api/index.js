// Vercel Serverless Function Entry Point
// This file exports the Express app for Vercel to handle as a serverless function

const app = require('../backend/server');

// Export the Express app as a serverless function
module.exports = app;
