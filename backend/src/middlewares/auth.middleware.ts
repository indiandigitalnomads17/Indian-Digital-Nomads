import { Request, Response, NextFunction } from "express";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  // 1. Passport adds this helper method to the request object
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ 
    success: false,
    error: "Unauthorized: Please log in to access this resource" 
  });
};