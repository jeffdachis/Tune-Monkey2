import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://your-project-url.supabase.co"; // <-- Replace with actual
const supabaseKey = "your-anon-key"; // <-- Replace with actual
export const supabase = createClient(supabaseUrl, supabaseKey);