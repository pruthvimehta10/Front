const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listCourses() {
    const { data: courses, error: courseError } = await supabase.from('courses').select('id, title, category_id');
    const { data: categories, error: catError } = await supabase.from('categories').select('id, name');

    console.log('Categories:', categories);
    console.log('Courses:', courses);
}
listCourses();
