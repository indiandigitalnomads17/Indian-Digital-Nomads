import { Router } from "express";
import { 
  addProject, 
  onboardFreelancer, getFreelancerProfileWithAllStats,getRecommendedJobs,
  editProject,deleteProject } from "../controllers/freelancer.controller";
import { protect} from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorize } from "../middlewares/role.middleware";
import {submitProposal} from  "../controllers/proposal.controller"
import { analyzeUserProjectVideo } from "../controllers/analyse.controller";
const router = Router();

router.patch(
  "/onboard",
  protect,
  authorize("FREELANCER"),
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "introVideo", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  onboardFreelancer
);

router.post(
  "/add-project",
  protect,
  authorize("FREELANCER"),
  upload.fields([
    { name: "screenshots", maxCount: 6 }, 
    { name: "projectVideo", maxCount: 1 }  
  ]),
  addProject
);

router.patch(
  "/projects/:projectId",
  protect,
  authorize("FREELANCER"),
  upload.fields([
    { name: "screenshots", maxCount: 6 }, 
    { name: "projectVideo", maxCount: 1 }   
  ]),
  editProject
);

router.delete("/projects/:projectId", protect, authorize("FREELANCER"), deleteProject);

router.get("/dashboard-stats", protect, authorize("FREELANCER"), getFreelancerProfileWithAllStats);

router.post("/analyze-project-video", protect, authorize("FREELANCER"), upload.single("video"), analyzeUserProjectVideo);

router.get("/recommendations", protect, authorize("FREELANCER"), getRecommendedJobs);

router.post("/send-proposal", protect, authorize("FREELANCER"), submitProposal);

export default router;