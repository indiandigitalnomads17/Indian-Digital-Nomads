import prisma from "../config/prisma";
import { emitToUser } from "../config/socket";

interface NotificationPayload {
  userId: string;
  type: string; // matches your schema
  message: string;
  link?: string;
}

export const notifyNomad = async ({ userId, type, message, link }: NotificationPayload) => {
  try {
    // 1. Save to DB (Persistence)
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        link: link || null,
        isRead: false
      },
    });

    // 2. Push Live (Real-time)
    emitToUser(userId, notification);

    return notification;
  } catch (error) {
    console.error(`❌ Notification failed for ${userId}:`, error);
    return null;
  }
};