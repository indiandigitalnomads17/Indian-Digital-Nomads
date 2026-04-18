import { z } from "zod";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)]?)([-]?[\s0-9])+$/
);

export const freelancerOnboardingSchema = z.object({
  bio: z.string().min(20, "Please provide a more detailed bio").max(1000),
  location: z.string().min(2),
  latitude: z.preprocess((val) => parseFloat(val as string), z.number()),
  longitude: z.preprocess((val) => parseFloat(val as string), z.number()),
  videoLink: z.string().url().optional(),
  profilePicLink: z.string().url().optional(),
  skills: z.string(), 
  projects: z.string().optional(), 
  phoneNumber: z.string().min(10).max(15).regex(phoneRegex, "Invalid phone number format"),
  isHourly: z.preprocess((val) => val === 'true', z.boolean()), // Handles form-data string to boolean
  hourlyRate: z.preprocess((val) => Number(val), z.number().positive()).optional(),
  preferredJobType: z.enum(["FIXED_PRICE", "HOURLY"]).default("FIXED_PRICE"),
});