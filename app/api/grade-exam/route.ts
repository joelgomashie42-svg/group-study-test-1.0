import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
    }

    const body = await req.json();
    if (!body?.examSetId) {
      return NextResponse.json({ error: 'examSetId is required.' }, { status: 400 });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/grade-exam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || 'Grading service returned an invalid response.' };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Grade API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to grade exam.' }, { status: 500 });
  }
}
