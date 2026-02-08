
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // DEBUG LOGS
    console.log(`[API] Fetching topics for course: ${id}`);

    // Middleware has verified the custom JWT, but Supabase RLS won't recognize it.
    // We use the Service Role Key to bypass RLS for this read operation.
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

    const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('course_id', id)
        .order('order_index');

    if (error) {
        console.error(`[API] Error fetching topics:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[API] Found ${data?.length || 0} topics`);
    return NextResponse.json(data);
}
