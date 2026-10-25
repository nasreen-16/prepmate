import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  FileText,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";
import heroImage from "@/assets/landing-hero.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrepMate — AI Placement Preparation Platform" },
      {
        name: "description",
        content:
          "Plan, practice and crack campus placements: smart study planner, DSA tracker, AI interview coach, resume analyzer, quizzes and placement readiness analytics.",
      },
      { property: "og:title", content: "PrepMate — AI Placement Preparation Platform" },
      {
        property: "og:description",
        content:
          "Your all-in-one placement prep companion: study planner, DSA tracker, AI interview coach, resume analyzer and readiness analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Personalized study planner",
    body: "A daily task list built around your target companies and exam dates. Edit, prioritize and tick off tasks with real completion tracking.",
  },
  {
    icon: ListChecks,
    title: "DSA problem tracker",
    body: "Log every problem with topic, difficulty, platform and revision dates. Search, filter and watch your solved-count grow across charts.",
  },
  {
    icon: BrainCircuit,
    title: "AI interview coach",
    body: "Generate realistic technical and HR questions, answer them, and get instant scoring, strengths, improvements and model answers.",
  },
  {
    icon: FileText,
    title: "Resume analyzer",
    body: "Upload a PDF or DOCX resume with an optional job description. Get an ATS-style score, matched and missing skills, and concrete fixes.",
  },
  {
    icon: Sparkles,
    title: "Aptitude & core CS quizzes",
    body: "Timed quizzes on DBMS, OOP, operating systems, networks and quantitative aptitude — with explanations for every answer.",
  },
  {
    icon: BarChart3,
    title: "Placement readiness score",
    body: "A transparent, weighted score across DSA, consistency, quizzes, interviews and resume — with recommended next actions.",
  },
];

const STEPS = [
  {
    icon: Target,
    title: "Set your goal",
    body: "Tell PrepMate your target roles and graduation year. Your dashboard, planner and readiness score adapt to it.",
  },
  {
    icon: CalendarCheck,
    title: "Plan and practice daily",
    body: "Work through today's tasks, log DSA problems, take a quiz and rehearse interview answers — 30 focused minutes is enough.",
  },
  {
    icon: CheckCircle2,
    title: "Walk in ready",
    body: "Your readiness score, streak and weak areas tell you exactly what to fix before the placement season hits.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <a href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
              <Sparkles className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">PrepMate</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="gradient-primary shadow-soft">
              <Link to="/auth">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-blob pointer-events-none absolute -top-24 right-0 size-[480px]" />
        <div className="dotted-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 md:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-20">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-primary">
              <Sparkles className="size-3.5" /> AI-powered placement preparation
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.4rem]">
              Crack your campus placement with <span className="text-gradient">a daily system</span>, not last-minute panic.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              PrepMate brings your study planner, DSA tracker, AI interview practice, resume review and readiness
              analytics into one calm, focused workspace.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="gradient-primary px-7 text-base shadow-lift">
                <Link to="/auth">
                  Start preparing free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-card/70 px-6 text-base">
                <a href="#features">See features</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card. Your data stays private to your account.</p>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
              <img
                src={heroImage}
                alt="Illustration of PrepMate's progress cards and charts"
                width={1200}
                height={912}
                className="h-auto w-full"
              />
            </div>
            <div className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lift">
              <CheckCircle2 className="size-5 text-success" />
              <div className="text-sm">
                <div className="font-bold">Readiness score</div>
                <div className="text-xs text-muted-foreground">Know exactly what to fix next</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Everything one placement season needs</h2>
          <p className="mt-3 text-muted-foreground">
            Six connected tools that share one goal — making you interview-ready, measurably.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
              <CardContent className="p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">How PrepMate works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from scattered prep to a confident interview season.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
                <span className="absolute right-5 top-5 font-display text-4xl font-bold text-primary/15">{i + 1}</span>
                <span className="grid size-11 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-4xl gradient-primary px-6 py-14 text-center text-primary-foreground shadow-lift md:px-16">
          <div className="dotted-grid pointer-events-none absolute inset-0 opacity-20" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight md:text-4xl">
            Your offer starts with tomorrow's task list.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Create your free PrepMate account, load the demo planner, and see your first readiness score in under two minutes.
          </p>
          <Button size="lg" asChild className="relative mt-8 bg-card px-8 text-base font-bold text-primary hover:bg-card/90">
            <Link to="/auth">
              Create free account <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display font-bold text-foreground">PrepMate</span>
          </div>
          <p>Built for students, by students. Good luck out there!</p>
        </div>
      </footer>
    </div>
  );
}
