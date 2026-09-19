'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Upload, Loader2, FileText, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Subject } from '@/lib/types';

const SUBJECTS: Subject[] = [
  'Pharmacognosy',
  'Immunology & Microbiology',
  'Physical Chemistry',
];

export default function AdminPage() {
  const [subject, setSubject] = useState<Subject | ''>('');
  const [sourceText, setSourceText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject) {
      toast.error('Please select a subject.');
      return;
    }
    if (sourceText.trim().length < 20) {
      toast.error('Please paste at least a few sentences of lecture text.');
      return;
    }

    setLoading(true);
    try {
      // Send directly to Next.js API Route instead of Supabase Edge Function
      const res = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, sourceText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      toast.success('Exam generated and locked successfully!');
      setSubject('');
      setSourceText('');
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to generate exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/70 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ExamGen</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="px-3 py-2 text-sm font-medium text-foreground">Admin</Link>
            <Link href="/take" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Take Test</Link>
            <Link href="/results" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Results</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Upload</h1>
            <p className="text-muted-foreground">Generate a locked exam from your lecture slides</p>
          </div>
        </div>

        <Card className="mt-8 p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold">Subject</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger id="subject" className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="text-sm font-semibold">Lecture Slide Text</Label>
              <Textarea
                id="source"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste your raw lecture slide text here..."
                className="min-h-[280px] font-mono text-sm leading-relaxed resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {sourceText.trim().length} characters — paste the full lecture content for best results.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Blind upload:</span> The generated questions and answers are saved directly to the database and never shown on screen. Test takers cannot see them.
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="lg"
              className="w-full text-base font-semibold h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating exam... This may take 20-30 seconds
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Generate & Lock Exam
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
