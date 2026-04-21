import { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadOnCloudinary } from "../config/cloudinary";
import { clientOnboardingSchema } from "../validations/cleint.schema";
import { User as PrismaUser } from "@prisma/client";
import { postJobSchema } from "../validations/job.schema";
import { getQualifiedFreelancers } from "../services/matcher.service";
import { notifyNomad } from "../services/notification.service";

export const onboardClient = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const validation = clientOnboardingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { bio, location, latitude, longitude, phoneNumber } = validation.data;


    let logoUrl = undefined;
    if (files?.companyLogo?.[0]) {
      const uploadResult = await uploadOnCloudinary(files.companyLogo[0].path);
      logoUrl = uploadResult?.secure_url;
    }

    let videoUrl = undefined;
    if (files?.businessVideo?.[0]) {
      const uploadResult = await uploadOnCloudinary(files.businessVideo[0].path);
      videoUrl = uploadResult?.secure_url;
    }

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { phoneNumber }
      }),
      prisma.profile.update({
        where: { userId },
        data: {
          bio,
          location,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          profilePicLink: logoUrl || undefined,
          videoLink: videoUrl || undefined,
        },
        include: {
          user: { select: { fullName: true, role: true } }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Client profile updated successfully!",
      data: {
        ...updatedProfile,
        phoneNumber: updatedUser.phoneNumber
      }
    });

  } catch (error) {
    console.error("Client Onboarding Error:", error);
    res.status(500).json({ error: "Failed to onboard client" });
  }
};

export const getPrivateClientProfile = async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id;

  const clientData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      profile: true, 
      _count: {
        select: {
          jobsAsClient: true,
          reviewsSent: true,
          reviewsRec: true
        }
      },
      jobsAsClient: {
        where: { status: "OPEN" },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { proposals: true } }
        }
      },
      reviewsRec: {
        take: 5,
        include: {
          reviewer: { select: { fullName: true } }
        }
      }
    }
  });

  res.status(200).json({ success: true, data: clientData });
};

export const createJob = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    // Map Multer files correctly
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const validation = postJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { 
      title, description, type, budget, estimatedHours, 
      location, latitude, longitude, skills 
    } = validation.data;

    // 1. Process Images Array
    const jobImageUrls: string[] = [];
    if (files?.jobImages) {
      // Use Promise.all for faster concurrent uploads
      const uploadPromises = files.jobImages.map(file => uploadOnCloudinary(file.path));
      const results = await Promise.all(uploadPromises);
      
      results.forEach(result => {
        if (result?.secure_url) jobImageUrls.push(result.secure_url);
      });
    }

    let briefVideoUrl: string | undefined;
    if (files?.briefVideo?.[0]) {
      const videoResult = await uploadOnCloudinary(files.briefVideo[0].path);
      briefVideoUrl = videoResult?.secure_url;
    }

    // 3. Create Job with Relations
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        type,
        budget: budget ?? null,
        estimatedHours: estimatedHours ?? null,
        location,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        clientId: userId,
        videoUrl: briefVideoUrl || null,
        images: {
          create: jobImageUrls.map(url => ({ url }))
        },
        // Connect to existing skills by ID
        skillsRequired: {
          connect: skills.map((id: string) => ({ id }))
        },
      },
      include: {
        images: true, // This confirms they were saved in the response
        skillsRequired: true
      }
    });

    res.status(201).json({ success: true, data: newJob });

    // Background notifications (non-blocking)
    (async () => {
      try {
        if (newJob.latitude && newJob.longitude) {
          const qualifiedNomads = await getQualifiedFreelancers(
            newJob.latitude, 
            newJob.longitude, 
            skills
          );

          for (const nomad of qualifiedNomads) {
            await notifyNomad({
              userId: nomad.userId,
              type: "NEW_JOB",
              message: `New High-Match Job: ${newJob.title}`,
              link: `/jobs/${newJob.id}`
            });
          }
        }
      } catch (bgError) {
        console.error("Notification Background Error:", bgError);
      }
    })();

  } catch (error) {
    console.error("Job Creation Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error during job posting" });
    }
  }
};

export const getRecommendedFreelancers = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;

    // 1. Get client's open jobs to find matching skills
    const openJobs = await prisma.job.findMany({
      where: { clientId: userId, status: "OPEN" },
      include: { skillsRequired: { select: { id: true } } }
    });

    // 2. Get client's location from profile
    const clientProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { latitude: true, longitude: true }
    });

    if (!clientProfile || !clientProfile.latitude || !clientProfile.longitude) {
      // Fallback: return top rated freelancers if no location
      const topFreelancers = await prisma.user.findMany({
        where: { role: "FREELANCER" },
        take: 10,
        include: {
          profile: {
            include: { skills: { select: { name: true } } }
          }
        }
      });
      return res.status(200).json({ success: true, data: topFreelancers });
    }

    const { latitude, longitude } = clientProfile;
    const RADIUS_KM = 50;
    const degToKm = 111;

    // 3. Find freelancers nearby
    const nearbyFreelancers = await prisma.user.findMany({
      where: {
        role: "FREELANCER",
        profile: {
          latitude: {
            gte: latitude - (RADIUS_KM / degToKm),
            lte: latitude + (RADIUS_KM / degToKm)
          },
          longitude: {
            gte: longitude - (RADIUS_KM / degToKm),
            lte: longitude + (RADIUS_KM / degToKm)
          }
        }
      },
      include: {
        profile: {
          include: { skills: { select: { id: true, name: true } } }
        }
      },
      take: 20
    });

    // 4. Score based on matching skills from open jobs
    const clientSkillIds = new Set(openJobs.flatMap(j => j.skillsRequired.map(s => s.id)));
    
    const scoredFreelancers = nearbyFreelancers.map(freelancer => {
      const freelancerSkillIds = freelancer.profile?.skills.map(s => s.id) || [];
      const matchCount = freelancerSkillIds.filter(id => clientSkillIds.has(id)).length;
      const matchPercent = clientSkillIds.size > 0 ? (matchCount / clientSkillIds.size) * 100 : 0;
      
      return { 
        ...freelancer, 
        matchPercent: Math.round(matchPercent) 
      };
    }).sort((a, b) => b.matchPercent - a.matchPercent);

    res.status(200).json({ success: true, data: scoredFreelancers });

  } catch (error) {
    console.error("Recommended Freelancers Error:", error);
    res.status(500).json({ error: "Failed to fetch recommended freelancers" });
  }
};

export const getClientDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;

    const [activeGigs, totalHired, pendingProposals] = await prisma.$transaction([
      prisma.job.count({
        where: { clientId: userId, status: "OPEN" }
      }),
      prisma.job.count({
        where: { clientId: userId, status: { in: ["IN_PROGRESS", "COMPLETED"] } }
      }),
      prisma.proposal.count({
        where: { job: { clientId: userId }, status: "PENDING" }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeGigs,
        totalHired,
        pendingProposals
      }
    });

  } catch (error) {
    console.error("Client Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch client dashboard stats" });
  }
};

