import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmurxgwnsrbvdtrpifin.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdXJ4Z3duc3JidmR0cnBpZmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDUwMTQsImV4cCI6MjA5MTQ4MTAxNH0.5SCZtvvgVfUhBbI8IBh-ouHExtn0J2a9X4vHLwISubE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
