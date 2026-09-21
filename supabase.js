const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xsipacivhrjdjardaqfn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaXBhY2l2aHJqZGphcmRhcWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODQ5MzcsImV4cCI6MjEwNTU2MDkzN30.mtB4ODKlmmVZwdFZVofUqt4Yn0BwJuWDuX9VWKv28aQ';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
