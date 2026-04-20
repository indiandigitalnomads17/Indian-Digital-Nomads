import { Router } from "express";
import { protect } from "../middlewares/auth.middleware"; 
import { signIn, signUp, getMe, signOut } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { signUpSchema,loginSchema } from "../validations/auth.schema";
import { getUserNotifications, markNotificationsRead } from "../controllers/notification.controller";
const router = Router();


router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), signIn);
router.get("/me", protect, getMe);
router.get("/notifications", protect, getUserNotifications);
router.patch("/notifications", protect, markNotificationsRead);
router.post("/logout", protect, signOut);

export default router;