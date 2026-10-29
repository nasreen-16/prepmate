import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ExternalLink,
  Filter,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  clearDemoData,
  createProblem,
  deleteProblem,
  listProblems,
  seedDemoData,
  updateProblem,
} from "@/server/data.functions";

export const Route = createFileRoute("/_authenticated/dsa")({
  head: () => ({
    meta: [
      { title: "DSA Tracker — PrepMate" },
      { name: "description", content: "Track every DSA problem: topics, difficulty, platforms, notes and revision dates with progress charts." },
      { property: "og:title", content: "DSA Tracker — PrepMate" },
      { property: "og:description", content: "Track every DSA problem: topics, difficulty, platforms, notes and revision dates with progress charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DsaPage,
});

type Problem = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  platform: string;
  url: string;
  status: string;
  notes: string;
  revision_date: string | null;
  is_demo: boolean;
};

const TOPICS = ["Arrays", "Strings", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs", "Searching", "Sorting", "Dynamic Programming", "Heaps", "Design", "Bit Manipulation", "Math"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const PLATFORMS = [
  { value: "leetcode", label: "LeetCode" },
  { value: "gfg", label: "GeeksforGeeks" },
  { value: "hackerrank", label: "HackerRank" },
  { value: "codeforces", label: "Codeforces" },
  { value: "codechef", label: "CodeChef" },
  { value: "other", label: "Other" },
];
const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "solved", label: "Solved" },
  { value: "revisit", label: "Revisit" },
];
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));
const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(PLATFORMS.map((p) => [p.value, p.label]));

const emptyForm = { title: "", topic: "Arrays", difficulty: "medium", platform: "leetcode", url: "", status: "todo", notes: "", revisionDate: "" };

