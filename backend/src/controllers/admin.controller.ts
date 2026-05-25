import { Request, Response } from "express";
import prisma from "../config/prisma";
import { User as PrismaUser, KycStatus } from "@prisma/client";
import { notifyNomad } from "../services/notification.service"; 
import { sendProductModerationEmail } from "../services/product-email.service";
import { sendAccountStatusEmail } from "../services/account-status-email.service";


export const getAdminDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      businessStatuses,
      freelancerStatuses,
      jobStatuses,
      totalProducts,
      totalProposals,
      kycStatuses,
      globalTxSums,
      lastMonthTxSums,
      txPaymentMethods
    ] = await prisma.$transaction([
      
      prisma.user.groupBy({
        by: ["status"],
        where: { role: "CLIENT" },
        _count: { _all: true }
      }),

      prisma.user.groupBy({
        by: ["status"],
        where: { role: "FREELANCER" },
        _count: { _all: true }
      }),

      prisma.job.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),

      prisma.product.count(),
      prisma.proposal.count(),

      prisma.user.groupBy({
        by: ["kycStatus"],
        _count: { _all: true }
      }),

      prisma.transaction.aggregate({
        where: { status: "SUCCESSFUL" },
        _sum: { amount: true, feeAmount: true }
      }),

      prisma.transaction.aggregate({
        where: {
          status: "SUCCESSFUL",
          createdAt: {
            gte: firstDayLastMonth,
            lte: lastDayLastMonth
          }
        },
        _sum: { amount: true, feeAmount: true }
      }),

      prisma.transaction.groupBy({
        by: ["paymentMethod"],
        where: { status: "SUCCESSFUL" },
        _count: { _all: true },
        _sum: { amount: true }
      })
    ]);

    const reduceCounts = (arr: any[], key: string) =>
      arr.reduce((acc, current) => ({ ...acc, [current[key]]: current._count._all }), {});

    const businessMap = reduceCounts(businessStatuses, "status");
    const freelancerMap = reduceCounts(freelancerStatuses, "status");
    
    const grandTotalBusinesses = Object.values(businessMap).reduce((a: any, b: any) => a + b, 0);
    const grandTotalFreelancers = Object.values(freelancerMap).reduce((a: any, b: any) => a + b, 0);

    return res.status(200).json({
      success: true,
      data: {
        businesses: {
          total: grandTotalBusinesses,
          breakdown: businessMap
        },
        freelancers: {
          total: grandTotalFreelancers,
          breakdown: freelancerMap
        },
        jobs: {
          total: Object.values(reduceCounts(jobStatuses, "status")).reduce((a: any, b: any) => a + b, 0),
          byStatus: reduceCounts(jobStatuses, "status")
        },
        proposals: {
          total: totalProposals
        },
        products: {
          totalListed: totalProducts
        },
        kycVerification: reduceCounts(kycStatuses, "kycStatus"),
        financials: {
          overallVolume: {
            grossMarketplaceVolume: globalTxSums._sum.amount ? Number(globalTxSums._sum.amount) : 0,
            platformRevenueEarned: globalTxSums._sum.feeAmount ? Number(globalTxSums._sum.feeAmount) : 0
          },
          lastMonthPerformance: {
            grossMarketplaceVolume: lastMonthTxSums._sum.amount ? Number(lastMonthTxSums._sum.amount) : 0,
            platformRevenueEarned: lastMonthTxSums._sum.feeAmount ? Number(lastMonthTxSums._sum.feeAmount) : 0
          },
          byPaymentMethod: txPaymentMethods.map((method) => ({
            method: method.paymentMethod,
            transactionCount: method._count._all,
            totalVolume: method._sum.amount ? Number(method._sum.amount) : 0
          }))
        }
      }
    });
  } catch (error) {
    console.error("Error building admin layout metrics payload:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
  }
};

