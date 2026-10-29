import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useServerFn } from "@tanstack/react-start";
import { FileText, FileUp, Loader2, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { extractResumeText, validateResumeFile } from "@/lib/extract-text";
import { analyzeResumeText } from "@/server/ai.functions";
import { deleteResumeAnalysis, listResumeAnalyses, saveResumeAnalysis } from "@/server/data.functions";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Analyzer — PrepMate" },
      { name: "description", content: "Upload your resume and a job description to get an ATS-style score, skill matching and concrete improvement suggestions." },
      { property: "og:title", content: "Resume Analyzer — PrepMate" },
      { property: "og:description", content: "Upload your resume and a job description to get an ATS-style score, skill matching and concrete improvement suggestions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumePage,
});

type Analysis = {
  overallScore: number;
  atsReadiness: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  keywordsPresent: string[];
  keywordsMissing: string[];
  sectionFeedback: { section: string; feedback: string }[];
  suggestions: { title: string; detail: string; priority: "high" | "medium" | "low" }[];
};
type HistoryRow = { id: string; file_name: string; file_type: string; job_description: string; analysis: unknown; created_at: string };

function asAnalysis(raw: unknown): Analysis | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Partial<Analysis>;
  if (typeof a.overallScore !== "number") return null;
  return {
    overallScore: a.overallScore,
    atsReadiness: a.atsReadiness ?? 0,
    summary: a.summary ?? "",
    matchedSkills: a.matchedSkills ?? [],
    missingSkills: a.missingSkills ?? [],
    keywordsPresent: a.keywordsPresent ?? [],
    keywordsMissing: a.keywordsMissing ?? [],
    sectionFeedback: a.sectionFeedback ?? [],
    suggestions: a.suggestions ?? [],
  };
}

