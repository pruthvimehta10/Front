// scripts/debug-db.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load env vars manually since we aren't using Next.js to run this
// Simple parser for .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Use service role if available to bypass RLS for debugging, otherwise anon
console.log('Connecting to:', url, 'with ANON KEY');
const supabase = createClient(url, key); // FORCE ANON KEY to test RLS

async function checkCourses() {
    console.log('--- Checking Courses Table ---');

    // Test 1: Can we select *?
    const { data: allCourses, error: error1 } = await supabase
        .from('courses')
        .select('*');

    if (error1) {
        console.error('ERROR Querying courses:', error1);
        return;
    }

    console.log(`Found ${allCourses.length} courses total.`);

    // Test 2: Check for is_published column specifically
    if (allCourses.length > 0) {
        const first = allCourses[0];
        console.log('First course keys:', Object.keys(first));
        console.log('Is is_published present?', 'is_published' in first);
        console.log('Value of is_published:', first.is_published);
    } else {
        console.log('No courses found to check structure.');
    }

    console.log('--- Checking specific homepage query ---');
    // Test 3: The exact query used in the homepage
    const { data: homeCourses, error: error2 } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true);

    if (error2) {
        console.error('ERROR Homepage query failed:', error2);
    } else {
        console.log(`Homepage query found ${homeCourses.length} published courses.`);
    }
}

checkCourses();
