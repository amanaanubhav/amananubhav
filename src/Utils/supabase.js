import { createClient } from '@supabase/supabase-js';

// Use  environment variables for safe import
// Vercel/Vite makes these variables available during the build process
const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;

// Initialize the Supabase Client
// It checks for the existence of the keys before attempting initialization.
let supabase;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Supabase initialization failed during connection attempt:", e);
        supabase = null;
    }
} else {
    // This warning is expected locally if keys are not loaded, or during deployment setup.
    console.warn("Supabase initialization skipped: Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
    supabase = null;
}

export { supabase };

// Define your table constants used in the SecureVault component
export const USERS_TABLE = 'vault_users';
export const CHAIN_TABLE = 'vault_chain';