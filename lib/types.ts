export type Subject =
  | 'Pharmacognosy'
  | 'Immunology & Microbiology'
  | 'Physical Chemistry';

export interface ObjQuestion {
  id: number;
  question: string;
  options: string[]; // 4 strings
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface TheoryQuestion {
  question: string;
  model_answer: string;
  rubric_keywords: string[];
  max_marks: number;
}

export interface ExamSet {
  id: string;
  subject: Subject;
  source_text: string;
  obj_questions: ObjQuestion[];
  theory_question: TheoryQuestion;
  created_at: string;
}

// What the frontend receives for taking a test (no answers)
export interface ExamSetForTest {
  id: string;
  subject: Subject;
  obj_questions: {
    id: number;
    question: string;
    options: string[];
  }[];
  theory_question: {
    question: string;
    max_marks: number;
  };
}

export interface ObjResult {
  id: number;
  question: string;
  options: string[];
  selected: 'A' | 'B' | 'C' | 'D' | null;
  correct_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  explanation: string;
}

export interface TheoryResult {
  score: number;
  max_marks: number;
  feedback: string;
}
