import { Router } from "express";
import { createJob, onboardClient } from "../controllers/client.controller";
import { protect} from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorize } from "../middlewares/role.middleware";
import { getPrivateClientProfile, getClientDashboardStats, getRecommendedFreelancers } from "../controllers/client.controller";
import { analyzeVideo } from "../controllers/analyse.controller";


const router = Router();

router.patch(
  "/onboard",
  protect,
  authorize("CLIENT"),
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "businessVideo", maxCount: 1 }
  ]),
  onboardClient
);

router.post(
  "/create",
  protect, 
  authorize("CLIENT"), 
  upload.fields([
    { name: "jobImages", maxCount: 5 }, 
    { name: "briefVideo", maxCount: 1 }  
  ]),
  createJob
);

router.post("/analyze-video",protect, authorize("CLIENT"), upload.single("video"), analyzeVideo);

router.get("/get-profile-data", protect, authorize("CLIENT"), getPrivateClientProfile);
router.get("/dashboard-stats", protect, authorize("CLIENT"), getClientDashboardStats);
router.get("/recommendations", protect, authorize("CLIENT"), getRecommendedFreelancers);

export default router;