import { z } from "zod";

export const postJobSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(25, "Please provide a more detailed description"),
  type: z.enum(["FIXED_PRICE", "HOURLY"]),
  
  budget: z.coerce.number().positive("Budget must be a positive number").optional(),
  estimatedHours: z.coerce.number().int().positive().optional(),
  
  location: z.string().optional(),

  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  skills: z.preprocess((val) => {
    if (!val) return [];
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
       
        return [val];
      }
    }
    return val;
  }, z.array(z.string()).min(1, "At least one skill is required")),
});