import { Request, Response } from "express";
import { UserRole, PrismaClient, JobStatus }  from "@prisma/client";
import prisma from "../config/prisma";

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export const getFreelancers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const skill = req.query.skill as string | undefined;
    const minNomadScore = req.query.minNomadScore as string | undefined;
    const minRating = req.query.minRating as string | undefined;
    const textLocation = req.query.location as string | undefined; 
    const maxHourlyRate = req.query.maxHourlyRate as string | undefined;
    const preferredJobType = req.query.preferredJobType as string | undefined;

    const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const userLon = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const maxRadiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 11; 

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const profileFilter: any = { 
      isNot: null 
    };

    if (userLat !== undefined && userLon !== undefined) {
      profileFilter.latitude = { not: null };
      profileFilter.longitude = { not: null };
    }

    if (skill) {
      profileFilter.skills = {
        some: {
          name: { equals: skill, mode: 'insensitive' }
        }
      };
    }

    if (textLocation) {
      profileFilter.location = { contains: textLocation, mode: 'insensitive' };
    }

    if (maxHourlyRate) {
      profileFilter.hourlyRate = { lte: parseFloat(maxHourlyRate) };
    }

    if (preferredJobType) {
      profileFilter.preferredJobType = preferredJobType;
    }

    const whereClause: any = {
      role: UserRole.FREELANCER,
      status: 'ACTIVE',
      profile: profileFilter
    };

    if (minNomadScore) {
      whereClause.nomadScore = { gte: parseFloat(minNomadScore) };
    }

    const freelancers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        nomadScore: true,
        profile: {
          select: {
            profilePicLink: true,
            bannerLink: true,
            bio: true,
            location: true,
            latitude: true,  
            longitude: true,  
            hourlyRate: true,
            isHourly: true,
            preferredJobType: true,
            skills: {
              select: {
                id: true,
                name: true,
                tier: true
              }
            }
          }
        },
        reviewsRec: {
          select: {
            rating: true
          }
        }
      },
      ...(userLat === undefined || userLon === undefined ? { skip, take: limit } : {}),
      orderBy: {
        nomadScore: 'desc'
      }
    });

    let formattedFreelancers = freelancers.map((user) => {
      const totalReviews = user.reviewsRec.length;
      const averageRating = totalReviews > 0
        ? parseFloat((user.reviewsRec.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
        : 0;

      const { reviewsRec, ...cleanUserStructure } = user;

      const distanceAwayKm = (userLat !== undefined && userLon !== undefined && user.profile?.latitude && user.profile?.longitude)
        ? parseFloat(calculateDistanceKm(userLat, userLon, user.profile.latitude as number, user.profile.longitude as number).toFixed(2))
        : null;

      return {
        id: cleanUserStructure.id,
        fullName: cleanUserStructure.fullName,
        isVerified: cleanUserStructure.isVerified,
        nomadScore: cleanUserStructure.nomadScore,
        distanceAwayKm, 
        profile: cleanUserStructure.profile ? {
          bio: cleanUserStructure.profile.bio,
          profilePicLink: cleanUserStructure.profile.profilePicLink,
          bannerLink: cleanUserStructure.profile.bannerLink,
          location: cleanUserStructure.profile.location,
          hourlyRate: cleanUserStructure.profile.hourlyRate,
          isHourly: cleanUserStructure.profile.isHourly,
          preferredJobType: cleanUserStructure.profile.preferredJobType,
          groupedSkills: {
            categories: cleanUserStructure.profile.skills.filter(s => s.tier === 1).map(s => s.name),
            parentSkills: cleanUserStructure.profile.skills.filter(s => s.tier === 2).map(s => s.name),
            subSkills: cleanUserStructure.profile.skills.filter(s => s.tier === 3).map(s => s.name),
            specializations: cleanUserStructure.profile.skills.filter(s => s.tier === 4).map(s => s.name)
          }
        } : null,
        metrics: {
          averageRating,
          totalReviews
        }
      };
    });

    if (minRating) {
      const targetRating = parseFloat(minRating);
      formattedFreelancers = formattedFreelancers.filter(
        (user) => user.metrics.averageRating >= targetRating
      );
    }

    if (userLat !== undefined && userLon !== undefined) {
      formattedFreelancers = formattedFreelancers.filter(
        (user) => user.distanceAwayKm !== null && user.distanceAwayKm <= maxRadiusKm
      );
    }

    let finalPageData = formattedFreelancers;
    let totalItemsCount = formattedFreelancers.length;

    if (userLat !== undefined && userLon !== undefined) {
      totalItemsCount = formattedFreelancers.length;
      finalPageData = formattedFreelancers.slice(skip, skip + limit);
    } else {
      totalItemsCount = await prisma.user.count({ where: whereClause });
    }

    return res.status(200).json({
      success: true,
      meta: {
        totalItems: totalItemsCount,
        currentPage: page,
        totalPages: Math.ceil(totalItemsCount / limit),
        itemsPerPage: limit
      },
      data: finalPageData
    });

  } catch (error) {
    console.error("Critical Controller Error inside getFreelancers:", error);
    return res.status(500).json({ 
      error: "An internal error occurred while fetching the freelancer repository." 
    });
  }
};
export const getPublicBusinesses = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const userLon = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const maxRadiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 11; // Default to 11km radius

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '12', 10);
    const skip = (page - 1) * limit;

    if (userLat === undefined || userLon === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing geospatial tracking metrics. Please provide 'latitude' and 'longitude' parameters."
      });
    }

    const whereClause: any = {
      role: UserRole.CLIENT, 
      status: 'ACTIVE',
      profile: {
        isNot: null,
        latitude: { not: null },
        longitude: { not: null }
      }
    };

    const businesses = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        nomadScore: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            profilePicLink: true,
            bannerLink: true,
            location: true,
            latitude: true,  
            longitude: true, 
          }
        },
    
        reviewsRec: {
          select: {
            rating: true
          }
        },
       
        _count: {
          select: {
            jobsAsClient: { where: { status: "OPEN" } }
          }
        }
      },
      orderBy: { nomadScore: 'desc' } 
    });

    let structuredBusinesses = businesses.map((biz) => {
      const totalReviews = biz.reviewsRec.length;
      const averageRating = totalReviews > 0
        ? parseFloat((biz.reviewsRec.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
        : 0;

    
      const bizLat = biz.profile!.latitude as number;
      const bizLon = biz.profile!.longitude as number;

      const distanceAwayKm = parseFloat(calculateDistanceKm(userLat, userLon, bizLat, bizLon).toFixed(2));

      return {
        id: biz.id,
        businessName: biz.fullName,
        isVerified: biz.isVerified,
        nomadScore: biz.nomadScore,
        joinedAt: biz.createdAt,
        distanceAwayKm,
        profile: {
          bio: biz.profile!.bio,
          profilePicLink: biz.profile!.profilePicLink,
          bannerLink: biz.profile!.bannerLink,
          location: biz.profile!.location,
          latitude: bizLat,
          longitude: bizLon
        },
        metrics: {
          averageRating,
          totalReviewCount: totalReviews,
          activeOpenJobsCount: biz._count?.jobsAsClient || 0
        }
      };
    });

    structuredBusinesses = structuredBusinesses.filter(
      (biz) => biz.distanceAwayKm <= maxRadiusKm
    );

    structuredBusinesses.sort((a, b) => a.distanceAwayKm - b.distanceAwayKm);

    const totalItemsCount = structuredBusinesses.length;
    const paginatedBusinesses = structuredBusinesses.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      meta: {
        totalItems: totalItemsCount,
        currentPage: page,
        totalPages: Math.ceil(totalItemsCount / limit),
        itemsPerPage: limit,
        appliedRadiusKm: maxRadiusKm
      },
      data: paginatedBusinesses
    });

  } catch (error) {
    console.error("Critical Error inside getPublicBusinesses:", error);
    return res.status(500).json({ 
      error: "An internal error occurred while parsing geospatial business listings." 
    });
  }
};

