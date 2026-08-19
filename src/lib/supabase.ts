import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjwzqafnspaeuwgnxnyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqd3pxYWZuc3BhZXV3Z254bnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjA1MTIsImV4cCI6MjEwMjY5NjUxMn0.zyNh80e-JPCqSgPiIuwSnfYCOuZM4XvQatf4fBbWB2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
