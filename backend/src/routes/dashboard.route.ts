import { Router } from "express";
import { getLandingPageShowcase } from "../controllers/landing.controller";

const router = Router();

router.get("/home", getLandingPageShowcase);

export default router;