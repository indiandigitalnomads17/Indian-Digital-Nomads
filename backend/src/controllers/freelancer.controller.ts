import { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadOnCloudinary } from "../config/cloudinary";
import { User as PrismaUser, JobStatus, ProposalStatus } from "@prisma/client";
import { freelancerOnboardingSchema } from "../validations/freelancer.schema";
import { error } from "node:console";

export const onboardFreelancer = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 1. Zod Validation (Ensure your schema now includes isHourly, hourlyRate, preferredJobType)
    const validation = freelancerOnboardingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { 
      bio, location, latitude, longitude, skills, phoneNumber,
      isHourly, hourlyRate, preferredJobType 
    } = validation.data;

    // 2. Handle Media Uploads
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
    }

    // 3. Database Transaction
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
          // --- NEW FIELDS ---
          isHourly: Boolean(isHourly), 
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
          preferredJobType,
          profilePicLink: profilePicUrl || undefined,
          bannerLink: bannerUrl || undefined,
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
    res.status(500).json({ error: "Onboarding failed" });
  }
};

export const getPrivateFreelancerProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;

    const freelancerData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        // 1. Detailed Profile & Portfolio
        profile: {
          select: {
            id: true,
            bio: true,
            profilePicLink: true,
            bannerLink: true,
            videoLink: true,
            location: true,
            latitude: true,
            longitude: true,
            isHourly: true,
            hourlyRate: true,
            preferredJobType: true,
            skills: {
              select: { 
                id: true, 
                name: true, 
                parent: { select: { name: true } } 
              }
            },
            projects: {
              orderBy: { completedAt: 'desc' },
              include: { 
                images: true,
                skillsUsed: { select: { name: true } }
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true,
            jobsAsFreelancer: true,
            reviewsRec: true
          }
        },
        jobsAsFreelancer: {
          where: { status: "IN_PROGRESS" },
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            type: true,
            client: { select: { fullName: true, email: true } },
            createdAt: true
          }
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bidAmount: true,
            status: true,
            createdAt: true,
            job: {
              select: {
                id: true,
                title: true,
                budget: true
              }
            }
          }
        },
        reviewsRec: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { 
              select: { 
                fullName: true, 
                profile: { select: { profilePicLink: true } } 
              } 
            },
            job: { select: { title: true } }
          }
        }
      }
    });

    if (!freelancerData) {
      return res.status(404).json({ error: "Freelancer data not found" });
    }

    res.status(200).json({ 
      success: true, 
      data: freelancerData 
    });

  } catch (error) {
    console.error("Fetch Private Profile Error:", error);
    res.status(500).json({ error: "Failed to fetch freelancer dashboard" });
  }
};

export const addProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    // 1. Added completedAt to the destructuring
    const { title, description, projectUrl, skills, completedAt } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const userProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!userProfile) return res.status(404).json({ error: "Profile not found" });

    // 2. Handle Screenshots & Video (same as before)
    const screenshotUrls = [];
    if (files?.screenshots) {
      for (const file of files.screenshots) {
        const result = await uploadOnCloudinary(file.path);
        if (result) screenshotUrls.push(result.secure_url);
      }
    }

    let uploadedVideoUrl = undefined;
    if (files?.projectVideo?.[0]) {
      const result = await uploadOnCloudinary(files.projectVideo[0].path);
      uploadedVideoUrl = result?.secure_url;
    }

    // 3. Create Project with Date parsing
    const newProject = await prisma.project.create({
      data: {
        profileId: userProfile.id,
        title,
        description,
        projectUrl,
        videoUrl: uploadedVideoUrl,
        // Parse the string date from the frontend into a Date object
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
        skillsUsed: { select: { name: true } }
      }
    });

    res.status(201).json({ success: true, data: newProject });

  } catch (error) {
    console.error("Add Project Error:", error);
    res.status(500).json({ error: "Failed to add project" });
  }
};

export const getFreelancerDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [stats, monthlyJobs] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              jobsAsFreelancer: { where: { status: JobStatus.IN_PROGRESS } },
              proposals: { where: { status: ProposalStatus.PENDING } }
            }
          }
        }
      }),
      prisma.job.findMany({
        where: {
          freelancerId: userId,
          status: JobStatus.COMPLETED,
          createdAt: { gte: startOfMonth }
        },
        select: { budget: true }
      })
    ]);

    const monthlyEarnings = monthlyJobs.reduce((acc, job) => acc + Number(job.budget || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        activeJobs: stats?._count.jobsAsFreelancer || 0,
        pendingProposals: stats?._count.proposals || 0,
        monthlyEarnings
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const getRecommendedJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;

    // 1. Get user profile for location and skills
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: { select: { id: true } } }
    });

    if (!userProfile || !userProfile.latitude || !userProfile.longitude) {
      // If no location, just return recent open jobs
      const recentJobs = await prisma.job.findMany({
        where: { status: JobStatus.OPEN },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          client: { select: { fullName: true } },
          skillsRequired: { select: { name: true } }
        }
      });
      return res.status(200).json({ success: true, data: recentJobs });
    }

    const { latitude, longitude } = userProfile;
    const skillIds = userProfile.skills.map(s => s.id);

    // 2. Simple bounding box matching (reusing logic from matcher.service)
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
        client: { select: { fullName: true } },
        skillsRequired: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // 3. Mark match level (rough heuristic)
    const dataWithMatch = recommendedJobs.map(job => {
      const matchCount = job.skillsRequired.filter(s => skillIds.includes((s as any).id)).length;
      const matchPercent = skillIds.length > 0 ? (matchCount / job.skillsRequired.length) * 100 : 0;
      return { ...job, matchPercent: Math.round(matchPercent) };
    });

    res.status(200).json({ success: true, data: dataWithMatch });
  } catch (error) {
    console.error("Recommended Jobs Error:", error);
    res.status(500).json({ error: "Failed to fetch recommended jobs" });
  }
};