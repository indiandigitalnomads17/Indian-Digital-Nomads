import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

const userSocketMap = new Map<string, string>();

export const initSocket = (server: HttpServer, sessionMiddleware: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    const req = socket.request as any;
    
    const userId = req.session?.passport?.user;


    if (!userId) {
      socket.disconnect(true);
      return;
    }

    userSocketMap.set(userId, socket.id);

    socket.on("disconnect", () => {
      userSocketMap.delete(userId);
    });
  });

  return io;
};

export const emitToUser = (userId: string, data: any) => {
  if (!io) {
    return false;
  }

  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit("notification", data);
    return true; 
  }
  
  return false; 
};