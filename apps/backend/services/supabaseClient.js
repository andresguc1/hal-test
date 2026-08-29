import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Provide dummy values if missing to prevent createClient from throwing a hard crash during startup.
// When Supabase is not configured the auth middleware and collaboration server fall back to guest mode.
export const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : createClient('https://placeholder-project.supabase.co', 'placeholder-key');

// Only signal missing Supabase credentials when the app is expected to authenticate (cloud mode).
const authRequired =
    !(process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false') &&
    process.env.HALTEST_MODE !== 'local' &&
    process.env.HAL_CLI_MODE !== 'true';

if (authRequired && (!supabaseUrl || !supabaseServiceKey)) {
    console.log(
        '[AUTH] Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Falling back to guest mode.',
    );
}
