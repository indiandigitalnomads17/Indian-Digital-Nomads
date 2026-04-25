import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./config/passport";
import googleAuthRouter from "./routes/googleauth.route";
import userRoutes from "./routes/User.router";
import freelancerRoutes from "./routes/freelancer.routes";
import skillRoutes from "./routes/skill.routes";
import publicRoutes from "./routes/public.routes";
import dashboardRoutes from "./routes/dashboard.route";
import clientRoutes from "./routes/client.routes";

// TODO: Flagged for potential removal - consider moving to a Prisma-based session store 
// (e.g., prisma-session-store) to move entirely away from manual 'pg' logic.
const pgSession = require("connect-pg-simple")(session);
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));


export const sessionMiddleware = session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: "Session",
    ssl: {
      rejectUnauthorized: false
    }
  }),
  secret: process.env.SESSION_SECRET || "your_nomad_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "lax",
  },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Debug Middleware: Log session info for every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`  Session ID: ${req.sessionID}`);
  console.log(`  Is Authenticated: ${req.isAuthenticated()}`);
  if (req.user) {
    console.log(`  User: ${(req.user as any).email} (${(req.user as any).id})`);
  }
  next();
});

// Routes
app.use("/api/auth/google", googleAuthRouter);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/freelancer", freelancerRoutes);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/", dashboardRoutes);
app.use("/api/v1/skills", skillRoutes);
app.use("/api/v1/public", publicRoutes);


export { app };