import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CalendarDays, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { clearDemoData, createTask, deleteTask, listTasks, seedDemoData, updateTask } from "@/server/data.functions";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Study Planner — PrepMate" },
      { name: "description", content: "Plan your placement prep: daily tasks, priorities, due dates and completion tracking." },
      { property: "og:title", content: "Study Planner — PrepMate" },
      { property: "og:description", content: "Plan your placement prep: daily tasks, priorities, due dates and completion tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

type TaskRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
  is_demo: boolean;
};

const CATEGORIES = [
  { value: "dsa", label: "DSA" },
  { value: "aptitude", label: "Aptitude" },
  { value: "core_cs", label: "Core CS" },
  { value: "project", label: "Project" },
  { value: "resume", label: "Resume" },
  { value: "revision", label: "Revision" },
  { value: "other", label: "Other" },
] as const;

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const emptyForm = { title: "", description: "", category: "other", priority: "medium", dueDate: "" };

function PlannerPage() {
  const fetchTasks = useServerFn(listTasks);
  const create = useServerFn(createTask);
  const update = useServerFn(updateTask);
  const remove = useServerFn(deleteTask);
  const seed = useServerFn(seedDemoData);
  const clearDemo = useServerFn(clearDemoData);
  const queryClient = useQueryClient();

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [confirmDelete, setConfirmDelete] = useState<TaskRow | null>(null);

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; completed: boolean }) => update({ data: { id: input.id, patch: { completed: input.completed } } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      setConfirmDelete(null);
      toast.success("Task deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const seedMutation = useMutation({
    mutationFn: () => seed(),
    onSuccess: () => {
      invalidate();
      toast.success("Demo data loaded.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const clearMutation = useMutation({
    mutationFn: () => clearDemo(),
    onSuccess: () => {
      invalidate();
      toast.success("Demo data removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().slice(0, 10);
  const rows = tasks.data ?? [];
  const filtered = useMemo(
    () => rows.filter((t) => categoryFilter === "all" || t.category === categoryFilter),
    [rows, categoryFilter],
  );

  const groups = useMemo(() => {
    const g: { key: string; label: string; items: TaskRow[] }[] = [
      { key: "overdue", label: "Overdue", items: [] },
      { key: "today", label: "Today", items: [] },
      { key: "upcoming", label: "Upcoming", items: [] },
      { key: "someday", label: "No due date", items: [] },
      { key: "done", label: "Completed", items: [] },
    ];
    for (const t of filtered) {
      if (t.completed) g[4].items.push(t);
      else if (!t.due_date) g[3].items.push(t);
      else if (t.due_date < today) g[0].items.push(t);
      else if (t.due_date === today) g[1].items.push(t);
      else g[2].items.push(t);
    }
    return g.filter((x) => x.items.length > 0);
  }, [filtered, today]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }
  function openEdit(t: TaskRow) {
    setEditing(t);
    setForm({ title: t.title, description: t.description, category: t.category, priority: t.priority, dueDate: t.due_date ?? "" });
    setDialogOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.trim().length < 3) return toast.error("Task title must be at least 3 characters.");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        dueDate: form.dueDate || null,
      };
      if (editing) await update({ data: { id: editing.id, patch: payload } });
      else await create({ data: payload });
      invalidate();
      setDialogOpen(false);
      toast.success(editing ? "Task updated." : "Task added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const hasDemo = rows.some((t) => t.is_demo);

  return (
    <AppShell title="Study Planner" subtitle="Small daily wins compound into offers." activeTo="/planner">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {hasDemo && (
            <Button variant="outline" disabled={clearMutation.isPending} onClick={() => clearMutation.mutate()}>
              Remove demo data
            </Button>
          )}
          <Button className="gradient-primary" onClick={openCreate}>
            <Plus className="size-4" /> New task
          </Button>
        </div>
      </div>

      {tasks.isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : tasks.error ? (
        <Card><CardContent className="p-6 text-sm text-destructive">Couldn't load tasks: {tasks.error.message}</CardContent></Card>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><CalendarCheck className="size-6" /></span>
            <h3 className="font-display font-bold">No tasks here yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first task — or load a clearly-labeled demo planner to see how it works (removable anytime).
            </p>
            <div className="flex gap-2">
              <Button className="gradient-primary" onClick={openCreate}><Plus className="size-4" /> New task</Button>
              <Button variant="outline" disabled={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
                {seedMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Load demo data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {g.key === "overdue" && <span className="size-2 rounded-full bg-destructive" />}
                {g.key === "today" && <CalendarDays className="size-4 text-primary" />}
                {g.label} <span className="font-normal">({g.items.length})</span>
              </h2>
              <div className="space-y-2">
                {g.items.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-opacity",
                      t.completed && "opacity-60",
                    )}
                  >
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, completed: !t.completed })}
                      disabled={toggleMutation.isPending}
                      aria-label={t.completed ? `Mark ${t.title} as not done` : `Mark ${t.title} as done`}
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        t.completed ? "border-primary bg-primary text-primary-foreground" : "border-primary/50 text-transparent hover:border-primary",
                      )}
                    >
                      <svg viewBox="0 0 12 12" className="size-3 fill-current"><path d="M4.5 9.2 1.8 6.5l1-1 1.7 1.7 4.7-4.7 1 1z" /></svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("truncate font-semibold", t.completed && "line-through")}>{t.title}</p>
                        {t.is_demo && <Badge variant="secondary" className="text-[10px] bg-warning/15 text-warning">Demo</Badge>}
                      </div>
                      {t.description && <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge variant="secondary" className="bg-primary-soft text-primary">{CATEGORY_LABEL[t.category] ?? t.category}</Badge>
                        <Badge variant="secondary" className={cn(
                          t.priority === "high" && "bg-destructive/10 text-destructive",
                          t.priority === "medium" && "bg-warning/15 text-warning",
                          t.priority === "low" && "bg-muted text-muted-foreground",
                        )}>{t.priority}</Badge>
                        {t.due_date && (
                          <span className={cn("text-muted-foreground", !t.completed && t.due_date < today && "font-semibold text-destructive")}>
                            Due {t.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label={`Edit ${t.title}`}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmDelete(t)} aria-label={`Delete ${t.title}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Solve 5 DP problems" maxLength={160} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Notes (optional)</Label>
              <Textarea id="task-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} maxLength={1000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : editing ? "Save changes" : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">"{confirmDelete?.title}" will be permanently removed.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}>
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
