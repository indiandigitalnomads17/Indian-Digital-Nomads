import { Router } from "express";
import { protect } from "../middlewares/auth.middleware"; 
import { signIn, signUp } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { signUpSchema,loginSchema } from "../validations/auth.schema";
import { getUserNotifications, markNotificationsRead } from "../controllers/notification.controller";
const router = Router();


router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), signIn);
router.get("/notifications", protect, getUserNotifications);
router.patch("/notifications", protect, markNotificationsRead);


export default router;