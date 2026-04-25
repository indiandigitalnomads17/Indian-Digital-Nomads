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

const pgSession = require("connect-pg-simple")(session);
const app = express();

// 1. Trust Proxy (CRITICAL for Render/Heroku/Vercel)
// This tells Express to trust the headers set by Render's load balancer (X-Forwarded-Proto)
// Without this, 'secure: true' cookies will never be sent because Express thinks the connection is insecure.
app.set("trust proxy", 1);

// 2. CORS Configuration
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({
  origin: frontendUrl.replace(/\/$/, ""), // Removes trailing slash if present
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Allows cookies to be sent/received
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// 3. Session Middleware
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
    // 'secure' must be true for SameSite: 'none' to work in production
    secure: process.env.NODE_ENV === "production", 
    // 'none' allows cross-site cookies (Frontend on Vercel -> Backend on Render)
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// 4. Debug Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`  Session ID: ${req.sessionID}`);
  console.log(`  Is Authenticated: ${req.isAuthenticated()}`);
  if (req.user) {
    console.log(`  User: ${(req.user as any).email}`);
  }
  next();
});

// 5. Routes
app.use("/api/auth/google", googleAuthRouter);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/freelancer", freelancerRoutes);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/", dashboardRoutes);
app.use("/api/v1/skills", skillRoutes);
app.use("/api/v1/public", publicRoutes);

export { app };