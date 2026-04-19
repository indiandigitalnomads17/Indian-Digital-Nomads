import { Request, Response } from "express";
import prisma from "../config/prisma";


export const getFreelancerPublicProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const freelancer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            profilePicLink: true,
            videoLink: true,
            location: true,
            isHourly: true,
            hourlyRate: true,
            preferredJobType: true,
            skills: {
              select: { id: true, name: true }
            },
            projects: {
              include: {
                images: true,
                skillsUsed: { select: { name: true } }
              }
            }
          }
        },
        jobsAsFreelancer: {
          where: { status: "COMPLETED" },
          select: {
            type: true,
            estimatedHours: true,
          }
        },
        reviewsRec: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { fullName: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!freelancer) {
      return res.status(404).json({ error: "Nomad not found." });
    }

    if (freelancer.role !== "FREELANCER") {
      return res.status(403).json({ 
        error: "This ID belongs to a Client. Please use the Client directory." 
      });
    }

    let totalHoursWorked = 0;
    const completedJobsCount = freelancer.jobsAsFreelancer.length;

    freelancer.jobsAsFreelancer.forEach((job:any) => {
      if (job.type === "HOURLY") {
        totalHoursWorked += job.estimatedHours || 0;
      }
    });

    const { jobsAsFreelancer, ...cleanData } = freelancer;

    return res.status(200).json({
      success: true,
      data: {
        ...cleanData,
        metrics: {
          totalHoursWorked,
          completedJobsCount,
          averageRating: freelancer.reviewsRec.length > 0 
            ? (freelancer.reviewsRec.reduce((acc:any, r:any) => acc + r.rating, 0) / freelancer.reviewsRec.length).toFixed(1)
            : "No reviews yet"
        }
      }
    });

  } catch (error) {
    console.error("Freelancer Profile Error:", error);
    return res.status(500).json({ error: "Failed to fetch nomad profile" });
  }
};

export const getClientPublicProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const client = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        role: true,
        profile: {
          select: {
            bio: true,
            profilePicLink: true,
            location: true,
          },
        },

        jobsAsClient: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            title: true,
            type: true,
            budget: true,
            estimatedHours: true,
            freelancerId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        reviewsRec: {
          select: {
            rating: true,
            comment: true,
            reviewer: { select: { fullName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10, 
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Client profile not found." });
    }

    if (client.role !== "CLIENT") {
      return res.status(403).json({
        error: "Access Denied: This ID belongs to a Freelancer profile.",
      });
    }

    let totalSpent = 0;
    const uniqueFreelancerIds = new Set<string>();

    client.jobsAsClient.forEach((job:any) => {
      const amount = Number(job.budget || 0);
      
      if (job.type === "HOURLY") {
        totalSpent += amount * (job.estimatedHours || 0);
      } else {
        totalSpent += amount;
      }

      if (job.freelancerId) {
        uniqueFreelancerIds.add(job.freelancerId);
      }
    });

    const recentJobsSnippet = client.jobsAsClient.slice(0, 5);

    const { jobsAsClient, ...cleanClientData } = client;

    return res.status(200).json({
      success: true,
      data: {
        ...cleanClientData,
        recentJobs: recentJobsSnippet,
        metrics: {
          totalMoneySpent: Number(totalSpent.toFixed(2)),
          freelancersHiredCount: uniqueFreelancerIds.size,
          totalCompletedJobs: jobsAsClient.length,
        },
      },
    });

  } catch (error) {
    console.error("Critical Controller Error:", error);
    return res.status(500).json({ 
      error: "An internal error occurred while fetching the profile." 
    });
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        projectUrl: true, 
        videoUrl: true,   
        completedAt: true,
        skillsUsed: {
          select: { id: true, name: true }
        },
        
        images: {
          select: { id: true, url: true, altText: true }
        },
       
        profile: {
          select: {
            userId: true,
            user: {
              select: {
                fullName: true,
                profile: { select: { profilePicLink: true } }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found."
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error("Fetch Project Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPublicJobDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        type: true,
        budget: true,
        estimatedHours: true,
        createdAt: true,

        location: true,
        latitude: true,
        longitude: true,

        videoUrl: true, 
        images: {
          select: {
            id: true,
            url: true
          }
        },

        skillsRequired: {
          select: {
            id: true,
            name: true
          }
        },

        client: {
          select: {
            fullName: true,
            profile: {
              select: {
                profilePicLink: true,
                location: true 
              }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found."
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error("Fetch Job Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
    });
  }
};