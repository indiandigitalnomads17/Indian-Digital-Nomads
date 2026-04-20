import { Router } from "express";
import { 
  addProject, 
  onboardFreelancer, 
  getPrivateFreelancerProfile,
  getFreelancerDashboardStats,
  getRecommendedJobs
} from "../controllers/freelancer.controller";
import { protect} from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorize } from "../middlewares/role.middleware";
import {submitProposal} from  "../controllers/proposal.controller"
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
    { name: "screenshots", maxCount: 5 }, 
    { name: "projectVideo", maxCount: 1 }  
  ]),
  addProject
);

router.get("/get-profile-data", protect, authorize("FREELANCER"), getPrivateFreelancerProfile);

router.get("/dashboard-stats", protect, authorize("FREELANCER"), getFreelancerDashboardStats);
router.get("/recommendations", protect, authorize("FREELANCER"), getRecommendedJobs);

router.post("/send-proposal", protect, authorize("FREELANCER"), submitProposal);

export default router;