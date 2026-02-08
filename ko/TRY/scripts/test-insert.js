const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    const { data, error } = await supabase.from('categories').insert({
        name: 'Test Category',
        description: 'Testing insert'
    }).select();
    console.log('Error:', error);
    console.log('Data:', data);
}
testInsert();
