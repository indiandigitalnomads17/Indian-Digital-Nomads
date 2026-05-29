import { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadOnCloudinary ,deleteFromCloudinary} from "../config/cloudinary";
import { User as PrismaUser, JobStatus, ProposalStatus } from "@prisma/client";
import { freelancerOnboardingSchema } from "../validations/freelancer.schema";
import { error } from "node:console";

import bannerMapping from "../constants/bannerMapping.json"; 

export const onboardFreelancer = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const validation = freelancerOnboardingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { 
      bio, location, latitude, longitude, skills, phoneNumber,
      isHourly, hourlyRate, preferredJobType 
    } = validation.data;

    let profilePicUrl: string | undefined;
    let introVideoUrl: string | undefined;
    let bannerUrl: string | undefined;

    if (files?.profilePic?.[0]) {
      const result = await uploadOnCloudinary(files.profilePic[0].path);
      if (result) profilePicUrl = result.secure_url;
    }
    
    if (files?.introVideo?.[0]) {
      const result = await uploadOnCloudinary(files.introVideo[0].path);
      if (result) introVideoUrl = result.secure_url;
    }

    if (files?.banner?.[0]) {
      const result = await uploadOnCloudinary(files.banner[0].path);
      if (result) bannerUrl = result.secure_url;
    } else { 
      const skillIds = JSON.parse(skills);
      if (skillIds.length > 0) {
        const firstSkill = await prisma.skill.findUnique({
          where: { id: skillIds[0] },
          include: { 
            parent: { 
              include: { 
                parent: {
                  include: { parent: true }
                }
              } 
            } 
          }
        });

        let rootParentName = "";
        
        if (firstSkill) {
          if (firstSkill.tier === 1) {
            rootParentName = firstSkill.name;
          } else if (firstSkill.tier === 2) {
            rootParentName = firstSkill.parent?.name || firstSkill.name;
          } else if (firstSkill.tier === 3) {
            rootParentName = firstSkill.parent?.parent?.name || firstSkill.parent?.name || firstSkill.name;
          } else if (firstSkill.tier === 4) {
            rootParentName = firstSkill.parent?.parent?.parent?.name || 
                             firstSkill.parent?.parent?.name || 
                             firstSkill.parent?.name || 
                             firstSkill.name;
          }
        }

        const targetKey = rootParentName.trim();

        console.log(`🎯 Resolving banner for 4-tier skill: "${firstSkill?.name}" -> Root Parent Category: "${targetKey}"`);

        bannerUrl = (bannerMapping as Record<string, string>)[targetKey] || bannerMapping.DEFAULT;
      } 
      
      if (!bannerUrl) {
        bannerUrl = bannerMapping.DEFAULT;
      }
    }

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { phoneNumber },
      }),

      prisma.profile.update({
        where: { userId },
        data: {
          bio,
          location,
          latitude: Number(latitude),
          longitude: Number(longitude),
          isHourly: Boolean(isHourly), 
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
          preferredJobType,
          profilePicLink: profilePicUrl || undefined,
          bannerLink: bannerUrl, 
          videoLink: introVideoUrl || undefined,
          skills: {
            set: [], 
            connect: JSON.parse(skills).map((id: string) => ({ id }))
          }
        }
      })
    ]);

    res.status(200).json({ 
      success: true, 
      message: "Onboarding successful",
      data: { ...updatedProfile, phoneNumber: updatedUser.phoneNumber } 
    });
  } catch (error) {
    console.error("Onboarding Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Onboarding failed" });
    }
  }
};

export const addProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const userProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!userProfile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    const { title, description, links, skills, completedAt } = req.body;

    const screenshotUrls: string[] = [];
    if (files?.screenshots) {
      const uploadPromises = files.screenshots.map(file => uploadOnCloudinary(file.path));
      const results = await Promise.all(uploadPromises);
      
      results.forEach(result => {
        if (result?.secure_url) screenshotUrls.push(result.secure_url);
      });
    }

    let uploadedVideoUrl: string | null = null;
    if (files?.projectVideo?.[0]) {
      const videoResult = await uploadOnCloudinary(files.projectVideo[0].path);
      uploadedVideoUrl = videoResult?.secure_url || null;
    }

    const newProject = await prisma.project.create({
      data: {
        profileId: userProfile.id,
        title,
        description: description || null,
        links: links ? JSON.parse(links) : [],
        videoUrl: uploadedVideoUrl,
        completedAt: completedAt ? new Date(completedAt) : new Date(), 
        images: {
          create: screenshotUrls.map(url => ({ url }))
        },
        skillsUsed: {
          connect: skills ? JSON.parse(skills).map((id: string) => ({ id })) : []
        }
      },
      include: { 
        images: true, 
        skillsUsed: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        }
      }
    });

    return res.status(201).json({ success: true, data: newProject });

  } catch (error) {
    console.error("Add Project Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Failed to add project to profile" });
    }
  }
};

