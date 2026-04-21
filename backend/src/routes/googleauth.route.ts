import { Router } from "express";
import passport from "passport";
import prisma from "../config/prisma";
import { User as PrismaUser } from "@prisma/client";

const router = Router();

router.get("/", (req, res, next) => {
  const role = req.query.role || "FREELANCER";
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    state 
  })(req, res, next);
});

router.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    const user = req.user as PrismaUser;
    const role = user.role.toLowerCase();

    console.log(`[Google Auth] Callback success for user: ${user.email}, Role: ${user.role}`);

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const targetPath = user.role === 'CLIENT' ? '/dashboard' : '/freelancer';
    const redirectUrl = `${frontendUrl}${targetPath}`;
    
    console.log(`[Google Auth] Redirecting user to: ${redirectUrl}`);
    res.redirect(redirectUrl);
  }
);

export default router;