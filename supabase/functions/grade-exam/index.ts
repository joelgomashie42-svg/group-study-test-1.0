import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface GradeBody {
  examSetId: string;
  answers: Record<number, "A" | "B" | "C" | "D">; // OBJ answers keyed by question id
  theoryAnswer: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { examSetId, answers, theoryAnswer } = (await req.json()) as GradeBody;

    if (!examSetId) {
      return new Response(
        JSON.stringify({ error: "examSetId is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the full exam set (with correct answers) from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: examSet, error: fetchError } = await supabase
      .from("exam_sets")
      .select("obj_questions, theory_question, subject")
      .eq("id", examSetId)
      .single();

    if (fetchError || !examSet) {
      return new Response(
        JSON.stringify({ error: "Exam set not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const objQuestions: any[] = examSet.obj_questions;
    const theory: any = examSet.theory_question;

    // Grade OBJ on the server
    const objResults = objQuestions.map((q) => {
      const selected = answers?.[q.id] ?? null;
      const correctOption = q.correct_option ?? q.answer;
      const isCorrect = selected !== null && selected === correctOption;
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        selected,
        correct_option: correctOption,
        is_correct: isCorrect,
        explanation: q.explanation,
      };
    });

    const objScore = objResults.filter((r) => r.is_correct).length;

    // Grade theory via Gemini
    let theoryResult = {
      score: 0,
      max_marks: theory.max_marks ?? 10,
      feedback: "Grading could not be completed.",
    };

    if (GEMINI_API_KEY && theoryAnswer && theoryAnswer.trim().length > 0) {
      const gradePrompt = `You are a strict but fair university examiner in ${examSet.subject}. Grade the student's theory answer.

QUESTION:
${theory.question}

MODEL ANSWER:
${theory.model_answer ?? theory.sample_answer ?? ""}

RUBRIC KEYWORDS (key terms that should appear for full marks):
${JSON.stringify(theory.rubric_keywords ?? [])}

MAX MARKS: ${theory.max_marks}

STUDENT'S ANSWER:
"""
${theoryAnswer}
"""

Evaluate the student's answer against the model answer and rubric keywords. Provide:
1. A numeric score out of ${theory.max_marks} (integer or one decimal place).
2. Detailed point-by-point feedback describing what was correct, what was missed, and what was incorrect.

Return ONLY a JSON object (no markdown, no code fences):
{
  "score": <number>,
  "feedback": "<detailed feedback string>"
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: gradePrompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        try {
          const parsed = JSON.parse(rawText);
          if (typeof parsed.score === "number" && typeof parsed.feedback === "string") {
            theoryResult = {
              score: Math.max(0, Math.min(parsed.score, theory.max_marks)),
              max_marks: theory.max_marks,
              feedback: parsed.feedback,
            };
          }
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              if (typeof parsed.score === "number" && typeof parsed.feedback === "string") {
                theoryResult = {
                  score: Math.max(0, Math.min(parsed.score, theory.max_marks)),
                  max_marks: theory.max_marks,
                  feedback: parsed.feedback,
                };
              }
            } catch {
              // keep default
            }
          }
        }
      }
    } else if (!theoryAnswer || theoryAnswer.trim().length === 0) {
      theoryResult = {
        score: 0,
        max_marks: theory.max_marks ?? 10,
        feedback: "No answer was submitted for this question.",
      };
    }

    const totalScore = objScore + theoryResult.score;
    const totalMax = 20 + theoryResult.max_marks;

    return new Response(
      JSON.stringify({
        obj_results: objResults,
        obj_score: objScore,
        obj_max: 20,
        theory_result: theoryResult,
        total_score: totalScore,
        total_max: totalMax,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
