import { Router } from "express";
import { addProject, onboardFreelancer , getPrivateFreelancerProfile} from "../controllers/freelancer.controller";
import { protect} from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();

router.patch(
  "/onboard",
  protect,
  authorize("FREELANCER"),
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "introVideo", maxCount: 1 }
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


export default router;