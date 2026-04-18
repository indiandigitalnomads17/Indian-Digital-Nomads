-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "isHourly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredJobType" "JobType" NOT NULL DEFAULT 'FIXED_PRICE';

-- CreateTable
CREATE TABLE "JobImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobImage" ADD CONSTRAINT "JobImage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
