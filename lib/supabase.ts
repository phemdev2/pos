// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safety check to prevent module crash
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase Environment Variables.\n\n" +
    "Did you create a .env.local file in the ROOT of your project?\n" +
    "It must contain:\n" +
    "NEXT_PUBLIC_SUPABASE_URL=https://bbvlxyvedmtbtmonmbtt.supabase.co" +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OIq8ly1OuW1ccf7Ri56BMA_t5GFgP3Q "+
    "If you just added it, RESTART your terminal server (Ctrl+C, then npm run dev)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);