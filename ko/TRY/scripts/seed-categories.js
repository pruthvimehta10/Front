const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
    { id: randomUUID(), name: 'Additive', description: 'Additive manufacturing courses including 3D printing and related technologies' },
    { id: randomUUID(), name: 'Electronic', description: 'Electronic manufacturing courses covering circuit design, PCB assembly, and electronics' },
    { id: randomUUID(), name: 'Subtractive', description: 'Subtractive manufacturing courses including CNC machining, milling, and cutting' }
];

async function seedCategories() {
    console.log('Seeding categories...');
    const { data, error } = await supabase
        .from('categories')
        .insert(categories)
        .select();

    if (error) {
        console.error('Error seeding categories:', error);
    } else {
        console.log('Categories seeded successfully:', data);
    }
}

seedCategories();
