/**
 * AI server functions (client-safe declarations). Handler bodies load the
 * server-only gateway module lazily so the AI SDK never ships to the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const interviewTypeSchema = z.enum(["technical", "hr", "mixed"]);

const questionsInput = z.object({
  interviewType: interviewTypeSchema,
  role: z.string().max(80),
  count: z.number().int().min(1).max(8),
});

export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => questionsInput.parse(input))
  .handler(async ({ data }) => {
    const { generateQuestions } = await import("./ai.server");
    return generateQuestions(data);
  });

const coachInput = z.object({
  interviewType: interviewTypeSchema,
  role: z.string().max(80),
  question: z.string().min(5).max(600),
  category: z.string().max(40),
  answer: z.string().min(5).max(6000),
});

export const getCoachFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => coachInput.parse(input))
  .handler(async ({ data }) => {
    const { coachFeedback } = await import("./ai.server");
    return coachFeedback(data);
  });

const gradeInput = z.object({
  interviewType: interviewTypeSchema,
  role: z.string().max(80),
  answers: z
    .array(
      z.object({
        question: z.string().max(600),
        category: z.string().max(40),
        answer: z.string().max(6000),
      }),
    )
    .min(1)
    .max(8),
});

export const gradeMockInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gradeInput.parse(input))
  .handler(async ({ data }) => {
    const { gradeInterview } = await import("./ai.server");
    return gradeInterview(data);
  });

const resumeInput = z.object({
  resumeText: z.string().min(80).max(16000),
  jobDescription: z.string().max(8000),
});

export const analyzeResumeText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resumeInput.parse(input))
  .handler(async ({ data }) => {
    const { analyzeResume } = await import("./ai.server");
    return analyzeResume(data);
  });
