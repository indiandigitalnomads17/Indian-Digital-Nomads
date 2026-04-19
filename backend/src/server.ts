import dotenv from "dotenv";
import { createServer } from "http";
import { app, sessionMiddleware } from './app';
import { initSocket } from "./config/socket";
import prisma from './config/prisma';

dotenv.config({ path: './.env' });

// Create HTTP Server
const httpServer = createServer(app);


initSocket(httpServer, sessionMiddleware);

prisma.$connect()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    httpServer.listen(PORT, () => {
      console.log(`⚙️ Server & Sockets running at port : ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.log("❌ DB connection failed !!! ", err);
  });