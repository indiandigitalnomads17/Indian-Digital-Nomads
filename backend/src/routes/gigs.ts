import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';

const router: Router = Router();

// GET /api/gigs - Fetch all gigs
router.get('/', async (req: Request, res: Response) => {
  try {
    const gigs = await prisma.gig.findMany({
      include: { author: true }, // Includes user info who posted the gig
      orderBy: { createdAt: 'desc' }
    });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gigs' });
  }
});

// POST /api/gigs - Create a new gig
router.post('/', async (req: Request, res: Response) => {
  const { title, description, location, pay, authorId } = req.body;

  try {
    const newGig = await prisma.gig.create({
      data: {
        title,
        description,
        location,
        pay: pay ? parseFloat(pay) : null,
        authorId, // Ensure this user exists in your DB first!
      },
    });
    res.status(201).json(newGig);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create gig. Check if authorId is valid.' });
  }
});

export default router;