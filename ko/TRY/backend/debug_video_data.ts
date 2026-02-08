
import supabase from './lib/supabase.js';

async function debugVideoData() {
    console.log("--- DEBUGGING VIDEO DATA ---");

    // 1. Fetch all topics
    const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id, title, video_url, course_id')
        .limit(5);

    if (topicsError) {
        console.error("Error fetching topics:", topicsError);
        return;
    }

    console.log(`Found ${topics?.length} topics.`);

    for (const topic of topics || []) {
        console.log(`\nTopic: ${topic.title} (ID: ${topic.id})`);
        console.log(`  video_url: ${topic.video_url}`);

        // 2. Check for explicit video record
        const { data: video, error: videoError } = await supabase
            .from('videos')
            .select('*')
            .eq('topic_id', topic.id)
            .single();

        if (video) {
            console.log(`  [Video Table] Found record:`, video);
        } else {
            console.log(`  [Video Table] No record found.`);
        }

        // 3. Test Signed URL Generation if needed
        if (topic.video_url && !topic.video_url.startsWith('http')) {
            const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/(public|sign)\/([^\/]+)\/(.+)/;
            const match = topic.video_url.match(supabaseStoragePattern);

            let path = topic.video_url;
            if (match) path = match[3];

            console.log(`  Testing Signed URL for path: ${path}`);
            const { data: signed, error: signedError } = await supabase.storage
                .from('videos')
                .createSignedUrl(path, 60);

            if (signed) console.log(`  -> Generated: ${signed.signedUrl.substring(0, 50)}...`);
            if (signedError) console.error(`  -> Error:`, signedError.message);
        }
    }
}

debugVideoData();
