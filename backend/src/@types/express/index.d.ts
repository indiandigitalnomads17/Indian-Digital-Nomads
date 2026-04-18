import "express-session";
import { UserRole } from "@prisma/client";


declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}


declare global {
  namespace Express {
    
    interface User {
      id: string;
      email: string;
      role: UserRole; 
      fullName?: string;
    }
  }
}