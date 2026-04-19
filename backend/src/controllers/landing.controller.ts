import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getLandingPageShowcase = async (req: Request, res: Response) => {
  try {
    
    const [
      freelancerReviews,
      clientReviews,
      completedJobsShowcase,
      totalNomads,
      jobsCompleted,
      activeClients
    ] = await prisma.$transaction([
      
      
      prisma.review.findMany({
        where: { rating: { gte: 4 }, reviewee: { role: "FREELANCER" } },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewee: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { profilePicLink: true } }
            }
          }
        }
      }),

      
      prisma.review.findMany({
        where: { rating: { gte: 4 }, reviewee: { role: "CLIENT" } },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewee: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { profilePicLink: true } }
            }
          }
        }
      }),

      
      prisma.job.findMany({
        where: { status: "COMPLETED" },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          budget: true,
          location: true,
          freelancer: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { profilePicLink: true } }
            }
          },
          client: {
            select: { fullName: true }
          },
          reviews: {
            where: { rating: { gte: 4 } },
            take: 1,
            select: { comment: true, rating: true }
          }
        }
      }),

      prisma.user.count({ where: { role: "FREELANCER" } }),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { role: "CLIENT" } })
    ]) as [any[], any[], any[], number, number, number]; 
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalNomads,
          jobsCompleted,
          activeClients
        },
        freelancerReviews,
        clientReviews,
        completedJobsShowcase
      }
    });

  } catch (error) {
    console.error("Landing Page Data Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error while loading showcase." 
    });
  }
};