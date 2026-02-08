const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugCategories() {
    const { data, error } = await supabase.from('categories').select('*').limit(1);
    console.log('Error:', error);
    console.log('Data:', data);
    if (data && data.length > 0) {
        console.log('Keys:', Object.keys(data[0]));
    }
}
debugCategories();
