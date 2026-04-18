import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js"; 
import { signIn, signUp } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { signUpSchema,loginSchema } from "../validations/auth.schema";
const router = Router();


router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), signIn);


export default router;