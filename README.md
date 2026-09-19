# group_study_test

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-yojky1b8)

## Server environment variables

Set these in your deployment environment (for example, Netlify):

- `GEMINI_API_KEY` — Gemini API key used only by the server.
- `GEMINI_MODEL` — optional; defaults to `gemini-3.6-flash`.
- `SUPABASE_URL` — your Supabase project URL. If omitted, `NEXT_PUBLIC_SUPABASE_URL` may be used.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key. **Never expose this with a `NEXT_PUBLIC_` prefix.**

The quiz-taking browser no longer needs the Supabase anon key. Exam questions are fetched through `/api/exams`, which strips answer keys on the server before returning data to the browser. Grading is proxied through `/api/grade-exam` so the service-role key remains server-side.

After applying the migrations to your Supabase project, regenerate an exam from the Admin page and then select the same subject under Take Test.