export const getFreelancerPublicProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const freelancer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        nomadScore: true,
        createdAt: true,
        role: true,
        profile: {
          select: {
            id: true,
            bio: true,
            profilePicLink: true,
            bannerLink: true,
            videoLink: true,
            location: true,
            hourlyRate: true,
            isHourly: true,
            preferredJobType: true,
            projects: {
              select: {
                id: true,
                title: true,
                description: true,
                links: true,
                videoUrl: true,
                completedAt: true,
                images: {
                  select: {
                    url: true,
                    altText: true
                  }
                },
                skillsUsed: {
                  select: {
                    name: true
                  }
                }
              },
              orderBy: { completedAt: "desc" }
            },
            skills: {
              select: {
                id: true,
                name: true,
                tier: true
              }
            }
          }
        },
        jobsAsFreelancer: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        },
        reviewsRec: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                fullName: true,
                profile: {
                  select: {
                    profilePicLink: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!freelancer) {
      return res.status(404).json({ error: "Freelancer profile not found." });
    }

    if (freelancer.role !== UserRole.FREELANCER) {
      return res.status(403).json({
        error: "Access Denied: This ID does not belong to an active Freelancer profile.",
      });
    }

    const completedJobsCount = freelancer.jobsAsFreelancer.length;
    const totalReviews = freelancer.reviewsRec.length;
    
    const averageRating = totalReviews > 0
      ? parseFloat((freelancer.reviewsRec.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
      : 0;

    
    const rawSkills = freelancer.profile?.skills || [];
    const groupedSkills = {
      categories: rawSkills.filter(s => s.tier === 1).map(s => ({ id: s.id, name: s.name })),
      parentSkills: rawSkills.filter(s => s.tier === 2).map(s => ({ id: s.id, name: s.name })),
      subSkills: rawSkills.filter(s => s.tier === 3).map(s => ({ id: s.id, name: s.name })),
      specializations: rawSkills.filter(s => s.tier === 4).map(s => ({ id: s.id, name: s.name })) // Leaf skills (e.g. ReactJs)
    };


    const badges: string[] = [];
    if (Number(freelancer.nomadScore) >= 90) badges.push("TOP_RATED");
    if (completedJobsCount >= 20) badges.push("VETERAN_NOMAD");
    if (completedJobsCount > 0 && averageRating >= 4.8) badges.push("HIGH_SATISFACTION");
    if (freelancer.isVerified) badges.push("IDENTITY_VERIFIED");


    const { reviewsRec, jobsAsFreelancer, ...rootFreelancerData } = freelancer;
    const publicReviewsSnippet = reviewsRec.slice(0, 5);


    const cleanProfile = rootFreelancerData.profile ? {
      id: rootFreelancerData.profile.id,
      bio: rootFreelancerData.profile.bio,
      profilePicLink: rootFreelancerData.profile.profilePicLink,
      bannerLink: rootFreelancerData.profile.bannerLink,
      videoLink: rootFreelancerData.profile.videoLink,
      location: rootFreelancerData.profile.location,
      hourlyRate: rootFreelancerData.profile.hourlyRate,
      isHourly: rootFreelancerData.profile.isHourly,
      preferredJobType: rootFreelancerData.profile.preferredJobType,
      projects: rootFreelancerData.profile.projects, // Visual showcase grid
      groupedSkills 
    } : null;


    return res.status(200).json({
      success: true,
      data: {
        id: rootFreelancerData.id,
        fullName: rootFreelancerData.fullName,
        isVerified: rootFreelancerData.isVerified,
        nomadScore: rootFreelancerData.nomadScore,
        createdAt: rootFreelancerData.createdAt,
        role: rootFreelancerData.role,
        profile: cleanProfile,
        workHistory: jobsAsFreelancer, 
        recentReviews: publicReviewsSnippet,
        achievements: {
          badges,
          metrics: {
            totalCompletedJobs: completedJobsCount,
            averageRating: averageRating,
            totalReviewCount: totalReviews
          }
        }
      }
    });

  } catch (error) {
    console.error("Critical Controller Error inside getFreelancerPublicProfile:", error);
    return res.status(500).json({ 
      error: "An internal error occurred while parsing the public profile." 
    });
  }
};

export const getClientPublicProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const client = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        nomadScore: true,
        createdAt: true,
        role: true,
        profile: {
          select: {
            id: true,
            bio: true,
            profilePicLink: true,
            bannerLink: true,
            videoLink: true,
            location: true,
          }
        },
        jobsAsClient: {
          where: { status: "OPEN" },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            budget: true,
            estimatedHours: true,
            location: true,
            createdAt: true,
            skillsRequired: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        products: {
          where: { isDelisted: false },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            discountedPrice: true,
            coverImageUrl: true,
            videoUrl: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        },
        reviewsRec: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                fullName: true,
                profile: {
                  select: {
                    profilePicLink: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            jobsAsClient: { where: { status: "COMPLETED" } },
            products: { where: { isDelisted: false } }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Client profile not found." });
    }

    if (client.role !== UserRole.CLIENT) {
      return res.status(403).json({
        error: "Access Denied: This ID does not belong to an active Client profile.",
      });
    }

    const totalReviews = client.reviewsRec.length;
    const averageRating = totalReviews > 0
      ? parseFloat((client.reviewsRec.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const recentReviewsSnippet = client.reviewsRec.slice(0, 5);
    
    const openJobs = client.jobsAsClient;
    const listedProducts = client.products;

    const { jobsAsClient, products, reviewsRec, _count, ...cleanClientData } = client;

    return res.status(200).json({
      success: true,
      data: {
        ...cleanClientData,
        openJobs,
        listedProducts,
        recentReviews: recentReviewsSnippet,
        metrics: {
          totalCompletedContracts: _count?.jobsAsClient || 0,
          totalActiveProductsCount: _count?.products || 0,
          averageRating: averageRating,
          totalReviewCount: totalReviews
        }
      }
    });

  } catch (error) {
    console.error("Critical Controller Error inside getClientPublicProfile:", error);
    return res.status(500).json({ 
      error: "An internal error occurred while generating the public client profile showcase." 
    });
  }
};

export const getProjectDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        links: true,
        videoUrl: true,
        completedAt: true,
        images: {
          select: {
            id: true,
            url: true,
            altText: true
          },
          orderBy: { createdAt: 'asc' }
        },
        skillsUsed: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        },
        profile: {
          select: {
            id: true,
            bio: true,
            profilePicLink: true,
            location: true,
            user: {
              select: {
                id: true,
                fullName: true,
                isVerified: true,
                nomadScore: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project case study not found." });
    }

  
    const rawSkills = project.skillsUsed || [];
    const groupedSkills = {
      categories: rawSkills.filter(s => s.tier === 1).map(s => ({ id: s.id, name: s.name })),
      parentSkills: rawSkills.filter(s => s.tier === 2).map(s => ({ id: s.id, name: s.name })),
      subSkills: rawSkills.filter(s => s.tier === 3).map(s => ({ id: s.id, name: s.name })),
      specializations: rawSkills.filter(s => s.tier === 4).map(s => ({ id: s.id, name: s.name }))
    };

    return res.status(200).json({
      success: true,
      data: {
        id: project.id,
        title: project.title,
        description: project.description,
        links: project.links,
        videoUrl: project.videoUrl,
        completedAt: project.completedAt,
        galleryImages: project.images, 
        groupedSkills, 
        creator: {
          id: project.profile.user.id,
          profileId: project.profile.id,
          fullName: project.profile.user.fullName,
          bio: project.profile.bio,
          profilePicLink: project.profile.profilePicLink,
          location: project.profile.location,
          isVerified: project.profile.user.isVerified,
          nomadScore: project.profile.user.nomadScore
        }
      }
    });

  } catch (error) {
    console.error("Critical Error inside getProjectDetails:", error);
    return res.status(500).json({ error: "Internal server error analyzing project details." });
  }
};

export const getPublicJobs = async (req: Request, res: Response): Promise<Response> => {
  try {
    const skillName = req.query.skill as string | undefined;
    const type = req.query.type as string | undefined; 
    const maxBudget = req.query.maxBudget as string | undefined;
    
    const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const userLon = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const maxRadiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 11; // Defaults to 11km per your specs

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: 'OPEN' 
    };

    if (skillName) {
      whereClause.skillsRequired = {
        some: {
          name: { equals: skillName, mode: 'insensitive' }
        }
      };
    }

    if (type) {
      whereClause.type = type;
    }

    if (maxBudget) {
      whereClause.budget = { lte: parseFloat(maxBudget) };
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        budget: true,
        estimatedHours: true,
        location: true,
        latitude: true,  
        longitude: true, 
        createdAt: true,
        skillsRequired: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        },
        client: {
          select: {
            id: true,
            fullName: true,
            isVerified: true,
            nomadScore: true,
            profile: {
              select: {
                profilePicLink: true
              }
            }
          }
        }
      },
    
      ...(userLat === undefined || userLon === undefined ? { skip, take: limit } : {}),
      orderBy: { createdAt: 'desc' }
    });

    let structuredJobs = jobs.map((job) => {
      const rawSkills = job.skillsRequired || [];
      
    
      const distanceAwayKm = (userLat !== undefined && userLon !== undefined && job.latitude && job.longitude)
        ? parseFloat(calculateDistanceKm(userLat, userLon, job.latitude, job.longitude).toFixed(2))
        : null;

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        type: job.type,
        budget: job.budget,
        estimatedHours: job.estimatedHours,
        location: job.location,
        distanceAwayKm,
        createdAt: job.createdAt,
        client: {
          id: job.client.id,
          fullName: job.client.fullName,
          isVerified: job.client.isVerified,
          nomadScore: job.client.nomadScore,
          profilePicLink: job.client.profile?.profilePicLink || null
        },
        jobTaxonomy: {
          categories: rawSkills.filter(s => s.tier === 1).map(s => s.name),
          parentSkills: rawSkills.filter(s => s.tier === 2).map(s => s.name),
          subSkills: rawSkills.filter(s => s.tier === 3).map(s => s.name),
          specializations: rawSkills.filter(s => s.tier === 4).map(s => s.name)
        }
      };
    });

    if (userLat !== undefined && userLon !== undefined) {
      structuredJobs = structuredJobs.filter(
        (job) => job.distanceAwayKm !== null && job.distanceAwayKm <= maxRadiusKm
      );
    }

    let finalPageData = structuredJobs;
    let totalItemsCount = structuredJobs.length;

    if (userLat !== undefined && userLon !== undefined) {
      totalItemsCount = structuredJobs.length;
      finalPageData = structuredJobs.slice(skip, skip + limit);
    } else {
      totalItemsCount = await prisma.job.count({ where: whereClause });
    }

    return res.status(200).json({
      success: true,
      meta: {
        totalItems: totalItemsCount,
        currentPage: page,
        totalPages: Math.ceil(totalItemsCount / limit),
        itemsPerPage: limit
      },
      data: finalPageData
    });

  } catch (error) {
    console.error("Critical Error inside getPublicJobs directory payload:", error);
    return res.status(500).json({ error: "Internal server error sorting marketplace jobs." });
  }
};

