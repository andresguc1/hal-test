import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Provide dummy values if missing to prevent createClient from throwing a hard crash during startup
// though functional auth will still fail as warned.
export const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : createClient('https://placeholder-project.supabase.co', 'placeholder-key');

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
        '\n⚠️  [AUTH] Supabase credentials missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
    );
    console.warn('⚠️  [AUTH] Backend authentication will fail until these are set in .env\n');
}
