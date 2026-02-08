const { createClient } = require('@supabase/supabase-js');
const { SignJWT } = require('jose');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateToken() {
    const secret = new TextEncoder().encode(process.env.EXTERNAL_JWT_SECRET);
    const jwt = await new SignJWT({
        sub: 'test-user-id',
        role: 'admin',
        email: 'test@example.com'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
    return jwt;
}

async function testVideoCreation() {
    console.log('--- Testing Video Creation via Backend API ---');

    try {
        // 1. Get a course
        const { data: courses } = await supabase.from('courses').select('id').limit(1);
        if (!courses || courses.length === 0) {
            console.error('No courses found. Cannot test video creation.');
            return;
        }
        const courseId = courses[0].id;
        console.log(`Using Course ID: ${courseId}`);

        // 2. Prepare payload
        const payload = {
            title: `Debug Video ${Date.now()}`,
            url: `https://test.com/video-${Date.now()}.mp4`,
            courseId: courseId
        };
        console.log('Sending payload:', payload);

        // 2.5 Generate Token
        const token = await generateToken();
        console.log('Generated Token');

        // 3. Call Backend API
        const response = await fetch('http://localhost:4000/api/video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();
        console.log('API Response Status:', response.status);
        console.log('API Response Data:', responseData);

        if (!response.ok) {
            console.error('API call failed.');
            return;
        }

        const topicId = responseData.data.id; // From 'topics' insert result
        console.log(`Created Topic ID: ${topicId}`);

        // 4. Check DB Tables
        console.log('Checking "topics" table...');
        const { data: topic } = await supabase.from('topics').select('*').eq('id', topicId).single();
        console.log('Topic Record:', topic ? 'Found' : 'MISSING');

        console.log('Checking "videos" table...');
        // We expect a record with topic_id = topicId
        const { data: video, error: videoError } = await supabase.from('videos').select('*').eq('topic_id', topicId).single();

        if (video) {
            console.log('✅ Video Record Found:', video);
        } else {
            console.error('❌ Video Record MISSING in "videos" table!');
            if (videoError) console.error('Supabase Error:', videoError);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testVideoCreation();