export const editProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const { projectId } = req.params; 
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const userProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!userProfile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    const targetProjectId = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!targetProjectId) {
      return res.status(400).json({ success: false, error: "Project ID parameter is missing or invalid." });
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: targetProjectId,
        profileId: userProfile.id
      }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false, 
        error: "Project not found or you do not have permission to modify it." 
      });
    }

    const { title, description, links, skills, completedAt } = req.body;

    let parsedLinks: string[] = [];
    if (links !== undefined) {
      if (Array.isArray(links)) {
        parsedLinks = links as string[];
      } else if (typeof links === "string") {
        try {
          const parsed = JSON.parse(links);
          parsedLinks = Array.isArray(parsed) ? parsed : [links];
        } catch {
          parsedLinks = [links]; 
        }
      }
    }

    const newScreenshotUrls: string[] = [];
    if (files?.screenshots) {
      const uploadPromises = files.screenshots.map(file => uploadOnCloudinary(file.path));
      const results = await Promise.all(uploadPromises);
      
      results.forEach(result => {
        if (result?.secure_url) newScreenshotUrls.push(result.secure_url);
      });
    }

    let updatedVideoUrl: string | undefined = undefined;
    if (files?.projectVideo?.[0]) {
      const videoResult = await uploadOnCloudinary(files.projectVideo[0].path);
      if (videoResult?.secure_url) {
        updatedVideoUrl = videoResult.secure_url;
      }
    }

    const updatedProject = await prisma.project.update({
      where: { 
        id: existingProject.id 
      },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
        videoUrl: updatedVideoUrl !== undefined ? updatedVideoUrl : undefined,
        
        links: links !== undefined ? parsedLinks : undefined,

        images: newScreenshotUrls.length > 0 ? {
          create: newScreenshotUrls.map(url => ({ url }))
        } : undefined,

        skillsUsed: skills ? {
          set: JSON.parse(skills).map((id: string) => ({ id }))
        } : undefined
      },
      include: { 
        images: true, 
        skillsUsed: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: "Project updated successfully", 
      data: updatedProject 
    });

  } catch (error) {
    console.error("Edit Project Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Failed to update project data" });
    }
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const { projectId } = req.params;

    // 1. Verify user profile exists
    const userProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!userProfile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    // 2. Normalize projectId parameter type
    const targetProjectId = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!targetProjectId) {
      return res.status(400).json({ success: false, error: "Project ID parameter is missing or invalid." });
    }

    // 3. Fetch project with its image relations
    const project = await prisma.project.findFirst({
      where: {
        id: targetProjectId,
        profileId: userProfile.id
      },
      include: {
        images: true
      }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: "Project not found or you do not have permission to delete it." 
      });
    }

    // 4. Clean up Cloudinary Assets Concurrently using your wrapper
    const deletionPromises: Promise<any>[] = [];

    if (project.videoUrl) {
      deletionPromises.push(deleteFromCloudinary(project.videoUrl));
    }

    if (project.images && project.images.length > 0) {
      project.images.forEach((img) => {
        deletionPromises.push(deleteFromCloudinary(img.url));
      });
    }

    // Fire all deletion requests in parallel
    if (deletionPromises.length > 0) {
      await Promise.all(deletionPromises).catch((err) => {
        console.error("Non-blocking asset cleanup warning:", err);
      });
    }

    // 5. Delete from database (Cascades automatically to ProjectImage records via schema)
    await prisma.project.delete({
      where: {
        id: project.id
      }
    });

    return res.status(200).json({
      success: true,
      message: "Project and all associated media assets permanently deleted."
    });

  } catch (error) {
    console.error("Delete Project Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Failed to delete project data" });
    }
  }
};

