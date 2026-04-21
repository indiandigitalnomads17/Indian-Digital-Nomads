import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import argon2 from "argon2";

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role } = req.body;

    // 1. Basic Validation (Zod middleware handles this, but good to have)
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already registered with this email" });
    }

    const passwordHash = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role, 
        profile: { create: {} },
      },
    });

    // CHANGE HERE: Use req.login instead of req.session.user
    req.login(newUser, (err) => {
      if (err) {
        console.error("Passport login error during signup:", err);
        return res.status(500).json({ error: "User created but login failed" });
      }

      return res.status(201).json({
        message: "User created and logged in successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      });
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error during signup" });
  }
};

export const signIn = async (req: Request, res: Response, next: NextFunction) => {
  // ... your signIn code is already correct! ...
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log(`[Login] Attempting login for: ${email}`);
    
    req.login(user, (err) => {
      if (err) {
        console.error("[Login Error] Passport req.login failed:", err);
        return res.status(500).json({ error: "Could not log in user" });
      }
      
      console.log(`[Login] Success! Session ID after req.login: ${req.sessionID}`);
      console.log(`[Request Info] Authenticated: ${req.isAuthenticated()}`);

      return res.status(200).json({
        message: "Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      // Return 200 with success: false to avoid "401 Unauthorized" console errors on every landing page visit
      return res.status(200).json({ success: false, data: null });
    }

    // req.user is already populated by passport.deserializeUser
    // which already does findUnique on the DB.
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const signOut = (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) return res.status(500).json({ success: false, error: "Logout failed" });
    
    req.session.destroy(() => {
      res.clearCookie("connect.sid", { path: "/" });
      res.status(200).json({ success: true, message: "Logged out successfully" });
    });
  });
};