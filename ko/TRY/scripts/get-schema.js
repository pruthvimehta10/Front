const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'categories' });
    if (error) {
        console.log('RPC failed, trying direct query on information_schema');
        const { data: cols, error: err2 } = await supabase.from('information_schema.columns').select('column_name, data_type, is_nullable').eq('table_name', 'categories');
        console.log('Error:', err2);
        console.log('Columns:', cols);
    } else {
        console.log('Columns from RPC:', data);
    }
}
getSchema();