function DsaPage() {
  const fetchProblems = useServerFn(listProblems);
  const create = useServerFn(createProblem);
  const update = useServerFn(updateProblem);
  const remove = useServerFn(deleteProblem);
  const seed = useServerFn(seedDemoData);
  const clearDemo = useServerFn(clearDemoData);
  const queryClient = useQueryClient();

  const problems = useQuery({ queryKey: ["problems"], queryFn: () => fetchProblems() });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["problems"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) => update({ data: { id: input.id, patch: { status: input.status } } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [fTopic, setFTopic] = useState("all");
  const [fDifficulty, setFDifficulty] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Problem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Problem | null>(null);

  const rows = problems.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (p) =>
        (fTopic === "all" || p.topic === fTopic) &&
        (fDifficulty === "all" || p.difficulty === fDifficulty) &&
        (fStatus === "all" || p.status === fStatus) &&
        (!q || p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q) || p.notes.toLowerCase().includes(q)),
    );
  }, [rows, search, fTopic, fDifficulty, fStatus]);

  const solvedByDifficulty = DIFFICULTIES.map((d) => ({
    name: d[0].toUpperCase() + d.slice(1),
    Solved: rows.filter((p) => p.difficulty === d && p.status === "solved").length,
    Attempted: rows.filter((p) => p.difficulty === d && p.status !== "solved").length,
  }));
  const topicCounts = useMemo(() => {
    const m = new Map<string, { solved: number; total: number }>();
    for (const p of rows) {
      const cur = m.get(p.topic) ?? { solved: 0, total: 0 };
      cur.total += 1;
      if (p.status === "solved") cur.solved += 1;
      m.set(p.topic, cur);
    }
    return [...m.entries()].map(([topic, v]) => ({ topic, ...v })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [rows]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }
  function openEdit(p: Problem) {
    setEditing(p);
    setForm({ title: p.title, topic: p.topic, difficulty: p.difficulty, platform: p.platform, url: p.url, status: p.status, notes: p.notes, revisionDate: p.revision_date ?? "" });
    setDialogOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 2) return toast.error("Problem title is required.");
    if (form.url && !/^https?:\/\//.test(form.url)) return toast.error("Problem URL must start with http:// or https://");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        topic: form.topic,
        difficulty: form.difficulty,
        platform: form.platform,
        url: form.url.trim(),
        status: form.status,
        notes: form.notes.trim(),
        revisionDate: form.revisionDate || null,
      };
      if (editing) await update({ data: { id: editing.id, patch: payload } });
      else await create({ data: payload });
      invalidate();
      setDialogOpen(false);
      toast.success(editing ? "Problem updated." : "Problem added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const hasDemo = rows.some((p) => p.is_demo);
  const solvedCount = rows.filter((p) => p.status === "solved").length;

  return (
    <AppShell title="DSA Tracker" subtitle={`${solvedCount} of ${rows.length} problems solved`} activeTo="/dsa">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold">Solved by difficulty</h3>
            <div className="mt-2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={solvedByDifficulty} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={34} />
                  <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Solved" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Attempted" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold">Progress by topic (top 8)</h3>
            {topicCounts.length === 0 ? (
              <p className="grid h-52 place-items-center text-sm text-muted-foreground">Log problems to see topic progress.</p>
            ) : (
              <div className="mt-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topicCounts} dataKey="solved" nameKey="topic" innerRadius={45} outerRadius={80} strokeWidth={2} stroke="var(--color-card)" paddingAngle={2}>
                      {topicCounts.map((_, i) => (
                        <Cell key={i} fill={[ "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-primary-glow)", "var(--color-primary)", "var(--color-muted-foreground)" ][i % 8]} />
                      ))}
                    </Pie>
                    <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search problems…" className="bg-card pl-9" />
        </div>
        <Select value={fTopic} onValueChange={setFTopic}>
          <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fDifficulty} onValueChange={setFDifficulty}>
          <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="gradient-primary" onClick={openCreate}><Plus className="size-4" /> Add problem</Button>
      </div>

      {problems.isLoading ? (
        <div className="mt-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
      ) : problems.error ? (
        <Card className="mt-4"><CardContent className="p-6 text-sm text-destructive">Couldn't load problems: {problems.error.message}</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="mt-4 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><ListChecks className="size-6" /></span>
            <h3 className="font-display font-bold">{rows.length === 0 ? "No problems tracked yet" : "No problems match your filters"}</h3>
            {rows.length === 0 ? (
              <>
                <p className="max-w-sm text-sm text-muted-foreground">Add your first problem, or load clearly-labeled demo data (removable anytime).</p>
                <div className="flex gap-2">
                  <Button className="gradient-primary" onClick={openCreate}><Plus className="size-4" /> Add problem</Button>
                  <Button variant="outline" disabled={seed.isPending} onClick={() => seed.mutate()}>
                    {seed.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Load demo data
                  </Button>
                  {hasDemo && <Button variant="ghost" onClick={() => clearDemo.mutate()}>Remove demo data</Button>}
                </div>
              </>
            ) : (
              <Button variant="outline" onClick={() => { setSearch(""); setFTopic("all"); setFDifficulty("all"); setFStatus("all"); }}>
                <Filter className="size-4" /> Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="hidden grid-cols-[1fr_130px_110px_120px_100px_92px] gap-2 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Problem</span><span>Topic</span><span>Difficulty</span><span>Platform</span><span>Status</span><span>Actions</span>
          </div>
          {filtered.map((p) => (
            <div key={p.id} className="grid gap-2 border-b border-border/60 px-4 py-3 last:border-0 md:grid-cols-[1fr_130px_110px_120px_100px_92px] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <a href={p.url || undefined} target="_blank" rel="noreferrer" className={cn("truncate font-semibold", p.url && "underline decoration-primary/40 underline-offset-2 hover:text-primary")} title={p.title}>
                    {p.title}
                  </a>
                  {p.url && <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />}
                  {p.is_demo && <Badge variant="secondary" className="text-[10px] bg-warning/15 text-warning">Demo</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {p.revision_date && <span>Revise by {p.revision_date}</span>}
                  {p.notes && <span className="truncate max-w-64 italic">"{p.notes}"</span>}
                </div>
              </div>
              <span className="text-sm">{p.topic}</span>
              <span><Badge variant="secondary" className={cn(
                "capitalize",
                p.difficulty === "easy" && "bg-success/10 text-success",
                p.difficulty === "medium" && "bg-warning/15 text-warning",
                p.difficulty === "hard" && "bg-destructive/10 text-destructive",
              )}>{p.difficulty}</Badge></span>
              <span className="text-sm text-muted-foreground">{PLATFORM_LABEL[p.platform] ?? p.platform}</span>
              <span>
                <Select value={p.status} onValueChange={(v) => statusMutation.mutate({ id: p.id, status: v })}>
                  <SelectTrigger className="h-8 w-[110px] bg-muted/40 text-xs" aria-label={`Status of ${p.title}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={`Edit ${p.title}`}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(p)} aria-label={`Delete ${p.title}`}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit problem" : "Add problem"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Title</Label>
              <Input id="p-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Merge Intervals" required maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-url">Problem URL</Label>
              <Input id="p-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://leetcode.com/problems/…" maxLength={500} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-rev">Revision date</Label>
                <Input id="p-rev" type="date" value={form.revisionDate} onChange={(e) => setForm({ ...form, revisionDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-notes">Notes</Label>
              <Textarea id="p-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Approach, edge cases, what to remember…" maxLength={2000} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : editing ? "Save changes" : "Add problem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete this problem?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">"{confirmDelete?.title}" will be permanently removed.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => confirmDelete && remove.mutate(confirmDelete.id, { onSuccess: () => { invalidate(); setConfirmDelete(null); toast.success("Problem deleted."); }, onError: (e) => toast.error(e.message) })}>
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
