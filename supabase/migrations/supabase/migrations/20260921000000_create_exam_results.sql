/*
# Create exam_results table

Stores each graded exam attempt so results survive a page refresh and can
be reopened later via a link (/results?id=...) or looked up by name.

1. New Tables
- `exam_results`
  - id, exam_set_id, student_name, subject
  - theory_question, theory_answer
  - obj_results, obj_score, obj_max
  - theory_result, total_score, total_max
  - created_at

2. Security
- RLS enabled, no anon/authenticated policies — only reachable through
  the Next.js API routes using the Supabase service-role key.
*/

CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id uuid REFERENCES exam_sets(id),
  student_name text NOT NULL,
  subject text NOT NULL,
  theory_question jsonb NOT NULL,
  theory_answer text,
  obj_results jsonb NOT NULL,
  obj_score int NOT NULL,
  obj_max int NOT NULL,
  theory_result jsonb NOT NULL,
  total_score numeric NOT NULL,
  total_max numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
