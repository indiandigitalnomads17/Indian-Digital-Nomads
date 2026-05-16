import { UserRole } from "@prisma/client";
import "express";

declare global {
  namespace Express {
    // 1. Your User interface is perfect!
    interface User {
      id: string;
      email: string;
      role: UserRole;
      fullName: string; 
    }

    // 2. ADD THIS: Tell TypeScript about Passport's methods on the Request object
    interface Request {
      login(user: User, done: (err: any) => void): void;
      login(user: User, options: any, done: (err: any) => void): void;
      logout(options: { keepSessionInfo?: boolean }, done: (err: any) => void): void;
      logout(done: (err: any) => void): void;
      isAuthenticated(): boolean;
      isUnauthenticated(): boolean;
    }
  }
}

// 3. Your session data is perfect, but let's make the role type match your Prisma enum!
declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      email: string;
      role: UserRole; // Changed from string to UserRole to stay consistent
    };
  }
}

export {};