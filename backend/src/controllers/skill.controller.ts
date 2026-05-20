import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getSkillTree = async (req: Request, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      where: {
        parentId: null, 
        tier: 1,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        tier: true,
        subSkills: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            tier: true,
            subSkills: {
              orderBy: {
                name: "asc",
              },
              select: {
                id: true,
                name: true,
                tier: true,
                subSkills: {
                  orderBy: {
                    name: "asc",
                  },
                  select: {
                    id: true,
                    name: true,
                    tier: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Error fetching skill tree:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }
};