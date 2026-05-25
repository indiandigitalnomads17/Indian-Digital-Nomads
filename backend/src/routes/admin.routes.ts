import express from "express";
import { protect, checkActiveStatus } from "../middlewares/auth.middleware";
import {authorize} from "../middlewares/role.middleware";

import { 
  getAdminDashboardMetrics,
  getAllFreelancers,
  getAllBusinesses,
  suspendUserAndForceLogout,
  deactivateUserAndForceLogout,
  unsuspendUser,
  reactivateUser,
  getPendingKycRequests,
  getKycHistoryLogs,
  reviewKycRequest,
  delistProduct,
  relistProduct,
  getBusinessDetailedProfile,
  getProductDetailedProfile,
  getBusinessProducts,
  getFreelancerDetailedProfile
} from "../controllers/admin.controller";

const router = express.Router();


router.use(protect);
router.use(checkActiveStatus);
router.use(authorize("ADMIN"));


router.get("/metrics/dashboard", getAdminDashboardMetrics);


router.get("/getFreelancers",getAllFreelancers);
router.get("/getClients",getAllBusinesses);


router.put("/users/:userId/suspend", suspendUserAndForceLogout);
router.put("/users/:userId/unsuspend", unsuspendUser);
router.delete("/users/:userId/deactivate", deactivateUserAndForceLogout);
router.put("/users/:userId/reactivate", reactivateUser);


router.get("/kyc/pending", getPendingKycRequests);
router.get("/kyc/history", getKycHistoryLogs);
router.put("/kyc/:targetUserId/review", reviewKycRequest);


router.put("/products/:productId/delist", delistProduct);
router.put("/products/:productId/relist", relistProduct);

router.get("/users/business/:businessId/details", getBusinessDetailedProfile);
router.get("/users/freelancer/:freelancerId/details", getFreelancerDetailedProfile);

router.get("/products/inventory", getBusinessProducts); 
router.get("/products/asset/:productId/details", getProductDetailedProfile); 

export default router;