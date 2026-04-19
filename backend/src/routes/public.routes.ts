import { Router } from "express";
import { getPublicJobDetails,getFreelancerPublicProfile ,getClientPublicProfile,getProjectDetails} from "../controllers/public.controller";
import { protect } from "../middlewares/auth.middleware";
const router = Router();

router.get("/jobs/:id",protect, getPublicJobDetails);


router.get("/freelancer/:id",protect, getFreelancerPublicProfile);


router.get("/projects/:id",protect, getProjectDetails);


router.get("/clients/:id",protect, getClientPublicProfile);

export default router;