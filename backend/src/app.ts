import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session"; // ADD THIS
const pgSession = require("connect-pg-simple")(session); // ADD THIS

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URI || "http://localhost:3000", 
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, 
}));

app.options(/.*/, cors());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));


app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: "Session", 
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
  })
);

export { app };