import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useServerFn } from "@tanstack/react-start";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquareText,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { deleteMockInterview, listMockInterviews, saveMockInterview } from "@/server/data.functions";
import { generateInterviewQuestions, getCoachFeedback, gradeMockInterview } from "@/server/ai.functions";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({
    meta: [
      { title: "AI Interview Coach — PrepMate" },
      { name: "description", content: "Practice technical and HR interview questions with AI feedback, scoring and model answers." },
      { property: "og:title", content: "AI Interview Coach — PrepMate" },
      { property: "og:description", content: "Practice technical and HR interview questions with AI feedback, scoring and model answers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterviewPage,
});

type Feedback = { score: number; strengths: string[]; improvements: string[]; modelAnswer: string };
type Graded = { perAnswer: Feedback[]; overallScore: number; summary: string };
type InterviewQuestion = { question: string; category: string; tip: string };
type HistoryRow = {
  id: string;
  interview_type: string;
  role: string;
  overall_score: number | null;
  summary: string;
  created_at: string;
  questions: { question: string; category: string; answer: string; feedback: Feedback | null }[];
};

const TYPE_LABEL: Record<string, string> = { technical: "Technical", hr: "HR", mixed: "Mixed" };

function InterviewPage() {
  const fetchHistory = useServerFn(listMockInterviews);
  const save = useServerFn(saveMockInterview);
  const remove = useServerFn(deleteMockInterview);
  const generate = useServerFn(generateInterviewQuestions);
  const grade = useServerFn(gradeMockInterview);
  const coachFn = useServerFn(getCoachFeedback);
  const queryClient = useQueryClient();

  const history = useQuery({ queryKey: ["interviews"], queryFn: () => fetchHistory() });

  // Mock interview state
  const [type, setType] = useState<"technical" | "hr" | "mixed">("technical");
  const [role, setRole] = useState("Software Engineer");
  const [count, setCount] = useState("4");
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [step, setStep] = useState<"setup" | "answer" | "result">("setup");
  const [busy, setBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Coach state
  const [coachQ, setCoachQ] = useState("");
  const [coachA, setCoachA] = useState("");
  const [coachResult, setCoachResult] = useState<Feedback | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);

  async function startMock() {
    setBusy(true);
    setAiError(null);
    try {
      const qs = await generate({ data: { interviewType: type, role, count: Number(count) } });
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
      setGraded(null);
      setStep("answer");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMock() {
    if (!questions) return;
    if (answers.some((a) => a.trim().length < 5)) {
      return toast.error("Answer every question (at least a couple of sentences).");
    }
    setBusy(true);
    setAiError(null);
    try {
      const result = await grade({
        data: {
          interviewType: type,
          role,
          answers: questions.map((q, i) => ({ question: q.question, category: q.category, answer: answers[i] })),
        },
      });
      setGraded(result);
      setStep("result");
      await save({
        data: {
          interviewType: type,
          role,
          questions: questions.map((q, i) => ({ question: q.question, category: q.category, tip: q.tip, answer: answers[i], feedback: result.perAnswer[i] })),
          overallScore: result.overallScore,
          summary: result.summary,
        },
      });
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function askCoach() {
    if (coachQ.trim().length < 5 || coachA.trim().length < 5) return toast.error("Enter a question and your answer.");
    setCoachBusy(true);
    setCoachResult(null);
    try {
      const fb = await coachFn({ data: { interviewType: type, role, question: coachQ.trim(), category: "General", answer: coachA.trim() } });
      setCoachResult(fb);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setCoachBusy(false);
    }
  }

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Interview deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="AI Interview Coach" subtitle="Rehearse, get scored, improve — before the real panel." activeTo="/interview">
      <Tabs defaultValue="mock">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="mock">Mock interview</TabsTrigger>
          <TabsTrigger value="coach">Quick coach</TabsTrigger>
        </TabsList>

        <TabsContent value="mock" className="mt-4">
          {step === "setup" && (
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-bold">Set up your mock round</h3>
                <p className="mt-1 text-sm text-muted-foreground">The AI generates realistic questions; you answer in writing; every answer gets scored feedback.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Interview type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                      <SelectTrigger className="w-full bg-card"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target role</Label>
                    <Input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} className="bg-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Questions</Label>
                    <Select value={count} onValueChange={setCount}>
                      <SelectTrigger className="w-full bg-card"><SelectValue /></SelectTrigger>
                      <SelectContent>{["3", "4", "5", "6"].map((n) => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {aiError && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{aiError}</p>}
                <Button className="mt-5 gradient-primary" onClick={startMock} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} Generate questions
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "answer" && questions && (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <Card key={i} className="shadow-soft">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">{i + 1}. {q.question}</p>
                      <Badge variant="secondary" className="shrink-0 bg-primary-soft text-primary">{q.category}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">💡 {q.tip}</p>
                    <Textarea
                      className="mt-3"
                      rows={4}
                      maxLength={6000}
                      placeholder="Type your answer — structure it like you'd speak it…"
                      value={answers[i]}
                      onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                    />
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">{answers[i].length}/6000</p>
                  </CardContent>
                </Card>
              ))}
              {aiError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{aiError}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep("setup"); setQuestions(null); }} disabled={busy}>Back</Button>
                <Button className="gradient-primary flex-1" onClick={submitMock} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Submit for AI grading
                </Button>
              </div>
            </div>
          )}

          {step === "result" && graded && questions && (
            <div className="space-y-3">
              <Card className="shadow-soft">
                <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="grid size-20 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground">
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold">{graded.overallScore.toFixed(1)}</div>
                      <div className="text-[10px] uppercase">of 10</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Overall feedback</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{graded.summary}</p>
                  </div>
                </CardContent>
              </Card>
              {questions.map((q, i) => {
                const fb = graded.perAnswer[i];
                if (!fb) return null;
                return (
                  <Card key={i} className="shadow-soft">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">{i + 1}. {q.question}</p>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", fb.score >= 7 ? "bg-success/10 text-success" : fb.score >= 5 ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive")}>
                          {fb.score.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-success/5 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-success">Strengths</p>
                          <ul className="mt-1.5 space-y-1 text-sm">{fb.strengths.map((s, j) => <li key={j}>✓ {s}</li>)}</ul>
                        </div>
                        <div className="rounded-xl bg-warning/5 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-warning">Improve</p>
                          <ul className="mt-1.5 space-y-1 text-sm">{fb.improvements.map((s, j) => <li key={j}>→ {s}</li>)}</ul>
                        </div>
                      </div>
                      {fb.modelAnswer && (
                        <div className="mt-3 rounded-xl bg-muted/60 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Model answer</p>
                          <p className="mt-1 text-sm">{fb.modelAnswer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("setup"); setQuestions(null); setGraded(null); }}>New mock round</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coach" className="mt-4">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><MessageSquareText className="size-4.5" /></span>
                <div>
                  <h3 className="font-display font-bold">Stuck on one question?</h3>
                  <p className="text-xs text-muted-foreground">Paste any question and your draft answer for instant feedback.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="coach-q">Interview question</Label>
                  <Input id="coach-q" value={coachQ} onChange={(e) => setCoachQ(e.target.value)} placeholder="e.g. Why should we hire you?" maxLength={600} className="bg-card" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coach-a">Your answer</Label>
                  <Textarea id="coach-a" value={coachA} onChange={(e) => setCoachA(e.target.value)} rows={5} maxLength={6000} placeholder="Write your answer the way you'd say it out loud…" className="bg-card" />
                </div>
                <Button className="gradient-primary" onClick={askCoach} disabled={coachBusy}>
                  {coachBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Get feedback
                </Button>
                {coachBusy && (
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" />
                  </div>
                )}
                {coachResult && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded-full px-3 py-1 text-sm font-bold", coachResult.score >= 7 ? "bg-success/10 text-success" : coachResult.score >= 5 ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive")}>
                        {coachResult.score.toFixed(1)}/10
                      </span>
                      <Progress value={coachResult.score * 10} className="h-2 flex-1" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-success/5 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-success">Strengths</p>
                        <ul className="mt-1.5 space-y-1 text-sm">{coachResult.strengths.map((s, j) => <li key={j}>✓ {s}</li>)}</ul>
                      </div>
                      <div className="rounded-xl bg-warning/5 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-warning">Improve</p>
                        <ul className="mt-1.5 space-y-1 text-sm">{coachResult.improvements.map((s, j) => <li key={j}>→ {s}</li>)}</ul>
                      </div>
                    </div>
                    {coachResult.modelAnswer && (
                      <div className="rounded-xl bg-muted/60 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Model answer</p>
                        <p className="mt-1 text-sm">{coachResult.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* History */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><BrainCircuit className="size-5 text-primary" /> Mock interview history</h2>
        {history.isLoading ? (
          <div className="mt-3 space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : (history.data ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No mock interviews yet — your graded rounds are saved here automatically.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {(history.data ?? []).map((h) => (
              <details key={h.id} className="group rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-primary-soft text-primary">{TYPE_LABEL[h.interview_type] ?? h.interview_type}</Badge>
                    <span className="truncate text-sm font-semibold">{h.role}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.overall_score != null && (
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", h.overall_score >= 7 ? "bg-success/10 text-success" : h.overall_score >= 5 ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive")}>
                        {Number(h.overall_score).toFixed(1)}/10
                      </span>
                    )}
                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    <button
                      onClick={(e) => { e.preventDefault(); removeMutation.mutate(h.id); }}
                      className="text-destructive/70 hover:text-destructive"
                      aria-label="Delete interview"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </summary>
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">{h.summary}</p>
                  {h.questions.map((q, i) => (
                    <div key={i} className="rounded-xl bg-muted/50 p-3 text-sm">
                      <p className="font-semibold">{i + 1}. {q.question}</p>
                      <p className="mt-1 text-muted-foreground"><span className="font-semibold text-foreground">Your answer:</span> {q.answer}</p>
                      {q.feedback && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary" className="bg-primary-soft text-primary">Score {Number(q.feedback.score).toFixed(1)}/10</Badge>
                          {q.feedback.improvements[0] && <Badge variant="secondary">Improve: {q.feedback.improvements[0]}</Badge>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
