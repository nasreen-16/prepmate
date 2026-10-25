/**
 * Placement readiness scoring — transparent, rule-based, derived only from
 * real user data. Shared by the dashboard and analytics pages so the same
 * formula is shown in both places.
 */

export type ReadinessInput = {
  dsaSolved: number;
  dsaTarget?: number;
  activeDaysLast14: number;
  streakCurrent: number;
  quizAvg: number | null; // 0–100
  interviewAvg: number | null; // 0–10
  resumeScore: number | null; // 0–100
};

export type ReadinessBreakdownItem = {
  label: string;
  weight: number;
  earned: number; // 0–weight
  detail: string;
};

export type ReadinessResult = {
  score: number; // 0–100
  breakdown: ReadinessBreakdownItem[];
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const target = input.dsaTarget ?? 100;

  const dsaRatio = clamp01(input.dsaSolved / target);
  const consistency =
    0.6 * clamp01(input.activeDaysLast14 / 10) + 0.4 * clamp01(input.streakCurrent / 7);
  const quizRatio = input.quizAvg == null ? 0 : clamp01(input.quizAvg / 100);
  const interviewRatio = input.interviewAvg == null ? 0 : clamp01(input.interviewAvg / 10);
  const resumeRatio = input.resumeScore == null ? 0 : clamp01(input.resumeScore / 100);

  const breakdown: ReadinessBreakdownItem[] = [
    {
      label: "DSA problem solving",
      weight: 30,
      earned: Math.round(30 * dsaRatio * 10) / 10,
      detail: `${input.dsaSolved} solved of a ${target}-problem target`,
    },
    {
      label: "Consistency",
      weight: 20,
      earned: Math.round(20 * consistency * 10) / 10,
      detail: `${input.activeDaysLast14} active days in the last 14, ${input.streakCurrent}-day streak`,
    },
    {
      label: "Aptitude & core CS quizzes",
      weight: 25,
      earned: Math.round(25 * quizRatio * 10) / 10,
      detail: input.quizAvg == null ? "No quiz attempts yet" : `${Math.round(input.quizAvg)}% average score`,
    },
    {
      label: "Mock interviews",
      weight: 15,
      earned: Math.round(15 * interviewRatio * 10) / 10,
      detail: input.interviewAvg == null ? "No mock interviews yet" : `${input.interviewAvg.toFixed(1)}/10 average`,
    },
    {
      label: "Resume strength",
      weight: 10,
      earned: Math.round(10 * resumeRatio * 10) / 10,
      detail: input.resumeScore == null ? "No resume analyzed yet" : `${Math.round(input.resumeScore)}/100 resume score`,
    },
  ];

  const score = Math.round(breakdown.reduce((sum, b) => sum + b.earned, 0));
  return { score, breakdown };
}

/** Recommended next actions, derived from the same data so they stay honest. */
export function recommendedActions(input: ReadinessInput & { overdueTasks: number }): string[] {
  const actions: string[] = [];
  if (input.overdueTasks > 0)
    actions.push(`Clear ${input.overdueTasks} overdue planner task${input.overdueTasks > 1 ? "s" : ""} first.`);
  if (input.dsaSolved < 20)
    actions.push("Solve more DSA problems — aim for at least 20 solved before mock rounds.");
  else if (input.dsaSolved < 60)
    actions.push("Keep the DSA momentum — push toward 60 solved problems across topics.");
  if (input.quizAvg == null)
    actions.push("Take your first aptitude / core CS quiz to establish a baseline.");
  else if (input.quizAvg < 60)
    actions.push("Your quiz average is below 60% — schedule one quiz every two days.");
  if (input.interviewAvg == null)
    actions.push("Run a mock interview to surface communication gaps early.");
  else if (input.interviewAvg < 6)
    actions.push("Rehearse weak answers from your last mock and retake it this week.");
  if (input.resumeScore == null)
    actions.push("Upload your resume for an AI analysis with job-description matching.");
  else if (input.resumeScore < 70)
    actions.push("Apply the pending resume suggestions, then re-analyze the updated version.");
  if (input.activeDaysLast14 <= 3)
    actions.push("Consistency is the weakest link — plan at least 30 focused minutes daily.");
  if (actions.length === 0)
    actions.push("You're on track — maintain your streak and keep revising marked problems.");
  return actions.slice(0, 4);
}
