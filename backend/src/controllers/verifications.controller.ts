import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { renderEmailOtpTemplate } from '../services/email.service';
import prisma from "../config/prisma";


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: 'indiandigitalnomads17@gmail.com',    
    pass: process.env.GMAIL_APP_PASSWORD,       
  },
  tls: {
    rejectUnauthorized: true
  }
});


const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const hashOTP = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');


export const sendEmailOtp = async (req: any, res: any) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "User identity context is missing." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found." });
    }

    const otp = generateOTP();
    const tokenHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 


    await prisma.verificationToken.upsert({
      where: {
        userId_type: {
          userId: userId,
          type: 'EMAIL_OTP',
        },
      },
      update: {
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        userId,
        type: 'EMAIL_OTP',
        tokenHash,
        expiresAt,
      },
    });

    await transporter.sendMail({
      from: '"Indian Digital Nomads" <indiandigitalnomads17@gmail.com>',
      to: user.email,
      subject: 'Verify your email address - Indian Digital Nomads',
      html: renderEmailOtpTemplate(otp),
    });

    return res.status(200).json({ success: true, message: "Verification code sent successfully." });

  } catch (error) {
    console.error("Internal Server Error (Send):", error);
    return res.status(500).json({ error: "SERVER_ERROR", message: "An unexpected error occurred while processing your request." });
  }
};


export const verifyEmailOtp = async (req: any, res: any) => {
  const userId = req.user?.id;
  const { otp } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "User identity context is missing." });
  }

  if (!otp) {
    return res.status(400).json({ error: "MISSING_FIELDS", message: "Verification code is required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verificationTokens: {
          where: { type: 'EMAIL_OTP' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "No user account was found matching this ID." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "ALREADY_VERIFIED", message: "This email address has already been confirmed." });
    }

    const activeToken = user.verificationTokens[0];

    if (!activeToken) {
      return res.status(400).json({ error: "NO_ACTIVE_TOKEN", message: "No active verification code found. Please request a new one." });
    }


    if (new Date() > activeToken.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: activeToken.id } });
      return res.status(410).json({ error: "TOKEN_EXPIRED", message: "This verification code has expired. Please request a new code." });
    }


    if (hashOTP(otp) !== activeToken.tokenHash) {
      return res.status(400).json({ error: "INVALID_CODE", message: "The code you entered is incorrect. Please check and try again." });
    }

    
    await prisma.$transaction([
      prisma.verificationToken.delete({ where: { id: activeToken.id } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          isVerified: user.isPhoneNumberVerified ? true : false 
        }
      })
    ]);

    return res.status(200).json({ success: true, message: "Your email address has been successfully verified!" });

  } catch (error) {
    console.error("Internal Server Error (Verify):", error);
    return res.status(500).json({ error: "SERVER_ERROR", message: "An unexpected error occurred during confirmation." });
  }
};