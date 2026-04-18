import { Router } from "express";
import { getSkillTree } from "../controllers/skill.controller";

const router = Router();

// GET /api/v1/skills/tree
router.get("/tree", getSkillTree);

export default router;