export const getPublicJobDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ error: "Job ID is required" });
    }

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
        location: true,
        videoUrl: true, 
        createdAt: true,
        images: {
          select: {
            id: true,
            url: true
          }
        },
        skillsRequired: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        },
        client: {
          select: {
            id: true,
            fullName: true,
            isVerified: true,
            nomadScore: true,
            createdAt: true,
            profile: {
              select: {
                bio: true,
                profilePicLink: true,
                bannerLink: true,
                location: true
              }
            },
            reviewsRec: {
              select: {
                rating: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: "Job posting not found." });
    }

    if (job.status !== JobStatus.OPEN) {
      return res.status(410).json({
        error: "This job listing is no longer accepting applications or has been filled.",
      });
    }

    const businessReviews = job.client.reviewsRec || [];
    const totalBusinessReviews = businessReviews.length;
    const businessAverageRating = totalBusinessReviews > 0
      ? parseFloat((businessReviews.reduce((acc, curr) => acc + curr.rating, 0) / totalBusinessReviews).toFixed(1))
      : 0;

    const rawSkills = job.skillsRequired || [];
    const groupedSkills = {
      categories: rawSkills.filter(s => s.tier === 1).map(s => ({ id: s.id, name: s.name })),
      parentSkills: rawSkills.filter(s => s.tier === 2).map(s => ({ id: s.id, name: s.name })),
      subSkills: rawSkills.filter(s => s.tier === 3).map(s => ({ id: s.id, name: s.name })),
      specializations: rawSkills.filter(s => s.tier === 4).map(s => ({ id: s.id, name: s.name })) // e.g. Next.js, C++
    };

    return res.status(200).json({
      success: true,
      data: {
        id: job.id,
        title: job.title,
        description: job.description,
        type: job.type,
        budget: job.budget ? Number(job.budget) : null,
        estimatedHours: job.estimatedHours,
        location: job.location,
        videoUrl: job.videoUrl,
        postedAt: job.createdAt,
        specificationImages: job.images, 
        skillsRequired: groupedSkills,
        business: {
          id: job.client.id,
          companyName: job.client.fullName,
          isVerified: job.client.isVerified,
          nomadScore: job.client.nomadScore,
          memberSince: job.client.createdAt,
          bio: job.client.profile?.bio || null,
          profilePicLink: job.client.profile?.profilePicLink || null,
          bannerLink: job.client.profile?.bannerLink || null,
          headquarters: job.client.profile?.location || null,
          metrics: {
            averageRating: businessAverageRating,
            totalReviewCount: totalBusinessReviews
          }
        }
      }
    });

  } catch (error) {
    console.error("Critical Error inside getPublicJobDetails:", error);
    return res.status(500).json({ 
      error: "An internal error occurred while parsing the job specifications layout." 
    });
  }
};

