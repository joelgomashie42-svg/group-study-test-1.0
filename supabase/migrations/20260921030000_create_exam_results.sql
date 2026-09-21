/*
  Persistent exam results

  Results are written/read through the Next.js server using the Supabase
  service-role key. No browser access policy is created for this table.
*/

CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id uuid REFERENCES exam_sets(id) ON DELETE SET NULL,
  candidate_name text NOT NULL,
  normalized_name text NOT NULL,
  subject text NOT NULL,
  obj_score integer NOT NULL DEFAULT 0,
  obj_max integer NOT NULL DEFAULT 0,
  theory_score numeric NOT NULL DEFAULT 0,
  theory_max numeric NOT NULL DEFAULT 0,
  total_score numeric NOT NULL DEFAULT 0,
  total_max numeric NOT NULL DEFAULT 0,
  result_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exam_results_normalized_name_idx
  ON exam_results (normalized_name);

CREATE INDEX IF NOT EXISTS exam_results_created_at_idx
  ON exam_results (created_at DESC);

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Deliberately no anon/authenticated policies. The app's server route uses
-- SUPABASE_SERVICE_ROLE_KEY to save and retrieve results.
