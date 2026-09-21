import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

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

function clampScore(value: unknown, max: number) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, max));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const examSetId = String(body?.examSetId || '').trim();
    const candidateName = String(body?.candidateName || '').trim().replace(/\s+/g, ' ');
    const answers = body?.answers;
    const theoryAnswer = typeof body?.theoryAnswer === 'string' ? body.theoryAnswer : '';

    if (!examSetId) {
      return NextResponse.json({ error: 'examSetId is required.' }, { status: 400 });
    }
    if (candidateName.length < 2 || candidateName.length > 100) {
      return NextResponse.json({ error: 'Please provide a valid name (2–100 characters).' }, { status: 400 });
    }
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json({ error: 'Submitted OBJ answers are missing or invalid.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data: examSet, error: fetchError } = await supabase
      .from('exam_sets')
      .select('id, subject, obj_questions, theory_question')
      .eq('id', examSetId)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase grading fetch error:', fetchError);
      return NextResponse.json({ error: `Could not load exam for grading: ${fetchError.message}` }, { status: 500 });
    }
    if (!examSet) {
      return NextResponse.json({ error: 'Exam set not found.' }, { status: 404 });
    }

    const objQuestions = Array.isArray(examSet.obj_questions) ? examSet.obj_questions : [];
    const theory = examSet.theory_question || {};

    const objResults = objQuestions.map((q: any) => {
      const selected = answers[String(q.id)] ?? answers[q.id] ?? null;
      const normalizedSelected = ['A', 'B', 'C', 'D'].includes(String(selected).toUpperCase())
        ? String(selected).toUpperCase()
        : null;
      const correctOption = String(q.correct_option ?? q.answer ?? '').trim().toUpperCase();
      const isCorrect = normalizedSelected !== null && normalizedSelected === correctOption;

      return {
        id: Number(q.id),
        question: String(q.question ?? ''),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        selected: normalizedSelected,
        correct_option: correctOption,
        is_correct: isCorrect,
        explanation: String(q.explanation ?? ''),
      };
    });

    const objScore = objResults.filter((r) => r.is_correct).length;
    const theoryMax = Number(theory.max_marks) || 10;

    let theoryResult = {
      score: 0,
      max_marks: theoryMax,
      feedback: 'No answer was submitted for this question.',
    };

    if (theoryAnswer.trim()) {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in Vercel.' }, { status: 500 });
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const prompt = `You are a strict but fair university examiner in ${examSet.subject}.

QUESTION:
${theory.question ?? ''}

MODEL ANSWER:
${theory.model_answer ?? theory.sample_answer ?? ''}

RUBRIC KEYWORDS:
${JSON.stringify(Array.isArray(theory.rubric_keywords) ? theory.rubric_keywords : [])}

MAX MARKS: ${theoryMax}

STUDENT'S ANSWER:
${theoryAnswer}

Grade the student's answer against the model answer and rubric. Return ONLY valid JSON:
{"score": <number>, "feedback": "<concise but useful feedback>"}`;

      try {
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(raw);
        theoryResult = {
          score: clampScore(parsed.score, theoryMax),
          max_marks: theoryMax,
          feedback: typeof parsed.feedback === 'string' && parsed.feedback.trim()
            ? parsed.feedback
            : 'The answer was graded, but no detailed feedback was returned.',
        };
      } catch (aiError: any) {
        console.error('Gemini grading error:', aiError);
        return NextResponse.json({
          error: `Theory grading failed: ${aiError?.message || 'Gemini returned an invalid response.'}`,
        }, { status: 502 });
      }
    }

    const totalScore = objScore + theoryResult.score;
    const totalMax = objQuestions.length + theoryMax;

    const result = {
      obj_results: objResults,
      obj_score: objScore,
      obj_max: objQuestions.length,
      theory_result: theoryResult,
      total_score: totalScore,
      total_max: totalMax,
    };

    // Store the complete result card so it can be retrieved later by name.
    const normalizedName = candidateName.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    const resultData = {
      result,
      exam: {
        subject: examSet.subject,
        obj_questions: objResults.map(({ correct_option, is_correct, selected, ...q }) => ({
          ...q,
          correct_option,
          is_correct,
          selected,
        })),
        theory_question: {
          question: String(theory.question ?? ''),
          max_marks: theoryMax,
        },
        theoryAnswer,
      },
    };

    const { data: savedResult, error: saveError } = await supabase
      .from('exam_results')
      .insert({
        exam_set_id: examSet.id,
        candidate_name: candidateName,
        normalized_name: normalizedName,
        subject: examSet.subject,
        obj_score: objScore,
        obj_max: objQuestions.length,
        theory_score: theoryResult.score,
        theory_max: theoryMax,
        total_score: totalScore,
        total_max: totalMax,
        result_data: resultData,
      })
      .select('id, created_at')
      .single();

    if (saveError) {
      console.error('Supabase result save error:', saveError);
      return NextResponse.json({
        error: `Exam was graded, but the result could not be saved: ${saveError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      ...result,
      candidate_name: candidateName,
      result_id: savedResult.id,
      created_at: savedResult.created_at,
    });
  } catch (error: any) {
    console.error('Grade API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to grade exam.' }, { status: 500 });
  }
}
