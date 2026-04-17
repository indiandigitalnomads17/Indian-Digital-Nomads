import { Request, Response, NextFunction } from "express";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  // express-session automatically populates req.session
  if (req.session && req.session.user) {
    req.user = req.session.user; 
    return next();
  }

  res.status(401).json({ error: "Unauthorized: Please log in" });
};