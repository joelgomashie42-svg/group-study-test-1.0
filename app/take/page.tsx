'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, FileText, ArrowLeft, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Subject, ExamSetForTest } from '@/lib/types';

const SUBJECTS: Subject[] = [
  'Pharmacognosy',
  'Immunology & Microbiology',
  'Physical Chemistry',
];

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export default function TakeTestPage() {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | ''>('');
  const [examSets, setExamSets] = useState<{ id: string; created_at: string }[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [exam, setExam] = useState<ExamSetForTest | null>(null);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [theoryAnswer, setTheoryAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch available exam sets for the selected subject
  useEffect(() => {
    if (!subject) {
      setExamSets([]);
      return;
    }
    setLoadingSets(true);
    setError('');
    setSelectedSetId('');
    setExam(null);
    fetch(`/api/exams?subject=${encodeURIComponent(subject)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load exams.');
        return data;
      })
      .then((data) => {
        setExamSets(data.examSets || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load exams.');
      })
      .finally(() => {
        setLoadingSets(false);
      });
  }, [subject]);

  // Fetch the selected exam set — only questions and options, NO answers
  const loadExam = async (setId: string) => {
    setLoadingExam(true);
    setError('');
    setExam(null);
    setAnswers({});
    setTheoryAnswer('');

    try {
      const res = await fetch(`/api/exams?id=${encodeURIComponent(setId)}`);
      const data = await res.json();
      if (!res.ok || !data.exam) {
        throw new Error(data.error || 'Could not load this exam.');
      }
      setExam(data.exam as ExamSetForTest);
    } catch (err: any) {
      setError(err.message || 'Could not load this exam. Please try another.');
    } finally {
      setLoadingExam(false);
    }
  };

  const answeredCount = exam ? Object.keys(answers).length : 0;
  const totalObj = exam?.obj_questions.length ?? 0;
  const progress = totalObj > 0 ? (answeredCount / totalObj) * 100 : 0;

  const handleSubmit = async () => {
    if (!exam) return;
    if (answeredCount < totalObj) {
      toast.error(`You've answered ${answeredCount} of ${totalObj} OBJ questions. Please answer all before submitting.`);
      return;
    }
    if (theoryAnswer.trim().length < 10) {
      toast.error('Please write a more complete answer for the theory question.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/grade-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examSetId: exam.id,
          answers,
          theoryAnswer,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Grading failed (${res.status})`);
      }

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Store results in sessionStorage for the results page
      sessionStorage.setItem('examResult', JSON.stringify({
        result,
        exam: {
          subject: exam.subject,
          obj_questions: exam.obj_questions,
          theory_question: exam.theory_question,
          theoryAnswer,
        },
      }));
      router.push('/results');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/70 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ExamGen</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            <Link href="/take" className="px-3 py-2 text-sm font-medium text-foreground">Take Test</Link>
            <Link href="/results" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Results</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Take a Test</h1>
            <p className="text-muted-foreground">Select a subject and exam set to begin</p>
          </div>
        </div>

        {/* Selection */}
        {!exam && (
          <Card className="mt-8 p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Subject</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subject && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Available Exam Sets</Label>
                {loadingSets ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading exam sets...
                  </div>
                ) : examSets.length === 0 ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4 text-sm">
                    <AlertCircle className="w-4 h-4" /> No exams found for this subject. Ask an admin to generate one.
                  </div>
                ) : (
                  <Select value={selectedSetId} onValueChange={(v) => { setSelectedSetId(v); loadExam(v); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an exam set" />
                    </SelectTrigger>
                    <SelectContent>
                      {examSets.map((s, i) => (
                        <SelectItem key={s.id} value={s.id}>
                          Exam #{i + 1} — {new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {loadingExam && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading exam questions...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive py-2 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </Card>
        )}

        {/* Exam */}
        {exam && (
          <div className="mt-8 space-y-6 animate-fade-in">
            {/* Progress bar */}
            <Card className="p-5 sticky top-20 z-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{exam.subject}</span>
                <span className="text-sm text-muted-foreground">{answeredCount} / {totalObj} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </Card>

            {/* OBJ Questions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground pt-2">Multiple Choice Questions</h2>
              {exam.obj_questions.map((q, idx) => (
                <Card key={q.id} className="p-6">
                  <div className="flex gap-3 mb-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <p className="font-medium text-foreground leading-relaxed pt-0.5">{q.question}</p>
                  </div>
                  <RadioGroup
                    value={answers[q.id] ?? ''}
                    onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v as 'A' | 'B' | 'C' | 'D' }))}
                    className="space-y-2 pl-10"
                  >
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                        <RadioGroupItem value={LETTERS[i]} id={`q${q.id}-${LETTERS[i]}`} />
                        <Label htmlFor={`q${q.id}-${LETTERS[i]}`} className="font-normal cursor-pointer flex-1 text-sm">
                          <span className="font-semibold text-muted-foreground mr-2">{LETTERS[i]}.</span>
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>
              ))}
            </div>

            {/* Theory Question */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold text-foreground">Theory Question</h2>
              <Card className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    {exam.theory_question.max_marks} MARKS
                  </span>
                  <p className="font-medium text-foreground leading-relaxed">{exam.theory_question.question}</p>
                </div>
                <Textarea
                  value={theoryAnswer}
                  onChange={(e) => setTheoryAnswer(e.target.value)}
                  placeholder="Write your detailed answer here..."
                  className="min-h-[200px] resize-y"
                />
                <p className="text-xs text-muted-foreground mt-2">{theoryAnswer.trim().split(/\s+/).filter(Boolean).length} words</p>
              </Card>
            </div>

            {/* Submit */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full text-base font-semibold h-12" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Grading your exam...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Exam for Grading
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You've answered {answeredCount} of {totalObj} multiple-choice questions and written {theoryAnswer.trim().split(/\s+/).filter(Boolean).length} words for the theory question. Once submitted, your answers will be graded and you cannot change them.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go back & review</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit & Grade
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
