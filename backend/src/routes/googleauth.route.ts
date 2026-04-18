import { Router } from "express";
import passport from "passport";

const router = Router();

router.get("/", (req, res, next) => {
  const { role } = req.query;
  
  const state = role 
    ? Buffer.from(JSON.stringify({ role })).toString('base64') 
    : undefined;

  passport.authenticate("google", { 
    scope: ["profile", "email"],
    state: state 
  })(req, res, next);
});


router.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

export default router;