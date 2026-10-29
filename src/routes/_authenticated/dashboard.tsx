import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Database,
  FileText,
  Flame,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { computeReadiness, recommendedActions } from "@/lib/placement";
import {
  createTask,
  getDashboardStats,
  listTasks,
  seedDemoData,
  updateTask,
} from "@/server/data.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PrepMate" },
      { name: "description", content: "Your daily placement preparation dashboard: tasks, DSA progress, streaks and readiness." },
      { property: "og:title", content: "Dashboard — PrepMate" },
      { property: "og:description", content: "Your daily placement preparation dashboard: tasks, DSA progress, streaks and readiness." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--color-chart-4)",
  medium: "var(--color-chart-1)",
  hard: "var(--color-chart-3)",
  "Not solved": "var(--color-muted)",
};

function DashboardPage() {
  const fetchStats = useServerFn(getDashboardStats);
  const fetchTasks = useServerFn(listTasks);
  const seed = useServerFn(seedDemoData);
  const toggle = useServerFn(updateTask);
  const addTask = useServerFn(createTask);
  const queryClient = useQueryClient();

  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fetchStats() });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const [newTitle, setNewTitle] = useState("");
  const [seeding, setSeeding] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; completed: boolean }) => toggle({ data: { id: input.id, patch: { completed: input.completed } } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }) && queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addMutation = useMutation({
    mutationFn: (title: string) => addTask({ data: { title, dueDate: new Date().toISOString().slice(0, 10), category: "other" } }),
    onSuccess: () => {
      setNewTitle("");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Task added to today.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedMutation = useMutation({
    mutationFn: () => seed(),
    onSuccess: () => {
      void queryClient.invalidateQueries();
      toast.success("Demo data loaded — labeled entries you can remove anytime.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (stats.isLoading || tasks.isLoading) {
    return (
      <AppShell title="Dashboard" subtitle="Loading your progress…" activeTo="/dashboard">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}
        </div>
      </AppShell>
    );
  }
  if (stats.error || tasks.error) {
    return (
      <AppShell title="Dashboard" activeTo="/dashboard">
        <Card><CardContent className="p-6 text-sm text-destructive">Couldn't load your dashboard: {(stats.error ?? tasks.error)!.message}</CardContent></Card>
      </AppShell>
    );
  }

  const s = stats.data!;
  const allTasks = tasks.data ?? [];
  const today = s.today;
  const todayTasks = allTasks.filter((t) => t.due_date === today && !t.completed);
  const overdueTasks = allTasks.filter((t) => !t.completed && t.due_date && t.due_date < today);

  const readiness = computeReadiness({
    dsaSolved: s.dsa.solved,
    activeDaysLast14: s.streak.activeDaysLast14,
    streakCurrent: s.streak.current,
    quizAvg: s.quiz.avgScore,
    interviewAvg: s.interviews.avgScore,
    resumeScore: s.resume.latestScore,
  });
  const isEmpty = allTasks.length === 0 && s.dsa.total === 0;

  const donutData = [
    { name: "Easy solved", value: s.dsa.byDifficulty.easy },
    { name: "Medium solved", value: s.dsa.byDifficulty.medium },
    { name: "Hard solved", value: s.dsa.byDifficulty.hard },
    { name: "Not solved", value: Math.max(0, s.dsa.total - s.dsa.solved) },
  ].filter((d) => d.value > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title="Dashboard" subtitle={`${greeting}! Here's where you stand today.`} activeTo="/dashboard">
      {isEmpty && (
        <Card className="mb-6 border-dashed">
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display font-bold">Your workspace is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Want to explore first? Load a clearly-labeled demo planner and DSA list — remove it anytime.
              </p>
            </div>
            <Button className="gradient-primary" disabled={seeding || seedMutation.isPending} onClick={() => { setSeeding(true); seedMutation.mutate(); }}>
              {seedMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Load demo data
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Readiness */}
        <Card className="lg:col-span-1 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4 text-primary" /> Placement readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ReadinessRing score={readiness.score} />
              <div className="flex-1 space-y-2">
                {readiness.breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{b.label}</span>
                      <span className="text-muted-foreground">{b.earned}/{b.weight}</span>
                    </div>
                    <Progress value={(b.earned / b.weight) * 100} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak + quick stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current streak</p>
                  <p className="mt-1 font-display text-3xl font-bold">{s.streak.current} <span className="text-base font-semibold text-muted-foreground">days</span></p>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-warning/15 text-warning">
                  <Flame className="size-6" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Longest: {s.streak.longest} days · Active {s.streak.activeDaysLast14}/14 days</p>
            </CardContent>
          </Card>
          <StatCard icon={ListChecks} label="DSA solved" value={`${s.dsa.solved}/${s.dsa.total}`} sub={`${s.dsa.inProgress} in progress · ${s.dsa.revisit} to revisit`} to="/dsa" />
          <StatCard icon={CheckCircle2} label="Tasks completed" value={`${s.tasks.completedTotal}/${s.tasks.total}`} sub={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "Nothing overdue"} to="/planner" />
          <StatCard icon={Database} label="Quiz average" value={s.quiz.avgScore == null ? "—" : `${Math.round(s.quiz.avgScore)}%`} sub={`${s.quiz.attempts} attempts so far`} to="/quiz" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Today's tasks */}
        <Card className="shadow-soft">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Today's tasks</CardTitle>
            <Badge variant="secondary" className="bg-primary-soft text-primary">{todayTasks.length} open</Badge>
          </CardHeader>
          <CardContent>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newTitle.trim().length >= 3) addMutation.mutate(newTitle.trim());
              }}
            >
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Quick add a task for today…" maxLength={160} />
              <Button type="submit" size="icon" className="gradient-primary shrink-0" aria-label="Add task" disabled={newTitle.trim().length < 3}>
                <Plus className="size-4" />
              </Button>
            </form>
            {todayTasks.length === 0 && overdueTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">All clear today. Plan something in the planner.</p>
            ) : (
              <ul className="space-y-2">
                {overdueTasks.slice(0, 3).map((t) => (
                  <TaskRow key={t.id} id={t.id} title={t.title} overdue onToggle={(c) => toggleMutation.mutate({ id: t.id, completed: c })} pending={toggleMutation.isPending} />
                ))}
                {todayTasks.slice(0, 5).map((t) => (
                  <TaskRow key={t.id} id={t.id} title={t.title} onToggle={(c) => toggleMutation.mutate({ id: t.id, completed: c })} pending={toggleMutation.isPending} />
                ))}
              </ul>
            )}
            <Button variant="ghost" className="mt-3 w-full text-primary" asChild>
              <Link to="/planner">Open the planner <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Weekly activity */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.weekly} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={34} />
                  <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Bar dataKey="problems" name="Problems solved" stackId="a" fill="var(--color-chart-1)" radius={[0, 0, 3, 3]} />
                  <Bar dataKey="tasks" name="Tasks done" stackId="a" fill="var(--color-chart-2)" />
                  <Bar dataKey="quizzes" name="Quizzes" stackId="a" fill="var(--color-chart-4)" />
                  <Bar dataKey="interviews" name="Mock interviews" stackId="a" fill="var(--color-chart-5)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* DSA donut */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">DSA progress by difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            {s.dsa.total === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No problems logged yet — start in the <Link to="/dsa" className="font-semibold text-primary">DSA tracker</Link>.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} strokeWidth={2} stroke="var(--color-card)">
                        {donutData.map((d) => <Cell key={d.name} fill={DIFFICULTY_COLORS[d.name] ?? "var(--color-muted)"} />)}
                      </Pie>
                      <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5 text-sm">
                  {donutData.map((d) => (
                    <li key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: DIFFICULTY_COLORS[d.name] }} />
                        {d.name}
                      </span>
                      <span className="font-semibold">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended actions */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended next actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm">
              {recommendedActions({
                dsaSolved: s.dsa.solved,
                activeDaysLast14: s.streak.activeDaysLast14,
                streakCurrent: s.streak.current,
                quizAvg: s.quiz.avgScore,
                interviewAvg: s.interviews.avgScore,
                resumeScore: s.resume.latestScore,
                overdueTasks: s.tasks.overdueCount,
              }).map((a) => (
                <li key={a} className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {a}
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="mt-3 w-full text-primary" asChild>
              <Link to="/analytics">See full analytics <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, sub, to }: { icon: typeof ListChecks; label: string; value: string; sub: string; to: string }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-4.5" /></span>
        </div>
        <p className="mt-1 font-display text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function TaskRow({ id, title, overdue, onToggle, pending }: { id: string; title: string; overdue?: boolean; onToggle: (completed: boolean) => void; pending: boolean }) {
  void id;
  return (
    <li className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm ${overdue ? "border-destructive/40 bg-destructive/5" : "bg-card"}`}>
      <button onClick={() => onToggle(true)} disabled={pending} aria-label={`Complete ${title}`} className="text-primary transition-transform hover:scale-110 disabled:opacity-50">
        {overdue ? <Circle className="size-5" /> : <Circle className="size-5" />}
      </button>
      <span className={`flex-1 ${overdue ? "font-semibold text-destructive" : ""}`}>{title}</span>
      {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
    </li>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${filled} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{score}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">of 100</div>
        </div>
      </div>
    </div>
  );
}
