import passport, { DoneCallback } from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma"; 

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback",
      passReqToCallback: true,
      proxy: true, 
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(null, false, { message: "No email found" });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.status !== "ACTIVE") {
          return done(null, false, { message: `Login rejected: Account is ${existingUser.status.toLowerCase()}.` });
        }

        const stateStr = req.query.state as string;
        let assignedRole: "CLIENT" | "FREELANCER" = "CLIENT"; 
        let roleChosen = false;

        if (stateStr) {
          try {
            const decoded = JSON.parse(Buffer.from(stateStr, 'base64').toString());
            if (decoded.role) {
              assignedRole = decoded.role;
              roleChosen = true;
            }
          } catch (e) {
            console.error("State decoding failed", e);
          }
        }

        const isNew = !existingUser;

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

        req.isNewUser = isNew;
        req.roleChosenByUser = roleChosen;
        if (req.session) {
          req.session.isNew = isNew;
          req.session.roleChosen = roleChosen;
        }

        return done(null, user);
      } catch (error) {
        console.error("Passport Strategy Error:", error);
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: DoneCallback) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return done(null, false);
    done(null, user); 
  } catch (error) {
    done(error, null);
  }
});

export default passport;