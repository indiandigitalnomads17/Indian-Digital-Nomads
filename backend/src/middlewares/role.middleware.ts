import { Request, Response, NextFunction } from "express";

export const authorize = (...allowedRoles: ("CLIENT" | "FREELANCER" | "ADMIN")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Forbidden: This area is reserved for ${allowedRoles.join(" and ")}s only.` 
      });
    }

    next();
  };
};