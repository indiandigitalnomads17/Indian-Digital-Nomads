import { z } from "zod";

export const postJobSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(25, "Please provide a more detailed description"),
  type: z.enum(["FIXED_PRICE", "HOURLY"]),
  budget: z.number().positive("Budget must be a positive number").optional(),
  estimatedHours: z.number().int().positive().optional(),
  location: z.string().optional(),
  latitude: z.string().or(z.number()).optional(),
  longitude: z.string().or(z.number()).optional(),
  skills: z.string().transform((val) => JSON.parse(val)).pipe(z.array(z.string())), // Array of Skill IDs
});