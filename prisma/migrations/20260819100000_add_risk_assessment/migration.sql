-- Additive Phase 2 AI Safety Brief storage. Phase 1 records remain unchanged.
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

CREATE TABLE "RiskAssessment" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "summary" VARCHAR(600) NOT NULL,
    "contributingFactors" JSONB NOT NULL,
    "safetyActions" JSONB NOT NULL,
    "recommendedCheckInMinutes" INTEGER NOT NULL,
    "assessmentContext" VARCHAR(500),
    "modelName" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RiskAssessment_sessionId_createdAt_idx" ON "RiskAssessment"("sessionId", "createdAt");

ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "SafetySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
