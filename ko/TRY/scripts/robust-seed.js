const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Attempting to find any category ---');
    const { data: cat } = await supabase.from('categories').select('*').limit(1);
    console.log('Any category:', cat);

    const categories = [
        { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Additive', description: 'Additive' },
        { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', name: 'Electronic', description: 'Electronic' },
        { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', name: 'Subtractive', description: 'Subtractive' }
    ];

    for (const c of categories) {
        console.log(`Inserting ${c.name}...`);
        const { error } = await supabase.from('categories').insert(c);
        if (error) {
            console.error(`Failed: ${error.message}`);
            console.log('Trying without ID...');
            const { error: error2 } = await supabase.from('categories').insert({ name: c.name, description: c.description });
            if (error2) console.error(`Failed again: ${error2.message}`);
        } else {
            console.log(`Success: ${c.name}`);
        }
    }
}
run();
