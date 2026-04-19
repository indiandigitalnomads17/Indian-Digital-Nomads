import { Request, Response } from "express";
import prisma from "../config/prisma";
import { notifyNomad } from "../services/notification.service";
import { Prisma } from "@prisma/client";

export const submitProposal = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    
    // 1. Destructure from body
    const { jobId, coverLetter, bidAmount, estimatedDays } = req.body;

    // 2. Initial Job Check
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { clientId: true, title: true }
    });

    if (!job) {
      return res.status(404).json({ error: "The job you are applying for no longer exists." });
    }

    if (job.clientId === userId) {
      return res.status(400).json({ error: "You cannot submit a proposal to your own job post." });
    }

    // 3. Create the Proposal
    const proposal = await prisma.proposal.create({
      data: {
        coverLetter,
        // bidAmount is Decimal in schema; Prisma accepts number or string for Decimal
        bidAmount: new Prisma.Decimal(bidAmount), 
        estimatedDays: estimatedDays ? Number(estimatedDays) : null,
        status: "PENDING",
        job: { connect: { id: jobId } },
        freelancer: { connect: { id: userId } }
      }
    });

    // 4. Send Success Response immediately
    res.status(201).json({ 
      success: true, 
      message: "Proposal sent successfully!", 
      data: proposal 
    });

    // 5. Background Notification to the Client
    (async () => {
      try {
        await notifyNomad({
          userId: job.clientId,
          type: "PROPOSAL_RECEIVED",
          message: `New nomad proposal for "${job.title}" at ₹${bidAmount}`,
          link: `/dashboard/client/proposals/${proposal.id}`
        });
      } catch (bgError) {
        console.error("❌ Notification background task failed:", bgError);
      }
    })();

  } catch (error: any) {
    // P2002 is the Prisma code for Unique constraint failed
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "You have already submitted a proposal for this job." 
      });
    }

    console.error("Proposal Submission Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error while submitting proposal." });
    }
  }
};