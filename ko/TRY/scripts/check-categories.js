const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'categories' });
    // If rpc doesn't exist, try another way.
    console.log('Schema info:', data, error);
}

async function tryNormalSelect() {
    const { data, error } = await supabase.from('categories').select('*').limit(1);
    console.log('Categories data:', data, error);
}

tryNormalSelect();
