'use client';

import Link from 'next/link';
import { FileText, Upload, GraduationCap, Brain, ShieldCheck, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Home() {
  const features = [
    { icon: Brain, title: 'AI-Powered Generation', desc: 'Paste your lecture notes and let AI craft a full 20-question exam plus a theory question instantly.' },
    { icon: ShieldCheck, title: 'Blind & Secure', desc: 'Generated answers are locked away — the test taker never sees them until grading is complete.' },
    { icon: Clock, title: 'Instant Grading', desc: 'OBJ questions are auto-graded. Theory answers are evaluated by AI with detailed, point-by-point feedback.' },
  ];

  const actions = [
    { icon: Upload, title: 'Admin Upload', desc: 'Generate an exam from lecture slides', href: '/admin', accent: 'from-sky-500 to-blue-600' },
    { icon: FileText, title: 'Take a Test', desc: 'Sit a self-administered exam', href: '/take', accent: 'from-emerald-500 to-teal-600' },
    { icon: GraduationCap, title: 'View Results', desc: 'See your score card after submission', href: '/results', accent: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/70 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ExamGen</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            <Link href="/take" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Take Test</Link>
            <Link href="/results" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Results</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-sm font-medium mb-6 animate-fade-in">
          <Brain className="w-4 h-4" />
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground animate-slide-up">
          Self-administered exams,<br />
          <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">generated and graded by AI.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up">
          Upload your lecture slides, generate a complete exam with 20 multiple-choice questions and a theory question, then take it and get instant AI-graded feedback.
        </p>
      </section>

      {/* Action cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {actions.map((a, i) => (
            <Link key={a.href} href={a.href}>
              <Card className="group relative overflow-hidden p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${a.accent} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.accent} flex items-center justify-center mb-4`}>
                  <a.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{a.title}</h3>
                <p className="mt-2 text-muted-foreground">{a.desc}</p>
                <div className="mt-4 text-sm font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Get started →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <f.icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h4 className="font-semibold text-foreground">{f.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          ExamGen — AI-powered self-administered examination platform
        </div>
      </footer>
    </div>
  );
}