function ResumePage() {
  const fetchHistory = useServerFn(listResumeAnalyses);
  const save = useServerFn(saveResumeAnalysis);
  const remove = useServerFn(deleteResumeAnalysis);
  const analyze = useServerFn(analyzeResumeText);
  const queryClient = useQueryClient();

  const history = useQuery({ queryKey: ["resumes"], queryFn: () => fetchHistory() });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [phase, setPhase] = useState<"idle" | "reading" | "uploading" | "analyzing" | "done">("idle");
  const [result, setResult] = useState<Analysis | null>(null);
  const [viewing, setViewing] = useState<HistoryRow | null>(null);

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      if (viewing) setViewing(null);
      toast.success("Analysis deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleAnalyze() {
    if (!file) return toast.error("Choose a PDF or DOCX resume first.");
    const err = validateResumeFile(file);
    if (err) {
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      return toast.error(err);
    }
    try {
      setPhase("reading");
      const text = await extractResumeText(file);

      setPhase("uploading");
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired — sign in again.");
      const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(-80);
      const filePath = `${userId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw new Error("Couldn't store the file: " + upErr.message);

      setPhase("analyzing");
      const analysis = await analyze({ data: { resumeText: text, jobDescription: jd.trim() } });
      await save({
        data: {
          fileName: file.name,
          filePath,
          fileType: file.type || "application/pdf",
          jobDescription: jd.trim(),
          extractedText: text,
          analysis: analysis as unknown as Record<string, unknown>,
        },
      });
      invalidate();
      setResult(analysis);
      setViewing(null);
      setPhase("done");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      toast.success("Analysis ready!");
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Analysis failed.");
    }
  }

  const busy = phase !== "idle" && phase !== "done";
  const shown: Analysis | null = result ?? (viewing ? asAnalysis(viewing.analysis) : null);

  return (
    <AppShell title="Resume Analyzer" subtitle="ATS-style review matched to real job descriptions." activeTo="/resume">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upload panel */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-bold">Analyze a resume</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF or DOCX up to 10 MB. Files are stored privately — only your account can read them.
            </p>
            <label
              className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
            >
              <FileUp className="size-6 text-primary" />
              <span className="text-sm font-semibold">{file ? file.name : "Drop your resume here or click to browse"}</span>
              <span className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(0)} KB selected` : "PDF or DOCX, max 10 MB"}</span>
              <input ref={fileInput} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="jd">Job description (optional)</Label>
              <Textarea id="jd" value={jd} onChange={(e) => setJd(e.target.value)} rows={5} maxLength={8000} placeholder="Paste the target job description to get matched/missing skills and keywords…" />
            </div>
            {busy && (
              <div className="mt-4 space-y-2">
                <Progress value={phase === "reading" ? 25 : phase === "uploading" ? 50 : 80} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {phase === "reading" && "Reading text from your resume…"}
                  {phase === "uploading" && "Storing your file securely…"}
                  {phase === "analyzing" && "The AI is reviewing your resume…"}
                </p>
              </div>
            )}
            <Button className="mt-4 w-full gradient-primary" onClick={handleAnalyze} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyze resume
            </Button>
          </CardContent>
        </Card>

        {/* Result panel */}
        <div className="space-y-4">
          {shown ? (
            <>
              <Card className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <Gauge score={shown.overallScore} label="Overall" />
                    <Gauge score={shown.atsReadiness} label="ATS ready" />
                    <div className="min-w-40 flex-1">
                      <p className="text-sm leading-relaxed text-muted-foreground">{shown.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                  <ChipList title="Matched skills" tone="success" items={shown.matchedSkills} empty="No skills matched" />
                  <ChipList title="Missing skills" tone="warning" items={shown.missingSkills} empty="Nothing obviously missing" />
                  <ChipList title="Keywords present" tone="success" items={shown.keywordsPresent} empty="—" />
                  <ChipList title="Keywords missing" tone="warning" items={shown.keywordsMissing} empty="—" />
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-6">
                  <h4 className="font-display font-bold">Section feedback</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {shown.sectionFeedback.map((s, i) => (
                      <li key={i} className="rounded-xl bg-muted/60 px-3 py-2">
                        <span className="font-semibold">{s.section}:</span> <span className="text-muted-foreground">{s.feedback}</span>
                      </li>
                    ))}
                  </ul>
                  <h4 className="mt-5 font-display font-bold">Improvement suggestions</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {shown.suggestions.map((s, i) => (
                      <li key={i} className="rounded-xl border border-border px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn(
                            "text-[10px] capitalize",
                            s.priority === "high" && "bg-destructive/10 text-destructive",
                            s.priority === "medium" && "bg-warning/15 text-warning",
                            s.priority === "low" && "bg-muted text-muted-foreground",
                          )}>{s.priority}</Badge>
                          <span className="font-semibold">{s.title}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{s.detail}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><FileText className="size-6" /></span>
                <h3 className="font-display font-bold">No analysis yet</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Upload a resume (add a job description for the best match) and your report appears here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Past analyses</h2>
        {history.isLoading ? (
          <div className="mt-3 space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
        ) : (history.data ?? []).length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Your analyses are saved here so you can track improvements over time.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {(history.data ?? []).map((h) => {
              const a = asAnalysis(h.analysis);
              return (
                <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><FileText className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{h.file_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}{h.job_description ? " · matched to a job description" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a && (
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", a.overallScore >= 70 ? "bg-success/10 text-success" : a.overallScore >= 50 ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive")}>
                        {Math.round(a.overallScore)}/100
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { setResult(null); setViewing(h); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      View
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMutation.mutate(h.id)} aria-label={`Delete analysis of ${h.file_name}`}>
                      {removeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-6 flex items-start gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
        AI feedback is a strong starting point, not a guarantee — always review suggestions and keep your resume truthful.
      </p>
    </AppShell>
  );
}

function Gauge({ score, label }: { score: number; label: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="text-center">
      <div className="relative size-24">
        <svg viewBox="0 0 88 88" className="size-full -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={score >= 70 ? "var(--color-success)" : score >= 50 ? "var(--color-warning)" : "var(--color-destructive)"}
            strokeWidth="8" strokeLinecap="round" strokeDasharray={`${filled} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-display text-xl font-bold">{Math.round(score)}</div>
      </div>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function ChipList({ title, items, tone, empty }: { title: string; items: string[]; tone: "success" | "warning"; empty: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {items.map((s) => (
            <Badge key={s} variant="secondary" className={cn(tone === "success" ? "bg-success/10 text-success" : "bg-warning/15 text-warning")}>
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
