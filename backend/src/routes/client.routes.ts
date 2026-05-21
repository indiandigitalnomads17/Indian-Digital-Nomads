import { Router } from "express";
import { createJob, onboardClient } from "../controllers/client.controller";
import { protect} from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorize } from "../middlewares/role.middleware";
import { getClientProfileWithAllStats, getRecommendedFreelancers, getClientGigs } from "../controllers/client.controller";
import { analyzeVideo } from "../controllers/analyse.controller";
import { getProposalsByJob, updateProposalStatus } from "../controllers/proposal.controller";

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

router.post("/analyze-video", protect, authorize("CLIENT"), upload.single("video"), analyzeVideo);

router.get("/get-profile-data", protect, authorize("CLIENT"), getClientProfileWithAllStats);
router.get("/recommendations", protect, authorize("CLIENT"), getRecommendedFreelancers);
router.get("/gigs", protect, authorize("CLIENT"), getClientGigs);
router.get("/gigs/:jobId/proposals", protect, authorize("CLIENT"), getProposalsByJob);
router.patch("/proposals/:id", protect, authorize("CLIENT"), updateProposalStatus);

export default router;