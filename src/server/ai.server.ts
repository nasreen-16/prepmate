/**
 * Server-only module: Lovable AI Gateway helpers + prompts for PrepMate's AI
 * features. Never imported from client code — server functions load it with a
 * dynamic import inside their handlers.
 */
import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText, type ModelMessage } from "ai";
import type { z } from "zod";

const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const DEFAULT_MODEL = "openai/gpt-6-astra";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) {
      runId = nextRunId;
    }
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }

      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export class AiUnavailableError extends Error {}

export function aiConfigured(): boolean {
  return Boolean(process.env.LOVABLE_API_KEY);
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

async function callStructured<T>(opts: {
  instructions: string;
  payload: unknown;
  schema: z.ZodType<T>;
}): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new AiUnavailableError(
      "AI is not configured for this project yet. Add the Lovable AI key in project settings to enable AI features.",
    );
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const messages: ModelMessage[] = [
    { role: "user", content: JSON.stringify(opts.payload) },
  ];

  const result = streamText({
    model: provider.responses(DEFAULT_MODEL),
    instructions: opts.instructions,
    messages,
    output: Output.object({ schema: opts.schema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    return await result.output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const text = error.text;
      if (text) {
        try {
          const parsed: unknown = JSON.parse(text);
          const res = opts.schema.safeParse(parsed);
          if (res.success) return res.data;
        } catch {
          // fall through to the friendly error below
        }
      }
      throw new AiUnavailableError(
        "The AI returned an unexpected response. Please try again in a moment.",
      );
    }
    throw error;
  }
}

// ---------------------------------------------------------------- interview

const interviewTip = `You are PrepMate's AI interview coach — an experienced interviewer who has run hundreds of campus placement interviews at product and service companies in India. Be specific, encouraging and honest. Keep every list item to one concise sentence.`;

export type GeneratedQuestion = { question: string; category: string; tip: string };

export async function generateQuestions(input: {
  interviewType: "technical" | "hr" | "mixed";
  role: string;
  count: number;
}): Promise<GeneratedQuestion[]> {
  const count = clamp(Math.round(input.count), 1, 8);
  const schema = z.object({
    questions: z
      .array(
        z
          .object({
            question: z.string(),
            category: z.string(),
            tip: z.string(),
          })
          .strict(),
      )
      .strict(),
  });

  const out = await callStructured({
    instructions: `${interviewTip}
Generate exactly ${count} realistic ${input.interviewType} interview questions for a candidate interviewing for a ${input.role || "software engineer"} role on a college campus.
Mix difficulty levels and, for technical interviews, cover data structures, algorithms, core CS fundamentals and the candidate's projects. "category" is a short label such as DSA, Core CS, Projects, Behavioral or HR. "tip" is one sentence telling the candidate what a strong answer must cover. Return only the structured output.`,
    payload: { interviewType: input.interviewType, role: input.role, count },
    schema,
  });

  const questions = out.questions.slice(0, count);
  if (questions.length === 0) throw new AiUnavailableError("The AI returned no questions. Please try again.");
  return questions;
}

export type AnswerFeedback = {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
};

const answerFeedbackSchema = z
  .object({
    score: z.number(),
    strengths: z.array(z.string()).strict(),
    improvements: z.array(z.string()).strict(),
    modelAnswer: z.string(),
  })
  .strict();

function normalizeFeedback(f: AnswerFeedback): AnswerFeedback {
  return {
    score: clamp(Number(f.score) || 0, 0, 10),
    strengths: (f.strengths ?? []).slice(0, 4),
    improvements: (f.improvements ?? []).slice(0, 4),
    modelAnswer: f.modelAnswer ?? "",
  };
}

export async function coachFeedback(input: {
  interviewType: "technical" | "hr" | "mixed";
  role: string;
  question: string;
  category: string;
  answer: string;
}): Promise<AnswerFeedback> {
  const out = await callStructured({
    instructions: `${interviewTip}
Grade the candidate's answer to this ${input.interviewType} interview question for a ${input.role || "software engineer"} role. Score 0–10 for correctness, structure and communication. "strengths" and "improvements" each have 2–4 one-sentence items. "modelAnswer" is a concise strong answer (max 120 words).`,
    payload: {
      question: input.question,
      category: input.category,
      candidateAnswer: input.answer,
    },
    schema: answerFeedbackSchema,
  });
  return normalizeFeedback(out);
}

export async function gradeInterview(input: {
  interviewType: "technical" | "hr" | "mixed";
  role: string;
  answers: { question: string; category: string; answer: string }[];
}): Promise<{ perAnswer: AnswerFeedback[]; overallScore: number; summary: string }> {
  const schema = z
    .object({
      perAnswer: z.array(answerFeedbackSchema).strict(),
      overallScore: z.number(),
      summary: z.string(),
    })
    .strict();

  const out = await callStructured({
    instructions: `${interviewTip}
Grade each answer of this completed ${input.interviewType} mock interview for a ${input.role || "software engineer"} role. "perAnswer" must contain exactly one entry per input answer, in the same order, each scored 0–10. "strengths" and "improvements" each have 2–4 one-sentence items; "modelAnswer" is a concise strong answer (max 120 words). "overallScore" is the interview-level score out of 10, weighted by question difficulty. "summary" is 2–3 sentences of overall, actionable feedback.`,
    payload: { answers: input.answers },
    schema,
  });

  const perAnswer = out.perAnswer.slice(0, input.answers.length).map(normalizeFeedback);
  while (perAnswer.length < input.answers.length) {
    perAnswer.push({ score: 0, strengths: [], improvements: ["No feedback returned for this answer."], modelAnswer: "" });
  }
  return {
    perAnswer,
    overallScore: clamp(Number(out.overallScore) || 0, 0, 10),
    summary: out.summary ?? "",
  };
}

// -------------------------------------------------------------------- resume

export type ResumeAnalysis = {
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

export async function analyzeResume(input: {
  resumeText: string;
  jobDescription: string;
}): Promise<ResumeAnalysis> {
  const schema = z
    .object({
      overallScore: z.number(),
      atsReadiness: z.number(),
      summary: z.string(),
      matchedSkills: z.array(z.string()).strict(),
      missingSkills: z.array(z.string()).strict(),
      keywordsPresent: z.array(z.string()).strict(),
      keywordsMissing: z.array(z.string()).strict(),
      sectionFeedback: z
        .array(z.object({ section: z.string(), feedback: z.string() }).strict())
        .strict(),
      suggestions: z
        .array(
          z
            .object({
              title: z.string(),
              detail: z.string(),
              priority: z.enum(["high", "medium", "low"]),
            })
            .strict(),
        )
        .strict(),
    })
    .strict();

  const out = await callStructured({
    instructions: `You are a senior technical recruiter and ATS expert screening fresher resumes for software internships and campus placements.
Analyze the resume text${input.jobDescription ? " against the provided job description" : ""}. "overallScore" and "atsReadiness" are 0–100 integers. Every list has at most 8 short items: skills and ATS keywords actually found in the text vs genuinely missing ones (when a job description is provided, derive them from it; otherwise use common fresher software-role expectations). "sectionFeedback" covers sections like Summary, Education, Projects, Skills, Experience with one specific sentence each. "suggestions" has 3–5 concrete, prioritized improvements. Only mention things supported by the resume text. Return only the structured output.`,
    payload: {
      resumeText: input.resumeText,
      jobDescription: input.jobDescription || null,
    },
    schema,
  });

  const clamp100 = (n: number) => clamp(Math.round(Number(n) || 0), 0, 100);
  return {
    overallScore: clamp100(out.overallScore),
    atsReadiness: clamp100(out.atsReadiness),
    summary: out.summary ?? "",
    matchedSkills: (out.matchedSkills ?? []).slice(0, 8),
    missingSkills: (out.missingSkills ?? []).slice(0, 8),
    keywordsPresent: (out.keywordsPresent ?? []).slice(0, 8),
    keywordsMissing: (out.keywordsMissing ?? []).slice(0, 8),
    sectionFeedback: (out.sectionFeedback ?? []).slice(0, 6),
    suggestions: (out.suggestions ?? []).slice(0, 5),
  };
}
