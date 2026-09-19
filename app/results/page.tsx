'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Trophy, CheckCircle2, XCircle, Lightbulb, ArrowLeft, RotateCcw, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ObjResult, TheoryResult } from '@/lib/types';

interface StoredResult {
  result: {
    obj_results: ObjResult[];
    obj_score: number;
    obj_max: number;
    theory_result: TheoryResult;
    total_score: number;
    total_max: number;
  };
  exam: {
    subject: string;
    obj_questions: { id: number; question: string; options: string[] }[];
    theory_question: { question: string; max_marks: number };
    theoryAnswer: string;
  };
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export default function ResultsPage() {
  const [data, setData] = useState<StoredResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('examResult');
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
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
              <Link href="/take" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Take Test</Link>
              <Link href="/results" className="px-3 py-2 text-sm font-medium text-foreground">Results</Link>
            </nav>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No results to show</h1>
          <p className="text-muted-foreground mb-6">Take an exam first to see your score card here.</p>
          <Link href="/take">
            <Button>
              <RotateCcw className="w-4 h-4 mr-2" />
              Take a Test
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { result, exam } = data;
  const objPct = Math.round((result.obj_score / result.obj_max) * 100);
  const theoryPct = Math.round((result.theory_result.score / result.theory_result.max_marks) * 100);
  const totalPct = Math.round((result.total_score / result.total_max) * 100);

  const gradeColor = totalPct >= 80 ? 'from-emerald-500 to-teal-600' : totalPct >= 50 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-red-600';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
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
            <Link href="/take" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Take Test</Link>
            <Link href="/results" className="px-3 py-2 text-sm font-medium text-foreground">Results</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Score Summary */}
        <Card className={`p-8 mb-8 overflow-hidden relative animate-fade-in`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradeColor} opacity-5`} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradeColor} flex items-center justify-center`}>
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Score Card</h1>
                <p className="text-muted-foreground">{exam.subject}</p>
              </div>
            </div>

            {/* Total score */}
            <div className="text-center py-6">
              <div className={`text-6xl font-bold bg-gradient-to-r ${gradeColor} bg-clip-text text-transparent`}>
                {result.total_score}<span className="text-3xl text-muted-foreground">/{result.total_max}</span>
              </div>
              <p className="text-lg font-medium text-muted-foreground mt-2">{totalPct}%</p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-5 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">OBJ Score</span>
                  <span className="text-sm font-bold text-foreground">{result.obj_score}/{result.obj_max}</span>
                </div>
                <Progress value={objPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{objPct}% correct</p>
              </div>
              <div className="p-5 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Theory Score</span>
                  <span className="text-sm font-bold text-foreground">{result.theory_result.score}/{result.theory_result.max_marks}</span>
                </div>
                <Progress value={theoryPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{theoryPct}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* OBJ Review */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-sky-600" />
            Multiple Choice Review
          </h2>
          <div className="space-y-3">
            {result.obj_results.map((r, idx) => (
              <Card key={r.id} className={`p-5 border-l-4 ${r.is_correct ? 'border-l-success' : 'border-l-destructive'}`}>
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${r.is_correct ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {r.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-2">
                      <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                      {r.question}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {r.options.map((opt, i) => {
                        const letter = LETTERS[i];
                        const isCorrect = letter === r.correct_option;
                        const isSelected = letter === r.selected;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              isCorrect
                                ? 'bg-success/10 text-success font-medium'
                                : isSelected
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span className="font-semibold">{letter}.</span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4" />}
                            {isSelected && !isCorrect && <XCircle className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                    {r.selected === null && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">Not answered</p>
                    )}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30">
                      <Lightbulb className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-sky-900 dark:text-sky-200">
                        <span className="font-semibold">Explanation: </span>
                        {r.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Theory Review */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Theory Question Feedback
          </h2>
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
                {result.theory_result.max_marks} MARKS
              </span>
              <p className="font-medium text-foreground leading-relaxed">{exam.theory_question.question}</p>
            </div>

            {/* Your answer */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Your Answer</h4>
              <div className="p-4 rounded-lg bg-secondary/50 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {exam.theoryAnswer}
              </div>
            </div>

            {/* Feedback */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Score: {result.theory_result.score} / {result.theory_result.max_marks}
                </span>
              </div>
              <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
                {result.theory_result.feedback}
              </p>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Link href="/take" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Another Test
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
