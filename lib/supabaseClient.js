import { createClient } from '@supabase/supabase-js';

const supabaseUrl = https://ymbiqjxywjkybjmgkcyw.supabase.co;
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmlxanh5d2preWJqbWdrY3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MzY5NTEsImV4cCI6MjA1ODUxMjk1MX0.4MnEX2BUrrPgQgx5VTkq_qSfdkn2hxZ8TuztMtvfjsQ;
export const supabase = createClient(supabaseUrl, supabaseKey);
