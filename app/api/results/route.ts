import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request) {
  try {
    const supabase = getAdminSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    if (!id && !name) {
      return NextResponse.json({ error: 'Provide id or name.' }, { status: 400 });
    }

    if (id) {
      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: 'Result not found.' }, { status: 404 });
      }
      return NextResponse.json({ result: data });
    }

    const trimmedName = String(name).trim();
    if (!trimmedName) {
      return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('exam_results')
      .select('id, subject, total_score, total_max, created_at')
      .ilike('student_name', trimmedName)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ results: data ?? [] });
  } catch (error: any) {
    console.error('Results API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to load results.' }, { status: 500 });
  }
}
