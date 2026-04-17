import "express-session";

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      role: "CLIENT" | "FREELANCER" | "ADMIN";
    };
  }
}
s
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "CLIENT" | "FREELANCER" | "ADMIN";
      };
    }
  }
}