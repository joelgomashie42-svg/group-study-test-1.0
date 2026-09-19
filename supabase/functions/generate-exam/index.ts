import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface GenerateBody {
  subject: string;
  sourceText: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { subject, sourceText } = (await req.json()) as GenerateBody;

    if (!subject || !sourceText || sourceText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Subject and sufficient source text are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured. Add GEMINI_API_KEY in the Supabase Secrets tab." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are an expert university examiner in ${subject}. Below are raw lecture slide notes. Generate a complete exam set based ONLY on this material.

LECTURE SLIDE TEXT:
"""
${sourceText}
"""

Generate EXACTLY:
- 20 multiple choice (OBJ) questions, each with: id (1-20), question, options (array of exactly 4 strings labeled A-D content), correct_option ("A"|"B"|"C"|"D"), and explanation.
- 1 theory question with: question, model_answer (a thorough model answer), rubric_keywords (array of key terms/phrases that should appear for full marks), and max_marks (always 10).

Return ONLY a JSON object in this exact structure (no markdown, no code fences, no commentary):
{
  "obj_questions": [
    { "id": 1, "question": "...", "options": ["...","...","...","..."], "correct_option": "A", "explanation": "..." }
  ],
  "theory_question": {
    "question": "...",
    "model_answer": "...",
    "rubric_keywords": ["...","..."],
    "max_marks": 10
  }
}

The options array must contain exactly 4 strings. correct_option must be a single letter A, B, C, or D matching the position of the correct answer. Generate exactly 20 OBJ questions.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status} — ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Gemini returned no content." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: { obj_questions: any[]; theory_question: any };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // try to extract JSON from potential markdown fences
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse JSON from Gemini response.");
      parsed = JSON.parse(match[0]);
    }

    // Validate structure
    if (!parsed.obj_questions || !Array.isArray(parsed.obj_questions) || parsed.obj_questions.length !== 20) {
      return new Response(
        JSON.stringify({ error: `Gemini returned ${parsed.obj_questions?.length ?? 0} OBJ questions; expected 20. Please try again.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!parsed.theory_question || !parsed.theory_question.question) {
      return new Response(
        JSON.stringify({ error: "Gemini did not return a valid theory question." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("exam_sets")
      .insert({
        subject,
        source_text: sourceText,
        obj_questions: parsed.obj_questions,
        theory_question: parsed.theory_question,
      })
      .select("id")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to save exam set: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
