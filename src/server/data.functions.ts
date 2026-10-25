/**
 * App data server functions — CRUD over the user's private rows (RLS enforces
 * ownership), dashboard aggregation and clearly-labeled demo data.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idInput = z.object({ id: z.string().uuid() });

// ------------------------------------------------------------------ profile

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const profilePatch = z.object({
  fullName: z.string().max(120),
  college: z.string().max(160),
  branch: z.string().max(120),
  graduationYear: z.number().int().min(2020).max(2035).nullable(),
  targetRoles: z.array(z.string().max(60)).max(10),
  bio: z.string().max(600),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profilePatch.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        college: data.college,
        branch: data.branch,
        graduation_year: data.graduationYear,
        target_roles: data.targetRoles,
        bio: data.bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// -------------------------------------------------------------------- tasks

const taskPatch = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(1000).optional(),
  category: z
    .enum(["dsa", "aptitude", "core_cs", "project", "resume", "revision", "other"])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  completed: z.boolean().optional(),
});

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("planner_tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

const createTaskInput = taskPatch.required({ title: true });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createTaskInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("planner_tasks")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description ?? "",
        category: data.category ?? "other",
        priority: data.priority ?? "medium",
        due_date: data.dueDate ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.extend({ patch: taskPatch }).parse(input))
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = {};
    if (data.patch.title !== undefined) patch.title = data.patch.title;
    if (data.patch.description !== undefined) patch.description = data.patch.description;
    if (data.patch.category !== undefined) patch.category = data.patch.category;
    if (data.patch.priority !== undefined) patch.priority = data.patch.priority;
    if (data.patch.dueDate !== undefined) patch.due_date = data.patch.dueDate;
    if (data.patch.completed !== undefined) {
      patch.completed = data.patch.completed;
      patch.completed_at = data.patch.completed ? new Date().toISOString() : null;
    }
    const { data: row, error } = await context.supabase
      .from("planner_tasks")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("planner_tasks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------------------------------------------------------------ dsa

const problemPatch = z.object({
  title: z.string().min(1).max(200).optional(),
  topic: z.string().min(1).max(60).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  platform: z.enum(["leetcode", "gfg", "hackerrank", "codeforces", "codechef", "other"]).optional(),
  url: z.string().max(500).optional(),
  status: z.enum(["todo", "in_progress", "solved", "revisit"]).optional(),
  notes: z.string().max(2000).optional(),
  revisionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const listProblems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dsa_problems")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

const createProblemInput = problemPatch.required({ title: true, topic: true });

export const createProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createProblemInput.parse(input))
  .handler(async ({ context, data }) => {
    const status = data.status ?? "todo";
    const { data: row, error } = await context.supabase
      .from("dsa_problems")
      .insert({
        user_id: context.userId,
        title: data.title,
        topic: data.topic,
        difficulty: data.difficulty ?? "medium",
        platform: data.platform ?? "leetcode",
        url: data.url ?? "",
        status,
        notes: data.notes ?? "",
        revision_date: data.revisionDate ?? null,
        solved_at: status === "solved" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.extend({ patch: problemPatch }).parse(input))
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "topic", "difficulty", "platform", "url", "notes"] as const) {
      if (data.patch[key] !== undefined) patch[key] = data.patch[key];
    }
    if (data.patch.status !== undefined) {
      patch.status = data.patch.status;
      patch.solved_at = data.patch.status === "solved" ? new Date().toISOString() : null;
    }
    if (data.patch.revisionDate !== undefined) patch.revision_date = data.patch.revisionDate;
    const { data: row, error } = await context.supabase
      .from("dsa_problems")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("dsa_problems")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --------------------------------------------------------------- interviews

export const listMockInterviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mock_interviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data;
  });

const saveInterviewInput = z.object({
  interviewType: z.enum(["technical", "hr", "mixed"]),
  role: z.string().max(80),
  questions: z
    .array(
      z.object({
        question: z.string(),
        category: z.string(),
        answer: z.string(),
        tip: z.string().optional(),
        feedback: z
          .object({
            score: z.number(),
            strengths: z.array(z.string()),
            improvements: z.array(z.string()),
            modelAnswer: z.string(),
          })
          .nullable(),
      }),
    )
    .min(1),
  overallScore: z.number().min(0).max(10).nullable(),
  summary: z.string().max(4000),
});

export const saveMockInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveInterviewInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("mock_interviews")
      .insert({
        user_id: context.userId,
        interview_type: data.interviewType,
        role: data.role,
        questions: data.questions,
        overall_score: data.overallScore,
        summary: data.summary,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMockInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("mock_interviews")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------------------------------------------------------------- resumes

export const listResumeAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("resume_analyses")
      .select("id, file_name, file_type, job_description, analysis, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data;
  });

const saveResumeInput = z.object({
  fileName: z.string().max(255),
  filePath: z.string().max(600),
  fileType: z.string().max(100),
  jobDescription: z.string().max(8000),
  extractedText: z.string().max(16000),
  analysis: z.record(z.string(), z.unknown()),
});

export const saveResumeAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveResumeInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("resume_analyses")
      .insert({
        user_id: context.userId,
        file_name: data.fileName,
        file_path: data.filePath,
        file_type: data.fileType,
        job_description: data.jobDescription,
        extracted_text: data.extractedText,
        analysis: data.analysis,
      })
      .select("id, file_name, file_type, job_description, analysis, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteResumeAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error: fetchError } = await context.supabase
      .from("resume_analyses")
      .select("file_path")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (row) {
      const [, err] = await Promise.all([
        context.supabase.storage.from("resumes").remove([row.file_path]),
        Promise.resolve(null),
      ]);
      void err;
    }
    const { error } = await context.supabase
      .from("resume_analyses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------------------------------------------------------- quiz attempts

const quizTopics = z.enum(["aptitude", "dbms", "oop", "os", "cn"]);

export const listQuizAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quiz_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data;
  });

const saveQuizInput = z.object({
  topic: quizTopics,
  totalQuestions: z.number().int().min(1),
  correctAnswers: z.number().int().min(0),
  score: z.number().min(0).max(100),
  durationSeconds: z.number().int().min(0),
  details: z
    .array(
      z.object({
        questionId: z.string(),
        chosenIndex: z.number().int().min(-1).max(3),
        correct: z.boolean(),
      }),
    )
    .max(100),
});

export const saveQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveQuizInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("quiz_attempts")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        total_questions: data.totalQuestions,
        correct_answers: data.correctAnswers,
        score: data.score,
        duration_seconds: data.durationSeconds,
        details: data.details,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------------------------------------------------------------- dashboard

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const [tasksRes, problemsRes, attemptsRes, interviewsRes, resumesRes] = await Promise.all([
      supabase
        .from("planner_tasks")
        .select("id, title, due_date, completed, completed_at, category, priority")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("dsa_problems").select("id, title, topic, difficulty, status, solved_at"),
      supabase.from("quiz_attempts").select("id, topic, score, created_at"),
      supabase.from("mock_interviews").select("id, overall_score, created_at"),
      supabase.from("resume_analyses").select("id, analysis, created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    for (const res of [tasksRes, problemsRes, attemptsRes, interviewsRes, resumesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const tasks = tasksRes.data ?? [];
    const problems = problemsRes.data ?? [];
    const attempts = attemptsRes.data ?? [];
    const interviews = interviewsRes.data ?? [];
    const resumes = resumesRes.data ?? [];

    const dayKey = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
    const today = new Date().toISOString().slice(0, 10);

    // Weekly activity: last 7 days (oldest → newest)
    const weekly: { date: string; label: string; tasks: number; problems: number; quizzes: number; interviews: number }[] = [];
    const activityDays = new Set<string>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      weekly.push({ date: d, label: new Date(d + "T00:00:00Z").toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }), tasks: 0, problems: 0, quizzes: 0, interviews: 0 });
    }
    const bump = (iso: string | null, kind: "tasks" | "problems" | "quizzes" | "interviews") => {
      const key = dayKey(iso);
      if (!key) return;
      activityDays.add(key);
      const slot = weekly.find((w) => w.date === key);
      if (slot) slot[kind] += 1;
    };
    for (const t of tasks) if (t.completed) bump(t.completed_at, "tasks");
    for (const p of problems) if (p.status === "solved") bump(p.solved_at, "problems");
    for (const a of attempts) bump(a.created_at, "quizzes");
    for (const iv of interviews) bump(iv.created_at, "interviews");

    // Streak: consecutive active days ending today or yesterday
    const sortedDays = [...activityDays].sort();
    let current = 0;
    if (sortedDays.length > 0) {
      const last = sortedDays[sortedDays.length - 1];
      const gapToday = (Date.parse(today) - Date.parse(last)) / 86400000;
      if (gapToday <= 1) {
        current = 1;
        let cursor = Date.parse(last);
        for (let i = sortedDays.length - 2; i >= 0; i--) {
          const prev = Date.parse(sortedDays[i]);
          if ((cursor - prev) / 86400000 === 1) {
            current += 1;
            cursor = prev;
          } else break;
        }
      }
    }
    let longest = 0;
    let run = 0;
    let prev: number | null = null;
    for (const d of sortedDays) {
      const t = Date.parse(d);
      run = prev !== null && (t - prev) / 86400000 === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = t;
    }

    const todayTasks = tasks.filter((t) => t.due_date === today && !t.completed);
    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.due_date !== null && t.due_date < today,
    );

    const dsa = {
      total: problems.length,
      solved: problems.filter((p) => p.status === "solved").length,
      inProgress: problems.filter((p) => p.status === "in_progress").length,
      revisit: problems.filter((p) => p.status === "revisit").length,
      todo: problems.filter((p) => p.status === "todo").length,
      byDifficulty: {
        easy: problems.filter((p) => p.difficulty === "easy" && p.status === "solved").length,
        medium: problems.filter((p) => p.difficulty === "medium" && p.status === "solved").length,
        hard: problems.filter((p) => p.difficulty === "hard" && p.status === "solved").length,
      },
    };

    const topicAgg = new Map<string, { attempts: number; total: number }>();
    for (const a of attempts) {
      const cur = topicAgg.get(a.topic) ?? { attempts: 0, total: 0 };
      cur.attempts += 1;
      cur.total += Number(a.score);
      topicAgg.set(a.topic, cur);
    }
    const quizByTopic = Object.fromEntries(
      [...topicAgg.entries()].map(([topic, v]) => [topic, { attempts: v.attempts, avgScore: Math.round(v.total / v.attempts) }]),
    );
    const quizAvg = attempts.length > 0 ? attempts.reduce((s, a) => s + Number(a.score), 0) / attempts.length : null;

    const interviewScores = interviews
      .map((iv) => (iv.overall_score == null ? null : Number(iv.overall_score)))
      .filter((s): s is number => s !== null);
    const interviewAvg = interviewScores.length > 0 ? interviewScores.reduce((s, v) => s + v, 0) / interviewScores.length : null;

    const latestResume = resumes[0];
    const resumeScore = latestResume
      ? ((latestResume.analysis as Record<string, unknown> | null)?.overallScore as number | undefined) ?? null
      : null;

    const activeDaysLast14 = [...activityDays].filter((d) => (Date.parse(today) - Date.parse(d)) / 86400000 < 14).length;

    return {
      today,
      tasks: {
        todayTotal: todayTasks.length,
        overdueCount: overdueTasks.length,
        completedTotal: tasks.filter((t) => t.completed).length,
        total: tasks.length,
      },
      dsa,
      weekly,
      streak: { current, longest, activeDaysLast14 },
      quiz: { attempts: attempts.length, avgScore: quizAvg, byTopic: quizByTopic },
      interviews: { count: interviews.length, avgScore: interviewAvg },
      resume: { count: resumes.length, latestScore: resumeScore },
    };
  });

// ---------------------------------------------------------------- demo data

const demoTasks = [
  { title: "Solve 5 LeetCode array problems", category: "dsa", priority: "high", dayOffset: 0, completed: true, completedDaysAgo: 0 },
  { title: "Revise OS notes — process scheduling", category: "core_cs", priority: "medium", dayOffset: 0, completed: false },
  { title: "Complete the 'Time & Work' aptitude set", category: "aptitude", priority: "medium", dayOffset: 1, completed: false },
  { title: "Update resume with the latest project", category: "resume", priority: "high", dayOffset: 2, completed: false },
  { title: "Practice HR answers — strengths & weaknesses", category: "other", priority: "low", dayOffset: 3, completed: false },
  { title: "Build a small REST API for the portfolio", category: "project", priority: "low", dayOffset: 5, completed: false },
];

const demoProblems = [
  { title: "Two Sum", topic: "Arrays", difficulty: "easy", platform: "leetcode", status: "solved", solvedDaysAgo: 4, url: "https://leetcode.com/problems/two-sum/" },
  { title: "Valid Parentheses", topic: "Stacks", difficulty: "easy", platform: "hackerrank", status: "solved", solvedDaysAgo: 3, url: "" },
  { title: "Reverse Linked List", topic: "Linked Lists", difficulty: "easy", platform: "leetcode", status: "solved", solvedDaysAgo: 2, url: "https://leetcode.com/problems/reverse-linked-list/" },
  { title: "Binary Search", topic: "Searching", difficulty: "medium", platform: "leetcode", status: "solved", solvedDaysAgo: 1, url: "https://leetcode.com/problems/binary-search/" },
  { title: "Merge Intervals", topic: "Arrays", difficulty: "medium", platform: "leetcode", status: "in_progress", url: "https://leetcode.com/problems/merge-intervals/" },
  { title: "Kth Largest Element in an Array", topic: "Heaps", difficulty: "medium", platform: "gfg", status: "revisit", revisionInDays: 3, url: "" },
  { title: "LRU Cache", topic: "Design", difficulty: "hard", platform: "leetcode", status: "todo", url: "https://leetcode.com/problems/lru-cache/" },
  { title: "Detect Cycle in a Directed Graph", topic: "Graphs", difficulty: "medium", platform: "gfg", status: "todo", url: "" },
];

const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const dateFromToday = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const { count } = await supabase
      .from("planner_tasks")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", true);
    if ((count ?? 0) > 0) return { ok: true, alreadySeeded: true };

    const taskRows = demoTasks.map((t) => ({
      user_id: context.userId,
      title: t.title,
      description: "",
      category: t.category,
      priority: t.priority,
      due_date: dateFromToday(t.dayOffset),
      completed: t.completed ?? false,
      completed_at: t.completed ? isoDaysAgo(t.completedDaysAgo ?? 0) : null,
      is_demo: true,
    }));
    const problemRows = demoProblems.map((p) => ({
      user_id: context.userId,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      platform: p.platform,
      url: p.url,
      status: p.status,
      notes: "",
      revision_date: p.revisionInDays ? dateFromToday(p.revisionInDays) : null,
      solved_at: p.solvedDaysAgo != null ? isoDaysAgo(p.solvedDaysAgo) : null,
      is_demo: true,
    }));

    const [tasksErr, problemsErr] = await Promise.all([
      supabase.from("planner_tasks").insert(taskRows).then((r) => r.error),
      supabase.from("dsa_problems").insert(problemRows).then((r) => r.error),
    ]);
    if (tasksErr || problemsErr) throw new Error((tasksErr ?? problemsErr)!.message);
    return { ok: true, alreadySeeded: false };
  });

export const clearDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [tasksErr, problemsErr] = await Promise.all([
      context.supabase.from("planner_tasks").delete().eq("user_id", context.userId).eq("is_demo", true).then((r) => r.error),
      context.supabase.from("dsa_problems").delete().eq("user_id", context.userId).eq("is_demo", true).then((r) => r.error),
    ]);
    if (tasksErr || problemsErr) throw new Error((tasksErr ?? problemsErr)!.message);
    return { ok: true };
  });
