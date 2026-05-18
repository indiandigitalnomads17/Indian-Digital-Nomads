import { z } from "zod";

export const AnalysisResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  matchedSkills: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      tier: z.number(),
      subSkills: z.array(z.any()).optional()
    })
  ),
  suggestedNewSkills: z.array(
    z.object({
      name: z.string(),
      tier: z.number(),
      subSkills: z.array(z.any()).optional()
    })
  )
});