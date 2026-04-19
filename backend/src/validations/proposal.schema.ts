import { z } from "zod";

export const proposalSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().min(50, "Cover letter should be at least 50 characters"),
  bidAmount: z.number().positive(),
  estimatedDays: z.number().int().positive(),
});