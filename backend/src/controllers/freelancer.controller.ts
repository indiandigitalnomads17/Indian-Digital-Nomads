import { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadOnCloudinary } from "../config/cloudinary";
import { User as PrismaUser } from "@prisma/client";
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

    if (files?.profilePic?.[0]) {
      const result = await uploadOnCloudinary(files.profilePic[0].path);
      if (result) profilePicUrl = result.secure_url;
    }
    
    if (files?.introVideo?.[0]) {
      const result = await uploadOnCloudinary(files.introVideo[0].path);
      if (result) introVideoUrl = result.secure_url;
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