export const getAllFreelancers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { skill, location, minNomadScore, minRating } = req.query;

    const whereConditions: any = {
      role: "FREELANCER",
      status: "ACTIVE",
    };

    if (location) {
      whereConditions.profile = {
        location: {
          contains: location as string,
          mode: "insensitive",
        },
      };
    }

    if (minNomadScore) {
      whereConditions.nomadScore = {
        gte: parseFloat(minNomadScore as string),
      };
    }

    if (skill) {
      whereConditions.profile = {
        ...whereConditions.profile,
        skills: {
          some: {
            name: {
              contains: skill as string,
              mode: "insensitive",
            },
          },
        },
      };
    }

    if (minRating) {
      whereConditions.reviewsRec = {
        some: {}, 
      };
    }

    const [totalItems, freelancers] = await prisma.$transaction([
      prisma.user.count({ where: whereConditions }),
      prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
          profile: true,
          reviewsRec: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    let filteredFreelancers = freelancers;
    if (minRating) {
      const minRatingNum = parseFloat(minRating as string);
      filteredFreelancers = freelancers.filter((user) => {
        const total = user.reviewsRec.length;
        const avg = total > 0 ? user.reviewsRec.reduce((acc, r) => acc + r.rating, 0) / total : 0;
        return avg >= minRatingNum;
      });
    }

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
      data: filteredFreelancers,
    });
  } catch (error) {
    console.error("Error fetching freelancers:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const getAllBusinesses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { location, minNomadScore, minRating } = req.query;

    const whereConditions: any = {
      role: "CLIENT",
      status: "ACTIVE",
    };

    if (location) {
      whereConditions.profile = {
        location: {
          contains: location as string,
          mode: "insensitive",
        },
      };
    }

    if (minNomadScore) {
      whereConditions.nomadScore = {
        gte: parseFloat(minNomadScore as string),
      };
    }

    if (minRating) {
      whereConditions.reviewsRec = {
        some: {},
      };
    }

    const [totalItems, businesses] = await prisma.$transaction([
      prisma.user.count({ where: whereConditions }),
      prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
          profile: true,
          _count: {
            select: {
              jobsAsClient: true,
              products: true,
            },
          },
          reviewsRec: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    let filteredBusinesses = businesses;
    if (minRating) {
      const minRatingNum = parseFloat(minRating as string);
      filteredBusinesses = businesses.filter((business) => {
        const total = business.reviewsRec.length;
        const avg = total > 0 ? business.reviewsRec.reduce((acc, r) => acc + r.rating, 0) / total : 0;
        return avg >= minRatingNum;
      });
    }

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data: filteredBusinesses,
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const suspendUserAndForceLogout = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { reason } = req.body; // Optional string note input extracted from admin panel

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required.",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    const executionReason = reason?.trim() || "Your account has been temporarily suspended due to flagged violations of our platform Terms of Service.";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });

      await tx.session.deleteMany({
        where: {
          data: {
            contains: `"user":"${userId}"`,
          },
        },
      });
    });

    if (userExists.isEmailVerified && userExists.email) {
      sendAccountStatusEmail({
        to: userExists.email,
        fullName: userExists.fullName,
        action: "SUSPENDED",
        reason: executionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${userExists.fullName} has been suspended, and all active sessions have been terminated.`,
    });
  } catch (error) {
    console.error("Error executing admin user suspension pipeline:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const deactivateUserAndForceLogout = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid string User ID is required.",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    // Default message backup rules for deactivations
    const executionReason = reason?.trim() || "Your account listing has been deactivated by system administration staff.";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "DEACTIVATED" },
      });

      await tx.session.deleteMany({
        where: {
          data: {
            contains: `"user":"${userId}"`,
          },
        },
      });
    });

    // Fire email notice safely
    if (userExists.isEmailVerified && userExists.email) {
      sendAccountStatusEmail({
        to: userExists.email,
        fullName: userExists.fullName,
        action: "DEACTIVATED",
        reason: executionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${userExists.fullName} has been successfully deactivated, and all active sessions have been pruned.`,
    });
  } catch (error) {
    console.error("Error executing admin user deactivation pipeline:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const unsuspendUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid string User ID is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    if (user.status !== "SUSPENDED") {
      return res.status(400).json({
        success: false,
        error: `Cannot unsuspend this account because its current status is ${user.status}.`,
      });
    }

    // Default message backup rules for lifting a suspension
    const executionReason = reason?.trim() || "Following an internal system appeal review, your account suspension has been successfully resolved and lifted.";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    // Fire email notice safely
    if (updatedUser.isEmailVerified && updatedUser.email) {
      sendAccountStatusEmail({
        to: updatedUser.email,
        fullName: updatedUser.fullName,
        action: "UNSUSPENDED",
        reason: executionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${updatedUser.fullName} has been unsuspended successfully and can now log back in.`,
    });
  } catch (error) {
    console.error("Error executing admin user unsuspension:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const reactivateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid string User ID is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    if (user.status !== "DEACTIVATED") {
      return res.status(400).json({
        success: false,
        error: `Cannot reactivate this account because its current status is ${user.status}.`,
      });
    }

    // Default message backup rules for account reactivations
    const executionReason = reason?.trim() || "Your previously closed account profile has been successfully reactivated and restored.";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    // Fire email notice safely
    if (updatedUser.isEmailVerified && updatedUser.email) {
      sendAccountStatusEmail({
        to: updatedUser.email,
        fullName: updatedUser.fullName,
        action: "REACTIVATED",
        reason: executionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${updatedUser.fullName} has been reactivated successfully.`,
    });
  } catch (error) {
    console.error("Error executing admin user reactivation:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const getPendingKycRequests = async (req: Request, res: Response) => {
  try {
    const { location, date, page, limit } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;
    const whereConditions: any = {
      kycStatus: "PENDING_REVIEW",
    };


    if (location) {
      whereConditions.profile = {
        location: {
          contains: location as string,
          mode: "insensitive",
        },
      };
    }


    if (date) {
      const targetDate = new Date(date as string);
      if (!isNaN(targetDate.getTime())) {
        whereConditions.createdAt = {
          gte: targetDate,
        };
      }
    }

   
    const [totalItems, pendingUsers] = await prisma.$transaction([
      prisma.user.count({ where: whereConditions }),
      prisma.user.findMany({
        where: whereConditions,
        skip: skip,
        take: limitNum,
        select: {
          id: true,
          fullName: true,
          email: true,
          govIdStoragePath: true, 
          profile: {
            select: {
              profilePicLink: true,
              location: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc", 
        },
      }),
    ]);


    const formattedData = pendingUsers.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      profilePicLink: user.profile?.profilePicLink || null,
      location: user.profile?.location || "Not Provided",
      kycDocumentLink: user.govIdStoragePath,
    }));

    return res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        perPage: limitNum,
      },
      data: formattedData,
    });
  } catch (error) {
    console.error("Error retrieving pending KYC pipeline entries:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getKycHistoryLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [totalItems, logs] = await prisma.$transaction([
      prisma.kycLog.count(),
      prisma.kycLog.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          admin: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc", 
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        perPage: limit,
      },
      data: logs.map((log:any) => ({
        id: log.id,
        userFullName: log.user.fullName,
        userEmail: log.user.email,
        reviewedByAdmin: log.admin.fullName,
        verdict: log.status, 
        notes: log.notes,
        verifiedAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error retrieving KYC history logs:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const reviewKycRequest = async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
    const { action, rejectionNotes } = req.body; // action: "APPROVED" or "REJECTED"
    
    // Get current reviewer from Passport session context
    const currentAdmin = req.user as PrismaUser;

    // 1. Inputs validation
    if (!targetUserId || typeof targetUserId !== "string") {
      return res.status(400).json({ success: false, error: "A valid target User ID parameter is required." });
    }

    if (action !== "APPROVED" && action !== "REJECTED") {
      return res.status(400).json({ success: false, error: "Invalid action. Must be 'APPROVED' or 'REJECTED'." });
    }

    // 2. Locate target user and verify they are currently awaiting review
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: "Target user not found." });
    }

    if (targetUser.kycStatus !== "PENDING_REVIEW") {
      return res.status(400).json({ 
        success: false, 
        error: `This user's verification pipeline cannot be modified because their current status is ${targetUser.kycStatus}.` 
      });
    }

    // 3. Define values based on the administrative action outcome
    const targetKycStatus: KycStatus = action === "APPROVED" ? "APPROVED" : "REJECTED";
    const globalVerificationFlag = action === "APPROVED"; // Set true on approval
    
    const finalNotes = action === "APPROVED" 
      ? "Your official verification documents checked out perfectly. Welcome to the platform!" 
      : (rejectionNotes || "Your submitted documentation did not meet our verification criteria.");

    // 4. Run database changes inside an atomic transaction
    await prisma.$transaction(async (tx) => {
      // Step A: Update user validation flags
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          kycStatus: targetKycStatus,
          isVerified: globalVerificationFlag,
          kycNotes: finalNotes
        }
      });

      // Step B: Write a record to the standalone historical audit logs table
      await tx.kycLog.create({
        data: {
          userId: targetUserId,
          adminId: currentAdmin.id,
          status: targetKycStatus,
          notes: finalNotes
        }
      });
    });

    // 5. Fire notification to the destination user asynchronously (non-blocking)
    const notificationType = action === "APPROVED" ? "KYC_APPROVAL" : "KYC_REJECTION";
    const notificationBody = action === "APPROVED"
      ? "✨ Verification Success! Your identity documents have been approved. You now have full marketplace access."
      : `⚠️ Verification Update: Your documents were rejected. Reason: ${finalNotes}`;

    // Fire-and-forget notification delivery
    notifyNomad({
      userId: targetUserId,
      type: notificationType,
      message: notificationBody,
      link: "/settings/verification" // Pointing to user dashboard verification panel
    });

    return res.status(200).json({
      success: true,
      message: `KYC request for ${targetUser.fullName} has been successfully ${action.toLowerCase()}. Log recorded and notification dispatched.`,
    });
  } catch (error) {
    console.error("Critical error inside KYC execution loop:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error during verification update." });
  }
};

