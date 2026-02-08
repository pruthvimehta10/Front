
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import supabase from '../lib/supabase.js';

interface Topic {
    id: string;
    course_id: string;
    video_url: string;
}

interface Course {
    id: string;
    is_published: boolean;
}

// Helper to fetch topic
async function getTopic(topicId: string): Promise<Topic | null> {
    const { data: topic, error } = await supabase
        .from('topics')
        .select('id, course_id, video_url')
        .eq('id', topicId)
        .single();

    if (error || !topic) return null;
    return topic as Topic;
}

// Helper to fetch course
async function getCourse(courseId: string): Promise<Course | null> {
    const { data: course, error } = await supabase
        .from('courses')
        .select('id, is_published')
        .eq('id', courseId)
        .single();

    if (error || !course) return null;
    return course as Course;
}

// Helper to fetch video path priority: videos table -> topics table
async function getVideoPath(topicId: string): Promise<string | null> {
    // 1. Try fetching from videos table
    const { data: video } = await supabase
        .from('videos')
        .select('video_path')
        .eq('topic_id', topicId)
        .single();

    if (video && video.video_path) {
        return video.video_path;
    }

    // 2. Fallback to topic's video_url
    const topic = await getTopic(topicId);
    return topic?.video_url || null;
}

export const streamVideo = async (req: Request, res: Response) => {
    try {
        const { url, topicId } = req.query;
        console.log(`[Stream] Request received for topicId: ${topicId}, url: ${url}`);

        // Type checking for query parameters
        if (!topicId || typeof topicId !== 'string') {
            return res.status(400).json({ error: 'Missing topicId parameter' });
        }

        // If URL is provided directly, use it (backward compatibility or direct play)
        // Otherwise fetch from DB
        let videoUrl = (typeof url === 'string' && url) ? url : null;

        if (!videoUrl) {
            videoUrl = await getVideoPath(topicId);
            console.log(`[Stream] Resolved video path for topic ${topicId}: ${videoUrl}`);
        }

        if (!videoUrl) {
            console.error('[Stream] Video path not found in DB');
            return res.status(404).json({ error: 'Video not found' });
        }

        // Check if it's a Supabase URL (regardless of http/https) 
        // Logic: If it contains supabase.co/storage/v1/object/public or /sign, extract path and resign it.
        // This ensures access even if bucket is private but URL says public.
        const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/(public|sign)\/([^\/]+)\/(.+)/;
        const match = videoUrl.match(supabaseStoragePattern);

        if (match) {
            console.log('[Stream] Detected Supabase URL, attempting to sign...');
            const bucket = match[2];
            const path = match[3];

            // Generate a fresh signed URL
            const { data } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, 60);

            if (data?.signedUrl) {
                videoUrl = data.signedUrl;
                console.log('[Stream] Generated fresh signed URL for Supabase content');
            } else {
                console.warn('[Stream] Failed to sign Supabase URL, using original:', videoUrl);
            }
        }
        else if (!videoUrl.startsWith('http')) {
            // It's a raw path (e.g. "videos/intro.mp4"), not a URL
            console.log('[Stream] Detected raw path, generating signed URL...');
            const { data } = await supabase.storage
                .from('videos') // Defaulting to 'videos' bucket if unknown
                .createSignedUrl(videoUrl, 60);
            if (data?.signedUrl) {
                videoUrl = data.signedUrl;
                console.log('[Stream] Generated signed URL');
            } else {
                console.error('[Stream] Failed to generate signed URL');
                return res.status(400).json({ error: 'Invalid video path or URL' });
            }
        }

        // 1. Fetch topic (for course context)
        const topic = await getTopic(topicId);
        if (!topic) {
            console.error('[Stream] Topic not found');
            return res.status(404).json({ error: 'Topic not found' });
        }

        // 2. Fetch course
        const course = await getCourse(topic.course_id);
        if (!course) {
            console.error('[Stream] Course not found');
            return res.status(404).json({ error: 'Course not found' });
        }

        // 4. Forward request to upstream
        const rangeHeader = req.headers.range;
        const fetchHeaders: Record<string, string> = {
            'User-Agent': (req.headers['user-agent'] as string) || ''
        };
        if (rangeHeader) {
            fetchHeaders['Range'] = rangeHeader;
            console.log(`[Stream] Forwarding Range header: ${rangeHeader}`);
        }


        // ... inside streamVideo ...

        console.log(`[Stream] Fetching upstream video: ${videoUrl}`);
        const response = await fetch(videoUrl as string, {
            method: 'GET',
            headers: fetchHeaders
        });

        if (!response.ok && response.status !== 206) {
            console.error(`[Stream] Upstream fetch failed: ${response.status} ${response.statusText}`);
            return res.status(500).json({ error: 'Failed to fetch video' });
        }

        // 5. Build response headers
        const contentType = response.headers.get('content-type') || 'video/mp4';
        const contentLength = response.headers.get('content-length');
        const contentRange = response.headers.get('content-range');

        console.log(`[Stream] Response: ${response.status}, Type: ${contentType}, Range: ${contentRange}`);

        res.status(response.status);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Accept-Ranges', 'bytes');

        if (contentLength) res.setHeader('Content-Length', contentLength);
        if (contentRange) res.setHeader('Content-Range', contentRange);

        // 6. Pipe data (Node-fetch returns a Node Readable stream)
        if (response.body) {
            response.body.pipe(res);

            response.body.on('error', (err) => {
                console.error('Stream error:', err);
                res.end();
            });
        } else {
            res.end();
        }

    } catch (error) {
        console.error('Video streaming error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const getSignedUrl = async (req: Request, res: Response) => {
    try {
        const { topicId } = req.query;
        // userId from auth middleware
        const userId = req.user?.userId;

        if (!topicId || typeof topicId !== 'string') {
            return res.status(400).json({ error: 'Missing topic ID' });
        }

        // NEW: Try fetching from videos table first
        let videoPathOrUrl = await getVideoPath(topicId);

        if (!videoPathOrUrl) {
            return res.status(404).json({ error: 'Video not available' });
        }

        // Check if it's a full Supabase URL (legacy) or just a path (new videos table might store path)
        const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/(public|sign)\/([^\/]+)\/(.+)/;
        const match = videoPathOrUrl.match(supabaseStoragePattern);

        if (match) {
            // It's a full URL, extract details
            const bucketName = match[2];
            const filePath = match[3];

            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 3600);

            if (error) throw error;
            return res.json({ url: data.signedUrl, expiresIn: 3600 });
        }

        // If it's NOT a full URL, assume it's a path in 'videos' bucket (if it doesn't start with http)
        if (!videoPathOrUrl.startsWith('http')) {
            const { data, error } = await supabase.storage
                .from('videos')
                .createSignedUrl(videoPathOrUrl, 3600);

            if (error) {
                console.error('Failed to sign URL for path:', videoPathOrUrl, error);
                return res.status(500).json({ error: 'Failed to generate video URL' });
            }
            return res.json({ url: data.signedUrl, expiresIn: 3600 });
        }

        // Fallback for external URLs or public URLs
        return res.json({ url: videoPathOrUrl, expiresIn: null });

    } catch (error) {
        console.error('Signed URL error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createVideo = async (req: Request, res: Response) => {
    try {
        const { title, url, courseId } = req.body;

        // Validation
        if (!title || !url || !courseId) {
            return res.status(400).json({ error: 'Missing required fields: title, url, courseId' });
        }

        // 0. Calculate order_index
        const { count, error: countError } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);

        const orderIndex = (count || 0) + 1;

        // 1. Insert into topics table
        const { data: topicData, error: topicError } = await supabase
            .from('topics')
            .insert([
                {
                    title,
                    video_url: url, // Keeping this for backward compatibility
                    course_id: courseId,
                    order_index: orderIndex
                }
            ])
            .select()
            .single();

        if (topicError) {
            console.error('Database insert error (topics):', topicError);
            return res.status(500).json({ error: 'Failed to create topic record' });
        }

        // 2. Insert into videos table
        // Extract plain path if it's a supabase URL to store clean data
        let videoPath = url;
        const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/(public|sign)\/([^\/]+)\/(.+)/;
        const match = url.match(supabaseStoragePattern);
        if (match) {
            videoPath = match[3]; // Just the file path
        }

        const { error: videoError } = await supabase
            .from('videos')
            .insert([
                {
                    topic_id: topicData.id,
                    title: title,
                    video_path: videoPath,
                    // duration: 0 // Optional, we don't have it from frontend yet
                }
            ]);

        if (videoError) {
            console.error('Database insert error (videos):', videoError);
            // We don't fail the whole request because topic was created, but we log it
            // Ideally we should use a transaction or cleanup, but for now we warn.
        }

        return res.status(201).json({
            message: 'Video created successfully',
            data: topicData
        });

    } catch (error) {
        console.error('Create video error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
