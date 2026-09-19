import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function toSafeExam(row: any) {
  return {
    id: row.id,
    subject: row.subject,
    obj_questions: Array.isArray(row.obj_questions)
      ? row.obj_questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
        }))
      : [],
    theory_question: {
      question: row.theory_question?.question ?? '',
      max_marks: row.theory_question?.max_marks ?? 10,
    },
  };
}

export async function GET(req: Request) {
  try {
    const supabase = getAdminSupabase();
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const id = searchParams.get('id');

    if (!subject && !id) {
      return NextResponse.json({ error: 'Provide subject or id.' }, { status: 400 });
    }

    if (id) {
      const { data, error } = await supabase
        .from('exam_sets')
        .select('id, subject, obj_questions, theory_question')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });

      return NextResponse.json({ exam: toSafeExam(data) });
    }

    const { data, error } = await supabase
      .from('exam_sets')
      .select('id, created_at')
      .eq('subject', subject)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ examSets: data ?? [] });
  } catch (error: any) {
    console.error('Exam API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load exams.' },
      { status: 500 }
    );
  }
}