export const delistProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ success: false, error: "A valid string Product ID parameter is required." });
    }

    const defaultReason = "This product has been flagged as violating platform community standard terms of safety or copyright compliance.";
    const executionReason = reason?.trim() || defaultReason;

    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { client: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Target marketplace product record not found." });
    }

    if (product.isDelisted) {
      return res.status(400).json({ success: false, error: "This product listing is already delisted from the platform." });
    }

  
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isDelisted: true,
        delistReason: executionReason,
      },
    });
    
    notifyNomad({
      userId: product.clientId,
      type: "PRODUCT_DELISTED",
      message: `Your product listing "${product.title}" was delisted for violating marketplace rules. Check email for details.`,
      link: "/dashboard/products",
    });

    if (product.client.isEmailVerified && product.client.email) {
      sendProductModerationEmail({
        to: product.client.email,
        businessName: product.client.fullName,
        productTitle: product.title,
        productImage: product.coverImageUrl || "",
        action: "DELISTED",
        reason: executionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product "${product.title}" has been successfully delisted. Owner notification dispatched.`,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error executing platform product delist controller:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const relistProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ success: false, error: "A valid string Product ID parameter is required." });
    }

    const defaultReason = "Upon administration review, your product has been reinstated onto the active market listings.";
    const executionReason = reason?.trim() || defaultReason;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { client: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Target marketplace product record not found." });
    }

    if (!product.isDelisted) {
      return res.status(400).json({ success: false, error: "This product listing is already live and active." });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isDelisted: false,
        delistReason: null,
      },
    });

    notifyNomad({
      userId: product.clientId,
      type: "PRODUCT_RELISTED",
      message: `✨ Great news! Your product listing "${product.title}" has been reactivated and restored to the public catalog.`,
      link: "/dashboard/products",
    });

    if (product.client.isEmailVerified && product.client.email) {
      sendProductModerationEmail({
        to: product.client.email,
        businessName: product.client.fullName,
        productTitle: product.title,
        productImage: product.coverImageUrl || "",
        action: "RELISTED",
        reason: executionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product "${product.title}" has been successfully relisted and restored to active catalog search feeds.`,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error executing platform product relist controller:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getBusinessDetailedProfile = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;

    if (!businessId || typeof businessId !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid string Business ID parameter is required.",
      });
    }

    // 1. Fetch user records mapping exactly against the Prisma structural ecosystem definitions
    const businessUser = await prisma.user.findFirst({
      where: { 
        id: businessId,
        role: "CLIENT" // Guardrail preventing query scope pollution
      },
      include: {
        profile: {
          include: {
            skills: true // Included if you track company tags via cross-cutting entities
          }
        },
        // Pull full relational array graphs matching your explicit model keys
        products: {
          include: {
            _count: {
              select: { transactions: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        jobsAsClient: {
          include: {
            _count: {
              select: { 
                proposals: true,
                transactions: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        reviewsRec: {
          include: {
            reviewer: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!businessUser) {
      return res.status(404).json({
        success: false,
        error: "Business account record not found inside platform indexes.",
      });
    }

    // 2. Query transactions matching the verified model relation field key: transactionsSent
    const financialSummary = await prisma.transaction.aggregate({
      where: {
        senderId: businessId,
        status: "SUCCESSFUL"
      },
      _sum: {
        amount: true,
        feeAmount: true,
        netAmount: true
      },
      _count: {
        _all: true
      }
    });

    // 3. Process categorical breakdown of financial outflow for dashboard cards
    const transactionBreakdown = await prisma.transaction.groupBy({
      by: ["paymentMethod", "status"],
      where: { senderId: businessId },
      _count: { _all: true },
      _sum: { amount: true }
    });

    // 4. Calculate operational averages and aggregate indices safely
    const grossSpent = financialSummary._sum.amount ? Number(financialSummary._sum.amount) : 0;
    const systemFeesPaid = financialSummary._sum.feeAmount ? Number(financialSummary._sum.feeAmount) : 0;
    const netVolume = financialSummary._sum.netAmount ? Number(financialSummary._sum.netAmount) : 0;
    const processedTxCount = financialSummary._count._all;

    const totalReviews = businessUser.reviewsRec.length;
    const compositeRating = totalReviews > 0
      ? Number((businessUser.reviewsRec.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
      : 0.0;

    // 5. Structure the standardized corporate payload wrapper
    return res.status(200).json({
      success: true,
      data: {
        // Core User Schema Block
        accountCredentials: {
          id: businessUser.id,
          fullName: businessUser.fullName,
          email: businessUser.email,
          phoneNumber: businessUser.phoneNumber,
          googleLinked: !!businessUser.googleId,
          status: businessUser.status,
          nomadScore: Number(businessUser.nomadScore),
          createdAt: businessUser.createdAt,
          verificationFlags: {
            isEmailVerified: businessUser.isEmailVerified,
            isPhoneNumberVerified: businessUser.isPhoneNumberVerified,
            isPlatformVerified: businessUser.isVerified
          }
        },
        
        // Identity Document Verification Trace Schema Block
        kycStatusTracker: {
          status: businessUser.kycStatus,
          govIdStoragePath: businessUser.govIdStoragePath,
          administrativeNotes: businessUser.kycNotes
        },

        // Profile Details Sub-Model Block
        profileDetails: businessUser.profile ? {
          id: businessUser.profile.id,
          bio: businessUser.profile.bio,
          profilePicLink: businessUser.profile.profilePicLink,
          bannerLink: businessUser.profile.bannerLink,
          videoIntroduction: businessUser.profile.videoLink,
          locationCoordinates: {
            textAddress: businessUser.profile.location || "Not Provided",
            latitude: businessUser.profile.latitude,
            longitude: businessUser.profile.longitude
          },
          engagementPreferences: {
            preferredJobType: businessUser.profile.preferredJobType,
            hourlyBillingRate: businessUser.profile.hourlyRate ? Number(businessUser.profile.hourlyRate) : null,
            isHourlyBilled: businessUser.profile.isHourly
          },
          corporateTags: businessUser.profile.skills.map(s => s.name)
        } : null,

        // High-Density Financial Ledger Card Block
        financialLedger: {
          lifetimeGrossCapitalSpent: grossSpent,
          platformCommissionFeesContributed: systemFeesPaid,
          netEscrowVolumeSettled: netVolume,
          totalSuccessfulInvoicesCount: processedTxCount,
          paymentMethodsBreakdown: transactionBreakdown.map(item => ({
            method: item.paymentMethod,
            statusGroup: item.status,
            transactionCount: item._count._all,
            totalAggregatedVolume: item._sum.amount ? Number(item._sum.amount) : 0
          }))
        },

        // Operational Overview Stats Block
        activityMetrics: {
          totalGigsPosted: businessUser.jobsAsClient.length,
          totalProductsListed: businessUser.products.length,
          reviewsSummary: {
            averageScore: compositeRating,
            totalCount: totalReviews
          }
        },

        // Tab Data Graph Arrays
        postedGigs: businessUser.jobsAsClient.map(job => ({
          id: job.id,
          title: job.title,
          description: job.description,
          status: job.status,
          pricingType: job.type,
          budgetAllocated: job.budget ? Number(job.budget) : 0,
          estimatedHours: job.estimatedHours,
          locationContext: job.location,
          proposalsCount: job._count.proposals,
          transactionsCount: job._count.transactions,
          createdAt: job.createdAt
        })),

        digitalInventory: businessUser.products.map(prod => ({
          id: prod.id,
          title: prod.title,
          description: prod.description,
          basePrice: Number(prod.price),
          discountedPrice: prod.discountedPrice ? Number(prod.discountedPrice) : null,
          coverImageUrl: prod.coverImageUrl,
          videoLink: prod.videoUrl,
          isDelisted: prod.isDelisted,
          delistReason: prod.delistReason,
          salesTransactionCount: prod._count.transactions,
          updatedAt: prod.updatedAt
        })),

        recentReviewsReceived: businessUser.reviewsRec.map(review => ({
          id: review.id,
          jobId: review.jobId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          author: {
            fullName: review.reviewer.fullName,
            email: review.reviewer.email
          }
        }))
      }
    });

  } catch (error) {
    console.error("Critical error mapping client operations dashboard metrics:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error compiling detailed client operations ledger."
    });
  }
};

export const getBusinessProducts = async (req: Request, res: Response) => {
  try {
    const { clientId, page, limit, search } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 8;
    const skip = (pageNum - 1) * limitNum;

    // 1. Establish strict schema validation matching whereConditions bounds
    const whereConditions: any = {};

    // Filter by specific corporate user profile if provided parameter token exists
    if (clientId && typeof clientId === 'string') {
      whereConditions.clientId = clientId;
    }

    // Filter out matches based on case-insensitive search queries
    if (search && typeof search === 'string') {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 2. Fetch dataset arrays and counts inside an optimized database transaction
    const [totalItems, products] = await prisma.$transaction([
      prisma.product.count({ where: whereConditions }),
      prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limitNum,
        include: {
          client: {
            select: {
              fullName: true,
              email: true,
              status: true
            }
          },
          _count: {
            select: {
              transactions: true // Maps sales conversions count indicators
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 3. Format the data into clean structures optimized for front-end card layouts
    const formattedCards = products.map((prod) => ({
      id: prod.id,
      title: prod.title,
      description: prod.description,
      pricing: {
        basePrice: Number(prod.price),
        discountedPrice: prod.discountedPrice ? Number(prod.discountedPrice) : null,
        hasDiscount: !!prod.discountedPrice && Number(prod.discountedPrice) < Number(prod.price)
      },
      media: {
        coverImageUrl: prod.coverImageUrl || null,
        videoUrl: prod.videoUrl || null
      },
      moderation: {
        isDelisted: prod.isDelisted,
        delistReason: prod.delistReason || null
      },
      performance: {
        salesConversionCount: prod._count.transactions
      },
      corporateOwner: {
        id: prod.clientId,
        companyName: prod.client.fullName,
        accountStatus: prod.client.status
      },
      listedAt: prod.createdAt,
      updatedAt: prod.updatedAt
    }));

    return res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        perPage: limitNum
      },
      data: formattedCards
    });

  } catch (error) {
    console.error("Error drawing corporate store inventory indexes:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error compiling digital store products directory."
    });
  }
};

export const getProductDetailedProfile = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: "A valid string Product identification UUID token parameter is required."
      });
    }

    // 1. Locate product and include related models based on schema keys
    const productItem = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            nomadScore: true,
            status: true,
            profile: {
              select: { profilePicLink: true, location: true }
            }
          }
        },
        images: {
          select: { id: true, url: true, altText: true },
          orderBy: { createdAt: 'asc' }
        },
        transactions: {
          where: { status: 'SUCCESSFUL' },
          include: {
            sender: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!productItem) {
      return res.status(404).json({
        success: false,
        error: "Target digital inventory product record asset not found."
      });
    }

    // 2. Calculate financial and performance statistics for the item
    const grossRevenueEarned = productItem.transactions.reduce(
      (sum, tx) => sum + Number(tx.amount), 
      0
    );
    const cumulativeFeesContributed = productItem.transactions.reduce(
      (sum, tx) => sum + Number(tx.feeAmount), 
      0
    );

    // 3. Format a unified response for the front-end view layout
    return res.status(200).json({
      success: true,
      data: {
        assetIdentity: {
          id: productItem.id,
          title: productItem.title,
          description: productItem.description,
          createdAt: productItem.createdAt,
          updatedAt: productItem.updatedAt
        },
        financialSpecs: {
          basePrice: Number(productItem.price),
          discountedPrice: productItem.discountedPrice ? Number(productItem.discountedPrice) : null,
          grossRevenueGenerated: grossRevenueEarned,
          platformFeesCollected: cumulativeFeesContributed,
          totalSalesVolumeCount: productItem.transactions.length
        },
        mediaAssets: {
          primaryCoverUrl: productItem.coverImageUrl,
          videoLinkUrl: productItem.videoUrl,
          galleryImages: productItem.images
        },
        systemCompliance: {
          isDelisted: productItem.isDelisted,
          delistReason: productItem.delistReason
        },
        merchantVendorProfile: {
          id: productItem.client.id,
          fullName: productItem.client.fullName,
          email: productItem.client.email,
          nomadScore: Number(productItem.client.nomadScore),
          accountStatus: productItem.client.status,
          profilePicLink: productItem.client.profile?.profilePicLink || null,
          location: productItem.client.profile?.location || "Not Provided"
        },
        historicalSalesLedger: productItem.transactions.map((tx) => ({
          transactionId: tx.id,
          gatewayReferenceId: tx.gatewayTxId,
          settledAmount: Number(tx.amount),
          paymentChannelUsed: tx.paymentMethod,
          processedAt: tx.createdAt,
          buyerIdentity: tx.sender ? {
            id: tx.sender.id,
            fullName: tx.sender.fullName,
            email: tx.sender.email
          } : null
        }))
      }
    });

  } catch (error) {
    console.error("Critical error inside product detailed view execution block:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error compiling product operations metrics graphs."
    });
  }
};

export const getFreelancerDetailedProfile = async (req: Request, res: Response) => {
  try {
    const { freelancerId } = req.params;

    if (!freelancerId || typeof freelancerId !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid string Freelancer User ID parameter is required.",
      });
    }

    // 1. Query full graph relations matching the explicit FREELANCER role parameters
    const freelancerUser = await prisma.user.findFirst({
      where: {
        id: freelancerId,
        role: "FREELANCER" // Guardrail isolating query scope parameters
      },
      include: {
        profile: {
          include: {
            skills: true,
            projects: {
              include: { images: true, skillsUsed: true }
            }
          }
        },
        proposals: {
          include: {
            job: {
              select: { title: true, budget: true, status: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        jobsAsFreelancer: {
          include: {
            client: {
              select: { fullName: true, email: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        reviewsRec: {
          include: {
            reviewer: {
              select: { fullName: true, email: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!freelancerUser) {
      return res.status(404).json({
        success: false,
        error: "Freelancer database record profile not found.",
      });
    }

    // 2. Compute aggregate financial performance utilizing incoming transaction keys: transactionsReceived
    const financialSummary = await prisma.transaction.aggregate({
      where: {
        receiverId: freelancerId,
        status: "SUCCESSFUL"
      },
      _sum: {
        amount: true,      // Gross earnings deposited to freelancer
        feeAmount: true,   // Marketplace processing cuts collected by platform
        netAmount: true    // Post-fee payload allocations
      },
      _count: {
        _all: true
      }
    });

    // 3. Compute structural conversion metrics parameters
    const totalEarnings = financialSummary._sum.amount ? Number(financialSummary._sum.amount) : 0;
    const platformFeesDeducted = financialSummary._sum.feeAmount ? Number(financialSummary._sum.feeAmount) : 0;
    const netTakeHome = financialSummary._sum.netAmount ? Number(financialSummary._sum.netAmount) : 0;
    const closedPayoutsCount = financialSummary._count._all;

    // Calculate rating matrix benchmarks safely
    const totalReviews = freelancerUser.reviewsRec.length;
    const averageRating = totalReviews > 0
      ? Number((freelancerUser.reviewsRec.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
      : 0.0;

    // Calculate proposal conversion statistics
    const totalProposalsFiled = freelancerUser.proposals.length;
    const acceptedProposalsCount = freelancerUser.proposals.filter(p => p.status === "ACCEPTED").length;

    // 4. Structure the complete payload ecosystem architecture for cards components
    return res.status(200).json({
      success: true,
      data: {
        // User Credentials Subschema
        accountCredentials: {
          id: freelancerUser.id,
          fullName: freelancerUser.fullName,
          email: freelancerUser.email,
          phoneNumber: freelancerUser.phoneNumber,
          googleLinked: !!freelancerUser.googleId,
          status: freelancerUser.status,
          nomadScore: Number(freelancerUser.nomadScore),
          createdAt: freelancerUser.createdAt,
          verificationFlags: {
            isEmailVerified: freelancerUser.isEmailVerified,
            isPhoneNumberVerified: freelancerUser.isPhoneNumberVerified,
            isPlatformVerified: freelancerUser.isVerified
          }
        },

        // Document Identity KYC Validation States
        kycStatusTracker: {
          status: freelancerUser.kycStatus,
          govIdStoragePath: freelancerUser.govIdStoragePath,
          administrativeNotes: freelancerUser.kycNotes
        },

        // Dynamic Extended Profiles Subschema
        profileDetails: freelancerUser.profile ? {
          id: freelancerUser.profile.id,
          bio: freelancerUser.profile.bio,
          profilePicLink: freelancerUser.profile.profilePicLink,
          bannerLink: freelancerUser.profile.bannerLink,
          videoIntroUrl: freelancerUser.profile.videoLink,
          locationContext: {
            textAddress: freelancerUser.profile.location || "Not Provided",
            latitude: freelancerUser.profile.latitude,
            longitude: freelancerUser.profile.longitude
          },
          billingPreferences: {
            hourlyRate: freelancerUser.profile.hourlyRate ? Number(freelancerUser.profile.hourlyRate) : null,
            isHourlyActive: freelancerUser.profile.isHourly,
            preferredJobType: freelancerUser.profile.preferredJobType
          },
          skillsTags: freelancerUser.profile.skills.map(skill => skill.name),
          
          // Mapped Complex Relational Sub-Portfolio Project Object Cards
          portfolioProjects: freelancerUser.profile.projects.map(proj => ({
            id: proj.id,
            title: proj.title,
            description: proj.description,
            links: proj.links,
            videoUrl: proj.videoUrl,
            completedAt: proj.completedAt,
            skillsUsed: proj.skillsUsed.map(s => s.name),
            mediaGallery: proj.images.map(img => ({ id: img.id, url: img.url, altText: img.altText }))
          }))
        } : null,

        // Financial Ledger Earnings Matrix Card
        earningsLedger: {
          lifetimeGrossRevenueEarned: totalEarnings,
          platformCommissionFeesContributed: platformFeesDeducted,
          netEarningOutflowCleared: netTakeHome,
          totalSuccessfulPayoutsCount: closedPayoutsCount
        },

        // Core Performance Statistics
        activityMetrics: {
          proposalsStats: {
            totalFiled: totalProposalsFiled,
            totalAccepted: acceptedProposalsCount,
            conversionRatio: totalProposalsFiled > 0 ? Number(((acceptedProposalsCount / totalProposalsFiled) * 100).toFixed(1)) : 0
          },
          contractsStats: {
            totalContractsAssigned: freelancerUser.jobsAsFreelancer.length,
            activeContractsCount: freelancerUser.jobsAsFreelancer.filter(j => j.status === "IN_PROGRESS").length,
            completedContractsCount: freelancerUser.jobsAsFreelancer.filter(j => j.status === "COMPLETED").length
          },
          reviewsStats: {
            averageScore: averageRating,
            totalCount: totalReviews
          }
        },

        // Detailed Tab Streams Arrays
        contractsHistory: freelancerUser.jobsAsFreelancer.map(job => ({
          id: job.id,
          title: job.title,
          status: job.status,
          pricingType: job.type,
          contractValue: job.budget ? Number(job.budget) : 0,
          createdAt: job.createdAt,
          client: {
            fullName: job.client.fullName,
            email: job.client.email
          }
        })),

        proposalsHistory: freelancerUser.proposals.map(prop => ({
          id: prop.id,
          coverLetterSnippet: prop.coverLetter,
          bidAmount: Number(prop.bidAmount),
          estimatedDays: prop.estimatedDays,
          status: prop.status,
          createdAt: prop.createdAt,
          targetJob: {
            title: prop.job.title,
            originalBudget: prop.job.budget ? Number(prop.job.budget) : 0,
            currentJobStatus: prop.job.status
          }
        })),

        recentReviewsReceived: freelancerUser.reviewsRec.map(rev => ({
          id: rev.id,
          rating: rev.rating,
          comment: rev.comment,
          createdAt: rev.createdAt,
          reviewer: {
            fullName: rev.reviewer.fullName,
            email: rev.reviewer.email
          }
        }))
      }
    });

  } catch (error) {
    console.error("Critical error building complete freelancer analytical profile node:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error compiling platform structural talent metrics."
    });
  }
};