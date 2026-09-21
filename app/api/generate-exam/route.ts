import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

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

function normalizeExamData(input: any) {
  if (!Array.isArray(input?.obj_questions) || input.obj_questions.length !== 20) {
    throw new Error(`Gemini returned ${input?.obj_questions?.length ?? 0} OBJ questions; expected exactly 20.`);
  }

  const letters = new Set(['A', 'B', 'C', 'D']);
  const obj_questions = input.obj_questions.map((q: any, index: number) => {
    const correct = String(q.correct_option ?? q.answer ?? '').trim().toUpperCase();
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !letters.has(correct)) {
      throw new Error(`Question ${index + 1} has an invalid structure.`);
    }

    return {
      id: Number(q.id) || index + 1,
      question: String(q.question),
      options: q.options.map((option: unknown) => String(option).replace(/^\s*[A-D]\s*[\.)]\s*/i, '').trim()),
      correct_option: correct,
      explanation: String(q.explanation ?? ''),
    };
  });

  const theory = input.theory_question;
  if (!theory?.question) {
    throw new Error('Gemini did not return a valid theory question.');
  }

  return {
    obj_questions,
    theory_question: {
      question: String(theory.question),
      model_answer: String(theory.model_answer ?? theory.sample_answer ?? ''),
      rubric_keywords: Array.isArray(theory.rubric_keywords)
        ? theory.rubric_keywords.map((x: unknown) => String(x))
        : [],
      max_marks: Number(theory.max_marks) || 10,
    },
  };
}

export async function POST(req: Request) {
  try {
    const { subject, sourceText } = await req.json();

    if (!subject || !sourceText || sourceText.trim().length < 20) {
      return NextResponse.json({ error: 'Missing subject or sufficient source text.' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are an expert university examiner for ${subject}. Generate a complete exam based ONLY on the lecture material below.

LECTURE MATERIAL:
${sourceText}

Generate EXACTLY 20 multiple-choice questions and 1 theory question.

Each OBJ question must have:
- id: 1 through 20
- question
- options: exactly 4 strings in A, B, C, D order
- correct_option: exactly one of A, B, C, D
- explanation

The theory question must have:
- question
- model_answer
- rubric_keywords: an array of key terms/ideas
- max_marks: 10

Return ONLY valid JSON in this exact structure:
{
  "obj_questions": [
    {
      "id": 1,
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_option": "A",
      "explanation": "..."
    }
  ],
  "theory_question": {
    "question": "...",
    "model_answer": "...",
    "rubric_keywords": ["..."],
    "max_marks": 10
  }
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const examData = normalizeExamData(JSON.parse(cleanJson));

    const supabase = getAdminSupabase();
    const { data, error: dbError } = await supabase
      .from('exam_sets')
      .insert({
        subject,
        source_text: sourceText,
        obj_questions: examData.obj_questions,
        theory_question: examData.theory_question,
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
