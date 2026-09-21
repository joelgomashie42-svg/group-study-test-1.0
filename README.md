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

## Vercel deployment

This is a Next.js application. In Vercel, use the **Next.js** framework preset and leave the Output Directory at `.next` (or let Vercel detect it automatically). Do not set the Output Directory to `public`.

The repository includes `vercel.json` to explicitly configure Next.js and `.next` as the build output.

## Student names and saved results

This version identifies each test attempt by the student's name and saves graded results in Supabase.

### Supabase setup

Run the migration below in the Supabase SQL Editor (or apply the migration with the Supabase CLI):

`supabase/migrations/20260921030000_create_exam_results.sql`

It creates the `exam_results` table. The Next.js server uses `SUPABASE_SERVICE_ROLE_KEY` to write and retrieve results; the table is not exposed directly to browser clients.

### Vercel environment variables

Make sure these server-side variables are configured:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

### How it works

1. A student enters their name before choosing an exam.
2. The name is sent with the submission to `/api/grade-exam`.
3. The completed score and review data are saved to `exam_results`.
4. The Results page can search by the same name through `/api/results?name=...`.
5. If a name has multiple attempts, the Results page lists the saved attempts and lets the student open each one.

**Privacy note:** because the requested lookup method is name-only, anyone who knows another student's exact name can search for that student's saved results. If results need to be private, add a second identifier such as a PIN, student ID, or one-time result code.
