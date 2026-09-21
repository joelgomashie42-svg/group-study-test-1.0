import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export async function GET(req: Request) {
  try {
    const name = new URL(req.url).searchParams.get('name') || '';
    const normalizedName = normalizeName(name);

    if (normalizedName.length < 2) {
      return NextResponse.json({ error: 'Please enter at least 2 characters of the name.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('exam_results')
      .select('id, candidate_name, subject, obj_score, obj_max, theory_score, theory_max, total_score, total_max, result_data, created_at')
      .eq('normalized_name', normalizedName)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Results lookup error:', error);
      return NextResponse.json({ error: `Could not retrieve results: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ results: data ?? [] });
  } catch (error: any) {
    console.error('Results API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to retrieve results.' }, { status: 500 });
  }
}
