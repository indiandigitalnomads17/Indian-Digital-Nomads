import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getSkillTree = async (req: Request, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      where: {
        parentId: null, // Get only top-level categories
      },
      include: {
        subSkills: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Error fetching skill tree:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};