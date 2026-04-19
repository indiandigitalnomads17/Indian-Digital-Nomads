import prisma from "../config/prisma";

export const getQualifiedFreelancers = async (jobLat: number, jobLong: number, requiredSkillIds: string[]) => {
  const RADIUS_KM = 50;
  const degToKm = 111; 
  const MATCH_THRESHOLD = 0.5; // 50% match

  // 1. Spatial + Skill Query
  const candidates = await prisma.profile.findMany({
    where: {
      user: { role: "FREELANCER" },
      latitude: { 
        gte: jobLat - (RADIUS_KM / degToKm), 
        lte: jobLat + (RADIUS_KM / degToKm) 
      },
      longitude: { 
        gte: jobLong - (RADIUS_KM / degToKm), 
        lte: jobLong + (RADIUS_KM / degToKm) 
      },
      // Narrow down to anyone with at least 1 matching skill first
      skills: { some: { id: { in: requiredSkillIds } } }
    },
    include: {
      skills: {
        where: { id: { in: requiredSkillIds } },
        select: { id: true }
      }
    }
  });

  // 2. Match Score Filter
  return candidates.filter(profile => {
    const score = profile.skills.length / requiredSkillIds.length;
    return score >= MATCH_THRESHOLD;
  });
};