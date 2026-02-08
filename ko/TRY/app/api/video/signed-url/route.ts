import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role to bypass RLS when generating signed URLs
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const topicId = searchParams.get('topicId')
        const userId = req.headers.get('x-user-id')

        if (!topicId) {
            return NextResponse.json({ error: 'Missing topic ID' }, { status: 400 })
        }

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // 1. Fetch topic with video path
        const { data: topic, error: topicError } = await supabase
            .from('topics')
            .select('id, course_id, video_url')
            .eq('id', topicId)
            .single()

        if (topicError || !topic) {
            console.error('Video API: Topic not found', { topicId, error: topicError })
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
        }

        if (!topic.video_url) {
            return NextResponse.json({ error: 'Video not available' }, { status: 404 })
        }

        // 2. Check if it's a Supabase Storage URL
        const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/(public|sign)\/([^\/]+)\/(.+)/
        const match = topic.video_url.match(supabaseStoragePattern)

        if (match) {
            // It's a Supabase Storage file
            const bucketName = match[2]
            const filePath = match[3]

            // Generate signed URL that expires in 1 hour
            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 3600) // 1 hour = 3600 seconds

            if (error) {
                console.error('Failed to create signed URL:', error)
                return NextResponse.json({ error: 'Failed to generate video URL' }, { status: 500 })
            }

            return NextResponse.json({
                url: data.signedUrl,
                expiresIn: 3600
            })
        } else {
            // It's an external URL (YouTube, Vimeo, etc.) - return as-is
            return NextResponse.json({
                url: topic.video_url,
                expiresIn: null // External URLs don't expire
            })
        }

    } catch (error: any) {
        console.error('Signed URL generation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
