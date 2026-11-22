-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Critical', 'High', 'Medium', 'Low', 'Unknown');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('Corroborated', 'Developing', 'Unverified');

-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('Active', 'Monitoring', 'Resolved');

-- CreateEnum
CREATE TYPE "DataMode" AS ENUM ('demo', 'replay');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('Healthy', 'Delayed', 'Offline');

-- CreateEnum
CREATE TYPE "ReplayEventType" AS ENUM ('incident', 'update', 'evidence');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "SourceStatus" NOT NULL DEFAULT 'Healthy',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "lastSync" TIMESTAMP(3) NOT NULL,
    "lastAttempt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'Unknown',
    "evidenceStatus" "EvidenceStatus" NOT NULL DEFAULT 'Unverified',
    "lifecycleStatus" "LifecycleStatus" NOT NULL DEFAULT 'Active',
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "mode" "DataMode" NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "verificationStatus" "EvidenceStatus" NOT NULL DEFAULT 'Unverified',

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "mode" "DataMode" NOT NULL DEFAULT 'demo',
    "summary" TEXT NOT NULL,
    "findings" TEXT[],
    "limitations" TEXT[],
    "sources" TEXT[],

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "dataQualityNotes" TEXT NOT NULL,
    "evaluation" TEXT NOT NULL,

    CONSTRAINT "ReplayScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplayEvent" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL,
    "eventType" "ReplayEventType" NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ReplayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Incident_mode_lifecycleStatus_lastUpdatedAt_idx" ON "Incident"("mode", "lifecycleStatus", "lastUpdatedAt");

-- CreateIndex
CREATE INDEX "Incident_firstDetectedAt_idx" ON "Incident"("firstDetectedAt");

-- CreateIndex
CREATE INDEX "Incident_state_district_idx" ON "Incident"("state", "district");

-- CreateIndex
CREATE INDEX "Incident_category_idx" ON "Incident"("category");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Evidence_incidentId_availableAt_idx" ON "Evidence"("incidentId", "availableAt");

-- CreateIndex
CREATE INDEX "Evidence_sourceId_idx" ON "Evidence"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_incidentId_sourceUrl_key" ON "Evidence"("incidentId", "sourceUrl");

-- CreateIndex
CREATE INDEX "Report_incidentId_idx" ON "Report"("incidentId");

-- CreateIndex
CREATE INDEX "Report_generatedAt_idx" ON "Report"("generatedAt");

-- CreateIndex
CREATE INDEX "ReplayEvent_scenarioId_availableAt_idx" ON "ReplayEvent"("scenarioId", "availableAt");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplayEvent" ADD CONSTRAINT "ReplayEvent_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "ReplayScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