export const getRecommendedJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;

    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: { select: { id: true } } }
    });

    if (!userProfile || !userProfile.latitude || !userProfile.longitude) {
      const recentJobs = await prisma.job.findMany({
        where: { status: JobStatus.OPEN },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          client: { select: { id: true, fullName: true } },
          skillsRequired: { 
            select: { 
              id: true, 
              name: true,
              parent: { select: { id: true, parent: { select: { id: true } } } }
            } 
          }
        }
      });
      return res.status(200).json({ success: true, data: recentJobs });
    }

    const { latitude, longitude } = userProfile;
    const skillIds = userProfile.skills.map(s => s.id);

    const RADIUS_KM = 50;
    const degToKm = 111;

    const recommendedJobs = await prisma.job.findMany({
      where: {
        status: JobStatus.OPEN,
        latitude: {
          gte: latitude - (RADIUS_KM / degToKm),
          lte: latitude + (RADIUS_KM / degToKm)
        },
        longitude: {
          gte: longitude - (RADIUS_KM / degToKm),
          lte: longitude + (RADIUS_KM / degToKm)
        }
      },
      include: {
        client: { select: { id: true, fullName: true } },
        skillsRequired: { 
          select: { 
            id: true, 
            name: true,
            parent: { select: { id: true, parent: { select: { id: true } } } }
          } 
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const dataWithMatch = recommendedJobs.map(job => {
      const matchCount = job.skillsRequired.filter(s => {
        if (skillIds.includes(s.id)) return true;
        if (s.parent && skillIds.includes(s.parent.id)) return true;
        if (s.parent?.parent && skillIds.includes(s.parent.parent.id)) return true;
        
        return false;
      }).length;
      
      const matchPercent = skillIds.length > 0 ? (matchCount / job.skillsRequired.length) * 100 : 0;
      return { ...job, matchPercent: Math.round(matchPercent) };
    });

    res.status(200).json({ success: true, data: dataWithMatch });
  } catch (error) {
    console.error("Recommended Jobs Error:", error);
    res.status(500).json({ error: "Failed to fetch recommended jobs" });
  }
};

export const getFreelancerProfileWithAllStats = async (req: Request, res: Response) => {
  try {
    const freelancerId = (req.user as any)?.id;

    if (!freelancerId) {
      return res.status(401).json({ success: false, error: "Unauthorized access token." });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;

    const [
      userCore,
      jobStatusGroups,
      proposalStatusGroups,
      portfolioProjects,
      totalProjectsCount,
      reviewAggregates,
      financialAggregates,
      fallbackProposals,
      fallbackJobs,
      fallbackReviews
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: freelancerId },
        include: {
          profile: {
            include: {
              skills: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                  parent: {
                    select: {
                      name: true,
                      tier: true,
                      parent: {
                        select: {
                          name: true,
                          tier: true,
                          parent: { select: { name: true, tier: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),

      prisma.job.groupBy({
        by: ['status'],
        where: { freelancerId },
        _count: { id: true }
      }),

      prisma.proposal.groupBy({
        by: ['status'],
        where: { freelancerId },
        _count: { id: true }
      }),

      prisma.project.findMany({
        where: { profile: { userId: freelancerId } },
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip: skip,
        include: {
          images: true,
          skillsUsed: {
            select: { id: true, name: true, tier: true }
          }
        }
      }),

      prisma.project.count({
        where: { profile: { userId: freelancerId } }
      }),

      prisma.review.aggregate({
        where: { revieweeId: freelancerId },
        _count: { id: true },
        _avg: { rating: true }
      }),

      prisma.transaction.aggregate({
        where: { receiverId: freelancerId, status: 'SUCCESSFUL' },
        _sum: { amount: true, feeAmount: true, netAmount: true },
        _count: { id: true }
      }),

      prisma.proposal.findMany({
        where: { freelancerId },
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          bidAmount: true, 
          status: true, 
          createdAt: true, 
          job: { select: { id: true, title: true, budget: true } } 
        }
      }),

      prisma.job.findMany({
        where: { freelancerId, status: "IN_PROGRESS" },
        select: { 
          id: true, 
          title: true, 
          status: true, 
          budget: true, 
          type: true, 
          client: { select: { id: true, fullName: true, email: true } }, 
          createdAt: true 
        }
      }),

      prisma.review.findMany({
        where: { revieweeId: freelancerId },
        orderBy: { createdAt: 'desc' },
        include: { 
          reviewer: { select: { fullName: true, profile: { select: { profilePicLink: true } } } }, 
          job: { select: { title: true } } 
        }
      })
    ]);

    if (!userCore) {
      return res.status(404).json({ success: false, error: "Freelancer not found." });
    }

    const contractMetrics = { IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, totalContracts: 0 };
    jobStatusGroups.forEach(group => {
      if (group.status in contractMetrics) {
        contractMetrics[group.status as keyof Omit<typeof contractMetrics, 'totalContracts'>] = group._count.id;
        contractMetrics.totalContracts += group._count.id;
      }
    });

    const bidMetrics = { PENDING: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0, totalBids: 0 };
    proposalStatusGroups.forEach(group => {
      if (group.status in bidMetrics) {
        bidMetrics[group.status as keyof Omit<typeof bidMetrics, 'totalBids'>] = group._count.id;
        bidMetrics.totalBids += group._count.id;
      }
    });

    const bidWinRatePercentage = bidMetrics.totalBids > 0
      ? Math.round((bidMetrics.ACCEPTED / bidMetrics.totalBids) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        account: {
          id: userCore.id,
          fullName: userCore.fullName,
          email: userCore.email,
          phoneNumber: userCore.phoneNumber || null,
          role: userCore.role,
          createdAt: userCore.createdAt,
          verifications: {
            isEmailVerified: userCore.isEmailVerified,
            isPhoneNumberVerified: userCore.isPhoneNumberVerified,
            isGlobalVerified: userCore.isVerified,
            kycStatus: userCore.kycStatus,
            kycNotes: userCore.kycNotes || null
          }
        },
        reputationScorecard: {
          nomadScore: Number(userCore.nomadScore || 0),
          averageRating: Number(reviewAggregates._avg.rating || 0).toFixed(2),
          totalReviewsCount: reviewAggregates._count.id
        },
        profileMetadata: {
          bio: userCore.profile?.bio || null,
          profilePicLink: userCore.profile?.profilePicLink || null,
          bannerLink: userCore.profile?.bannerLink || null,
          videoLink: userCore.profile?.videoLink || null,
          location: userCore.profile?.location || null,
          latitude: userCore.profile?.latitude || null,
          longitude: userCore.profile?.longitude || null,
          rates: {
            isHourly: userCore.profile?.isHourly || false,
            hourlyRate: userCore.profile?.hourlyRate ? Number(userCore.profile.hourlyRate) : null,
            preferredJobType: userCore.profile?.preferredJobType || "FIXED_PRICE"
          },
          skillsTree: userCore.profile?.skills || []
        },
        workHistoryMetrics: {
          activeContracts: contractMetrics.IN_PROGRESS,
          completedContracts: contractMetrics.COMPLETED,
          cancelledContracts: contractMetrics.CANCELLED,
          lifetimeJobsSecured: contractMetrics.totalContracts
        },
        proposalFunnelMetrics: {
          totalApplicationsSubmitted: bidMetrics.totalBids,
          activeApplications: bidMetrics.PENDING,
          acceptedApplications: bidMetrics.ACCEPTED,
          rejectedApplications: bidMetrics.REJECTED,
          withdrawnApplications: bidMetrics.WITHDRAWN,
          proposalWinRate: `${bidWinRatePercentage}%`
        },
        portfolioStore: {
          totalProjectsListed: totalProjectsCount,
          currentBatch: portfolioProjects
        },
        earningsLedgerSummary: {
          successfulPayoutsCount: financialAggregates._count.id,
          lifetimeEarningsGross: Number(financialAggregates._sum.amount || 0),
          lifetimePlatformFeesPaid: Number(financialAggregates._sum.feeAmount || 0),
          lifetimeNetTakeHome: Number(financialAggregates._sum.netAmount || 0)
        },
        proposals: fallbackProposals,
        jobsAsFreelancer: fallbackJobs,
        reviewsRec: fallbackReviews
      }
    });

  } catch (error) {
    console.error("Freelancer Profile Data Sync Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Internal server validation compilation crash." });
    }
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ success: false, error: "Invalid or malformed Project ID parameter." });
    }

    const userProfile = await prisma.profile.findUnique({ 
      where: { userId } 
    });
    
    if (!userProfile) {
      return res.status(404).json({ success: false, error: "Freelancer profile not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId as string }, 
      include: {
        images: true,
        skillsUsed: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: "Project milestone showcase item not found" });
    }

    if (project.profileId !== userProfile.id) {
      return res.status(403).json({ success: false, error: "Unauthorized access to this portfolio asset" });
    }

    return res.status(200).json({ success: true, data: project });

  } catch (error) {
    console.error("Fetch Project Details Error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve project parameters" });
  }
};