import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma"; 
import { User as PrismaUser } from "@prisma/client";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
      passReqToCallback: true, // Crucial: Allows us to read the 'state' from req
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email found"));

        // 1. Decode the role from the state parameter sent by the frontend
        const stateStr = req.query.state as string;
        let assignedRole: "CLIENT" | "FREELANCER" = "FREELANCER";

        if (stateStr) {
          try {
            const decoded = JSON.parse(Buffer.from(stateStr, 'base64').toString());
            if (decoded.role) assignedRole = decoded.role;
          } catch (e) {
            console.error("State decoding failed", e);
          }
        }

        
        const user = await prisma.user.upsert({
          where: { email },
          update: { googleId: profile.id }, 
          create: {
            email,
            fullName: profile.displayName,
            googleId: profile.id,
            role: assignedRole,
            passwordHash: "", 
            profile: { create: {} },
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as PrismaUser).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    // This 'user' will be attached to req.user
    done(null, user); 
  } catch (error) {
    done(error, null);
  }
});