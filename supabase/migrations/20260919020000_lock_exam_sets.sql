/*
  Keep exam_sets private. The browser now reads exam questions through the
  Next.js server route, while the grading/generation functions use the
  Supabase service role. This prevents the answer key from being exposed by
  direct client-side table queries.
*/

DROP POLICY IF EXISTS "anon_select_exam_sets" ON exam_sets;
DROP POLICY IF EXISTS "anon_insert_exam_sets" ON exam_sets;
DROP POLICY IF EXISTS "anon_update_exam_sets" ON exam_sets;
DROP POLICY IF EXISTS "anon_delete_exam_sets" ON exam_sets;

DROP POLICY IF EXISTS "authenticated_select_exam_sets" ON exam_sets;
DROP POLICY IF EXISTS "authenticated_insert_exam_sets" ON exam_sets;
DROP POLICY IF EXISTS "authenticated_update_exam_sets" ON exam_sets;
DROP POLICY IF EXISTS "authenticated_delete_exam_sets" ON exam_sets;
