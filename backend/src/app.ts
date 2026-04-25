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


app.set("trust proxy", 1);

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({
  origin: frontendUrl.replace(/\/$/, ""), 
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, 
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));


const isProduction = process.env.NODE_ENV === "production";

export const sessionMiddleware = session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: "Session",
    ssl: { rejectUnauthorized: false }
  }),
  secret: process.env.SESSION_SECRET || "your_nomad_secret",
  resave: false,
  saveUninitialized: false,
  proxy: true, // Specifically tell the session middleware to trust the proxy
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    secure: isProduction, 
    sameSite: isProduction ? "none" : "lax",
  },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`  Session ID: ${req.sessionID}`);
  console.log(`  Is Authenticated: ${req.isAuthenticated()}`);
  if (req.user) {
    console.log(`  User Email: ${(req.user as any).email}`);
  }
  next();
});


app.use("/api/auth/google", googleAuthRouter);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/freelancer", freelancerRoutes);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/", dashboardRoutes);
app.use("/api/v1/skills", skillRoutes);
app.use("/api/v1/public", publicRoutes);

export { app };