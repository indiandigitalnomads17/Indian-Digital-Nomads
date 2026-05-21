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
          link: `/client/proposals/${proposal.id}`
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

export const getProposalsByJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;
    const clientId = (req.user as any)?.id;

    // Check if the job belongs to this client
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { clientId: true }
    }) as any;

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.clientId !== clientId) {
      return res.status(403).json({ success: false, error: "Unauthorized access to job proposals" });
    }

    const proposals = await prisma.proposal.findMany({
      where: { jobId },
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profile: {
              select: {
                profilePicLink: true,
                bio: true,
                location: true,
                skills: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }) as any;

    return res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    console.error("Get Proposals Error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const updateProposalStatus = async (req: Request, res: Response) => {
  try {
    const proposalId = req.params.id as string;
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
    const clientId = (req.user as any)?.id;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value" });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: { select: { clientId: true, title: true } }
      }
    }) as any;

    if (!proposal) {
      return res.status(404).json({ success: false, error: "Proposal not found" });
    }

    if (proposal.job.clientId !== clientId) {
      return res.status(403).json({ success: false, error: "Unauthorized operation" });
    }

    // Use a transaction if ACCEPTED, to update proposal status, update job status to IN_PROGRESS, and associate the freelancer
    if (status === 'ACCEPTED') {
      await prisma.$transaction([
        prisma.proposal.update({
          where: { id: proposalId },
          data: { status: 'ACCEPTED' }
        }),
        prisma.job.update({
          where: { id: proposal.jobId },
          data: {
            status: 'IN_PROGRESS',
            freelancerId: proposal.freelancerId
          }
        }),
        // Reject all other proposals for this job
        prisma.proposal.updateMany({
          where: {
            jobId: proposal.jobId,
            id: { not: proposalId }
          },
          data: { status: 'REJECTED' }
        })
      ]);
    } else {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'REJECTED' }
      });
    }

    // Background notification
    (async () => {
      try {
        await notifyNomad({
          userId: proposal.freelancerId,
          type: "PROPOSAL_UPDATE",
          message: `Your proposal for "${proposal.job.title}" has been ${status.toLowerCase()}`,
          link: `/freelancer/profile`
        });
      } catch (bgError) {
        console.error("❌ Notification background task failed:", bgError);
      }
    })();

    return res.status(200).json({ success: true, message: `Proposal ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error("Update Proposal Error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};