-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "delistReason" TEXT,
ADD COLUMN     "isDelisted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "KycLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KycLog" ADD CONSTRAINT "KycLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycLog" ADD CONSTRAINT "KycLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
