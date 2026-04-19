import { Router } from "express";
import { getSkillTree } from "../controllers/skill.controller";

const router = Router();


router.get("/tree", getSkillTree);

export default router;