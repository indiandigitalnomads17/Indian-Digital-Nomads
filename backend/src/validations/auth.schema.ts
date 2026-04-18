import { UserRole } from "@prisma/client";
import { z } from "zod";

export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().min(2, "Name is too short"),
    role: z.nativeEnum(UserRole).or(z.string()).refine(
      (val) => Object.values(UserRole).includes(val as UserRole),
      { message: "Role must be CLIENT or FREELANCER" }
    ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});