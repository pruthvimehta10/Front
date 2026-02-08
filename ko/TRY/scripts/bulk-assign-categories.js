const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function assignCategories() {
    const { data: categories } = await supabase.from('categories').select('id, name');
    const { data: courses } = await supabase.from('courses').select('id, title');

    if (!categories || categories.length === 0) {
        console.error('No categories found. Run seed script first.');
        return;
    }

    const additive = categories.find(c => c.name === 'Additive');
    const electronic = categories.find(c => c.name === 'Electronic');
    const subtractive = categories.find(c => c.name === 'Subtractive');

    for (const course of courses) {
        let catId = additive.id; // Default

        if (course.title.toLowerCase().includes('electron') || course.title.toLowerCase().includes('circuit')) {
            catId = electronic.id;
        } else if (course.title.toLowerCase().includes('cnc') || course.title.toLowerCase().includes('mill') || course.title.toLowerCase().includes('fabrication')) {
            catId = subtractive.id;
        } else if (course.title.toLowerCase().includes('3d') || course.title.toLowerCase().includes('print') || course.title.toLowerCase().includes('addit')) {
            catId = additive.id;
        }

        console.log(`Assigning ${course.title} to category ID: ${catId}`);
        await supabase.from('courses').update({ category_id: catId }).eq('id', course.id);
    }

    console.log('All courses assigned categories.');
}

assignCategories();
