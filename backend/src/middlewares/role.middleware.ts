import { Request, Response, NextFunction } from "express";
import { User as PrismaUser } from "@prisma/client";

export const authorize = (...allowedRoles: ("CLIENT" | "FREELANCER" | "ADMIN")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Cast req.user to PrismaUser so TS knows the 'role' property exists
    const user = req.user as PrismaUser;

    if (!user || !allowedRoles.includes(user.role as any)) {
      return res.status(403).json({ 
        success: false,
        message: `Forbidden: This area is reserved for ${allowedRoles.join(" and ")}s only.` 
      });
    }

    next();
  };
};