// Database configuration using Supabase
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
let supabaseAdmin = null;

try {
  if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL missing');
  }
  
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_KEY missing');
  }
  
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_KEY missing - using SUPABASE_KEY as fallback');
  }
  
  // Create Supabase client for general use
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  
  // Create Supabase admin client (bypasses RLS)
  if (SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_KEY)) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY);
  }
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
}

// Helper to check if database is configured
function isDatabaseConfigured() {
    return !!(supabase && supabaseAdmin);
}

// Helper to throw error if database is not configured
function requireDatabase() {
    if (!isDatabaseConfigured()) {
        throw new Error('Database not configured. Check environment variables.');
    }
}

module.exports = {
    supabase,
    supabaseAdmin,
    isDatabaseConfigured,
    requireDatabase
};
