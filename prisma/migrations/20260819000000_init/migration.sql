-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'SAFE', 'OVERDUE', 'SOS');

-- CreateEnum
CREATE TYPE "SafetyEventType" AS ENUM ('SESSION_STARTED', 'CHECK_IN', 'LOCATION_UPDATE', 'SOS_TRIGGERED', 'OVERDUE', 'COMPLETED');

-- CreateTable
CREATE TABLE "SafetySession" (
    "id" UUID NOT NULL,
    "ownerName" VARCHAR(100) NOT NULL,
    "destination" VARCHAR(200) NOT NULL,
    "travelMode" VARCHAR(40) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "trustedContactName" VARCHAR(100) NOT NULL,
    "trustedContactPhone" VARCHAR(30) NOT NULL,
    "shareCode" VARCHAR(32) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "lastCheckInAt" TIMESTAMP(3) NOT NULL,
    "nextCheckInAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyEvent" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "type" "SafetyEventType" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "message" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SafetySession_shareCode_key" ON "SafetySession"("shareCode");

-- CreateIndex
CREATE INDEX "SafetySession_status_idx" ON "SafetySession"("status");

-- CreateIndex
CREATE INDEX "SafetySession_nextCheckInAt_idx" ON "SafetySession"("nextCheckInAt");

-- CreateIndex
CREATE INDEX "SafetyEvent_sessionId_createdAt_idx" ON "SafetyEvent"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SafetySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
