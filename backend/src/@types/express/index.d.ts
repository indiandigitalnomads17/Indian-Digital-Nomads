import { UserRole } from "@prisma/client";
import "express";

declare global {
  namespace Express {
    
    interface User {
      id: string;
      email: string;
      role: UserRole;
      fullName: string; 
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export {}; 