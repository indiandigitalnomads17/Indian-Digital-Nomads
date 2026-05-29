import { Router } from "express";
import {getFreelancers ,getPublicBusinesses,getFreelancerPublicProfile,getClientPublicProfile,getProjectDetails,getPublicJobs,getPublicJobDetails} from "../controllers/public.controller";
import { protect } from "../middlewares/auth.middleware";
const router = Router();

router.get("/getPublicFreelancers", getFreelancers);

router.get("/getPublicBuisnesses", getPublicBusinesses);

router.get("/getPublicJobs", getPublicJobs);


router.get("/freelancers/:id",protect, getFreelancerPublicProfile);

router.get("/clients/:id",protect, getClientPublicProfile);

router.get("/projects/:id",protect, getProjectDetails);

router.get("/jobs/:id",protect, getPublicJobDetails);



export default router;