import { z } from "zod";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)]?)([-]?[\s0-9])+$/
);

export const freelancerOnboardingSchema = z.object({
  bio: z.string().min(20, "Please provide a more detailed professional bio (min 20 chars)").max(1000),
  location: z.string().min(2, "Location name is required"),
  latitude: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number()).default(0),
  longitude: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number()).default(0),
  videoLink: z.string().url().optional().or(z.literal("")),
  profilePicLink: z.string().url().optional().or(z.literal("")),
  bannerLink: z.string().url().optional().or(z.literal("")),
  skills: z.string().min(2, "Please select at least one skill"), 
  projects: z.string().optional(), 
  phoneNumber: z.string().min(10).max(15).regex(phoneRegex, "Invalid phone number format"),
  isHourly: z.preprocess((val) => val === 'true' || val === true, z.boolean()), 
  hourlyRate: z.preprocess((val) => val ? Number(val) : 0, z.number().positive()).optional(),
  preferredJobType: z.enum(["FIXED_PRICE", "HOURLY"]).default("FIXED_PRICE"),
});