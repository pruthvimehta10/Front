import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Use Service Role Key to bypass RLS for writes (Custom JWT is not valid for Supabase)
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { }
                }
            }
        );
        const body = await request.json();

        // Basic validation
        if (!body.course_id || !body.title) {
            return NextResponse.json(
                { error: 'Missing required fields: course_id, title' },
                { status: 400 }
            );
        }

        // Get max order index
        const { count } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', body.course_id);

        const orderIndex = (count || 0) + 1;

        const payload: any = {
            course_id: body.course_id,
            title: body.title,
            description: body.description,
            video_url: body.video_url,
            video_duration_seconds: body.duration,
            order_index: orderIndex,
        };

        // Only include ID if it is a valid string (not null/undefined/empty)
        if (body.id && typeof body.id === 'string') {
            payload.id = body.id;
        }

        const { data, error } = await supabase
            .from('topics')
            .upsert([payload])
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
