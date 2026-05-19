import { Router } from "express";
import passport from "passport";
import prisma from "../config/prisma";
import { User as PrismaUser } from "@prisma/client";

const router = Router();

router.get("/", (req, res, next) => {
  const role = req.query.role; // can be undefined
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    state 
  })(req, res, next);
});

router.get(
  "/callback",
  passport.authenticate("google", { 
    failureRedirect: "/login",
    keepSessionInfo: true
  }),
  async (req, res) => {
    const user = req.user as PrismaUser;
    
    // Retrieve transient auth properties from req (or session fallback)
    const isNew = (req as any).isNewUser ?? (req.session as any)?.isNew;
    const roleChosen = (req as any).roleChosenByUser ?? (req.session as any)?.roleChosen;

    console.log(`[Google Auth Callback] Session ID: ${req.sessionID}`);
    console.log(`[Google Auth Callback] Retrieved: isNew=${isNew} (req:${(req as any).isNewUser}, sess:${(req.session as any)?.isNew}), roleChosen=${roleChosen} (req:${(req as any).roleChosenByUser}, sess:${(req.session as any)?.roleChosen})`);

    // Clean up session variables
    if (req.session) {
      delete (req.session as any).isNew;
      delete (req.session as any).roleChosen;
    }

    console.log(`[Google Auth Callback] User details: email=${user.email}, role=${user.role}`);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    // Check if the user is new and hasn't chosen a role yet
    if (isNew && !roleChosen) {
      const redirectUrl = `${frontendUrl}/auth/setup-role`;
      console.log(`[Google Auth] Redirecting new user without chosen role to: ${redirectUrl}`);
      res.redirect(redirectUrl);
      return;
    }

    const targetPath = user.role === 'CLIENT' ? '/client' : '/freelancer';
    const redirectUrl = `${frontendUrl}${targetPath}`;
    
    console.log(`[Google Auth] Redirecting user to: ${redirectUrl}`);
    res.redirect(redirectUrl);
  }
);

export default router;