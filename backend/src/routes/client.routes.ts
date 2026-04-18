import { Router } from "express";
import { onboardClient } from "../controllers/client.controller";
import { protect} from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authorize } from "../middlewares/role.middleware";
import { getPrivateClientProfile } from "../controllers/client.controller";


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

router.get("/get-profile-data", protect, authorize("CLIENT"), getPrivateClientProfile);

export default router;