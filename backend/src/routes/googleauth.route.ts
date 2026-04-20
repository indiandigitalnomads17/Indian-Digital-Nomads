import { Router } from "express";
import passport from "passport";
import prisma from "../config/prisma";
import { User as PrismaUser } from "@prisma/client";

const router = Router();

router.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    const user = req.user as PrismaUser;
    const role = user.role.toLowerCase();

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    const targetPath = user.role === 'CLIENT' ? '/dashboard' : '/freelancer';
    res.redirect(`${process.env.FRONTEND_URL}${targetPath}`);
  }
);

export default router;