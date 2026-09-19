/*
# Create exam_sets table (single-tenant, no auth)

1. New Tables
- `exam_sets`
  - `id` (uuid, primary key)
  - `subject` (text, not null) — one of 'Pharmacognosy', 'Immunology & Microbiology', 'Physical Chemistry'
  - `source_text` (text) — the raw lecture slide text pasted by the admin
  - `obj_questions` (jsonb, not null) — array of 20 OBJ question objects: { id, question, options[4], correct_option, explanation }
  - `theory_question` (jsonb, not null) — single theory object: { question, model_answer, rubric_keywords[], max_marks }
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `exam_sets`.
- This is a single-tenant app with no sign-in, so anon + authenticated CRUD is allowed (data is intentionally shared/public among admin and test-takers).
*/

CREATE TABLE IF NOT EXISTS exam_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  source_text text,
  obj_questions jsonb NOT NULL,
  theory_question jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exam_sets" ON exam_sets;
CREATE POLICY "anon_select_exam_sets" ON exam_sets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exam_sets" ON exam_sets;
CREATE POLICY "anon_insert_exam_sets" ON exam_sets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exam_sets" ON exam_sets;
CREATE POLICY "anon_update_exam_sets" ON exam_sets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exam_sets" ON exam_sets;
CREATE POLICY "anon_delete_exam_sets" ON exam_sets FOR DELETE
  TO anon, authenticated USING (true);
