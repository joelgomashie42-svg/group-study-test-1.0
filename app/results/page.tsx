'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Trophy, CheckCircle2, XCircle, Lightbulb, ArrowLeft, RotateCcw, BookOpen, Loader2, AlertCircle, User, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { ObjResult, TheoryResult } from '@/lib/types';

interface ExamResultRow {
  id: string;
  student_name: string;
  subject: string;
  theory_question: { question: string; max_marks: number };
  theory_answer: string;
  obj_results: ObjResult[];
  obj_score: number;
  obj_max: number;
  theory_result: TheoryResult;
  total_score: number;
  total_max: number;
}

interface ResultSummary {
  id: string;
  subject: string;
  total_score: number;
  total_max: number;
  created_at: string;
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;
const NAME_STORAGE_KEY = 'examgen_student_name';

function Header() {
  return (
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
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-12">{children}</div>
    </div>
  );
}

function LookupByName() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [results, setResults] = useState<ResultSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(NAME_STORAGE_KEY);
    if (saved) setName(saved);
  }, []);

  const handleSearch = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/results?name=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load results.');
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load results.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Results</h1>
          <p className="text-muted-foreground">Enter your name to see past exam attempts</p>
        </div>
      </div>

      <Card className="mt-8 p-8">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="space-y-2 flex-1 w-full">
            <Label htmlFor="lookupName" className="text-sm font-semibold flex items-center gap-1.5">
              <User className="w-4 h-4" /> Your Name
            </Label>
            <Input
              id="lookupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Gomashie Joel"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Find My Results
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive py-3 text-sm mt-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </Card>

      {searched && !loading && !error && (
        <div className="mt-8 space-y-3">
          {results && results.length > 0 ? (
            results.map((r) => {
              const pct = Math.round((r.total_score / r.total_max) * 100);
              return (
                <Card
                  key={r.id}
                  className="p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/results?id=${r.id}`)}
                >
                  <div>
                    <p className="font-semibold text-foreground">{r.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-foreground">{r.total_score}/{r.total_max}</p>
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No results found for that name. Check the spelling, or take a test first.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <Link href="/take">
          <Button variant="outline" size="lg" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take a Test
          </Button>
        </Link>
      </div>
    </>
  );
}

function ResultDetail({ id }: { id: string }) {
  const [data, setData] = useState<ExamResultRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/results?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Could not load this result.');
        return json.result as ExamResultRow;
      })
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load this result.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-24">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading your result...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">Couldn't load this result</h1>
        <p className="text-muted-foreground mb-6">{error || 'Please try again.'}</p>
        <Link href="/results">
          <Button variant="outline">Back to Results</Button>
        </Link>
      </div>
    );
  }

  const objPct = Math.round((data.obj_score / data.obj_max) * 100);
  const theoryPct = Math.round((data.theory_result.score / data.theory_result.max_marks) * 100);
  const totalPct = Math.round((data.total_score / data.total_max) * 100);
  const gradeColor = totalPct >= 80 ? 'from-emerald-500 to-teal-600' : totalPct >= 50 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-red-600';

  return (
    <>
      <Link href="/results" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to your results
      </Link>

      <Card className="p-8 mb-8 overflow-hidden relative animate-fade-in">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradeColor} opacity-5`} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradeColor} flex items-center justify-center`}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Score Card</h1>
              <p className="text-muted-foreground">{data.subject} — {data.student_name}</p>
            </div>
          </div>

          <div className="text-center py-6">
            <div className={`text-6xl font-bold bg-gradient-to-r ${gradeColor} bg-clip-text text-transparent`}>
              {data.total_score}<span className="text-3xl text-muted-foreground">/{data.total_max}</span>
            </div>
            <p className="text-lg font-medium text-muted-foreground mt-2">{totalPct}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-5 rounded-xl bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">OBJ Score</span>
                <span className="text-sm font-bold text-foreground">{data.obj_score}/{data.obj_max}</span>
              </div>
              <Progress value={objPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{objPct}% correct</p>
            </div>
            <div className="p-5 rounded-xl bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Theory Score</span>
                <span className="text-sm font-bold text-foreground">{data.theory_result.score}/{data.theory_result.max_marks}</span>
              </div>
              <Progress value={theoryPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{theoryPct}%</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-sky-600" />
          Multiple Choice Review
        </h2>
        <div className="space-y-3">
          {data.obj_results.map((r, idx) => (
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

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          Theory Question Feedback
        </h2>
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
              {data.theory_result.max_marks} MARKS
            </span>
            <p className="font-medium text-foreground leading-relaxed">{data.theory_question.question}</p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Your Answer</h4>
            <div className="p-4 rounded-lg bg-secondary/50 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {data.theory_answer}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Score: {data.theory_result.score} / {data.theory_result.max_marks}
              </span>
            </div>
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
              {data.theory_result.feedback}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex gap-3 pt-4">
        <Link href="/take" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Another Test
          </Button>
        </Link>
        <Link href="/results" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            All My Results
          </Button>
        </Link>
      </div>
    </>
  );
}

function ResultsRouter() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  return id ? <ResultDetail id={id} /> : <LookupByName />;
}

export default function ResultsPage() {
  return (
    <Shell>
      <Suspense
        fallback={
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        }
      >
        <ResultsRouter />
      </Suspense>
    </Shell>
  );
}
