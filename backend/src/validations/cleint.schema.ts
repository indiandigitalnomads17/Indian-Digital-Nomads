import { z } from "zod";
const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)]?)([-]?[\s0-9])+$/
);

export const clientOnboardingSchema = z.object({
  bio: z.string().min(10, "Company description must be at least 10 characters").max(1000),
  location: z.string().min(2),
  phoneNumber: z.string().min(10).max(15).regex(phoneRegex, "Invalid phone number format"),
  latitude: z.preprocess((val) => parseFloat(val as string), z.number()),
  longitude: z.preprocess((val) => parseFloat(val as string), z.number()),
});
