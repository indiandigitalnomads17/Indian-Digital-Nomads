import { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadOnCloudinary } from "../config/cloudinary";
import { clientOnboardingSchema } from "../validations/cleint.schema";
import { User as PrismaUser } from "@prisma/client";
import { postJobSchema } from "../validations/job.schema";

export const onboardClient = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as PrismaUser)?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 1. Validate Text Input (Ensure phoneNumber is in your Zod schema)
    const validation = clientOnboardingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { bio, location, latitude, longitude, phoneNumber } = validation.data;

    // 2. Handle Media Uploads
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
  const userId = req.user?.id;

  const clientData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      profile: true, 
      // Stats for the dashboard
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
    const userId = (req.user as PrismaUser)?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const validation = postJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { 
      title, description, type, budget, estimatedHours, 
      location, latitude, longitude, skills 
    } = validation.data;


    const jobImageUrls: string[] = [];
    if (files?.jobImages) {
      for (const file of files.jobImages) {
        const result = await uploadOnCloudinary(file.path);
        if (result) jobImageUrls.push(result.secure_url);
      }
    }

    let briefVideoUrl: string | undefined;
    if (files?.briefVideo?.[0]) {
      const result = await uploadOnCloudinary(files.briefVideo[0].path);
      briefVideoUrl = result?.secure_url;
    }

    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        type, // FIXED_PRICE or HOURLY
        budget: budget ?? null,
        estimatedHours: estimatedHours ?? null,
        location,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        clientId: userId,
        videoUrl: briefVideoUrl,
        images: {
          create: jobImageUrls.map(url => ({ url }))
        },
        skillsRequired: {
          connect: skills.map((id: string) => ({ id })),
        },
      },
      include: {
        images: true,
        skillsRequired: { select: { name: true } }
      }
    });

    res.status(201).json({ success: true, data: newJob });

  } catch (error) {
    console.error("Job Creation Error:", error);
    res.status(500).json({ error: "Failed to post job" });
  }
};