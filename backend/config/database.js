// Database configuration using Supabase
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
    console.error('❌ FATAL: SUPABASE_URL environment variable is missing');
    console.error('Please set it in your Vercel environment variables');
}

if (!SUPABASE_KEY) {
    console.error('❌ FATAL: SUPABASE_KEY environment variable is missing');
    console.error('Please set it in your Vercel environment variables');
}

if (!SUPABASE_SERVICE_KEY) {
    console.error('⚠️  WARNING: SUPABASE_SERVICE_KEY environment variable is missing');
    console.error('Using SUPABASE_KEY as fallback (may have limited permissions)');
}

// Create Supabase client for general use
const supabase = SUPABASE_URL && SUPABASE_KEY 
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY)
    : null;

// Helper to check if database is configured
function isDatabaseConfigured() {
    return !!(SUPABASE_URL && SUPABASE_KEY);
}

// Helper to throw error if database is not configured
function requireDatabase() {
    if (!isDatabaseConfigured()) {
        throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
    }
}

module.exports = {
    supabase,
    supabaseAdmin,
    isDatabaseConfigured,
    requireDatabase
};
