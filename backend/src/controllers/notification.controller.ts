import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, 
    });

    const unreadCount = await prisma.notification.count({
      where: { 
        userId, 
        isRead: false 
      }
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error("Fetch Notifications Error Details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};


export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { notificationId } = req.body; 

    await prisma.notification.updateMany({
      where: {
        userId,
        ...(notificationId ? { id: notificationId } : { isRead: false })
      },
      data: { isRead: true }
    });

    res.status(200).json({ success: true, message: "Notifications updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};