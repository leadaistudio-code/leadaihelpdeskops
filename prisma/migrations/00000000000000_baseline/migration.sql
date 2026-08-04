-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'IT_AGENT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ASSIGNMENT', 'APPROVAL', 'REJECTION', 'RESOLUTION', 'COMMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('INCIDENT', 'REQUEST');

-- CreateEnum
CREATE TYPE "SlaSchedule" AS ENUM ('ALWAYS', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SlaStage" AS ENUM ('IN_PROGRESS', 'PAUSED', 'MET', 'BREACHED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('COMMENT', 'WORK_NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_USE', 'IN_STOCK', 'RETIRED', 'MISSING');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('NEW', 'INVESTIGATING', 'ROOT_CAUSE_IDENTIFIED', 'KNOWN_ERROR', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "Domain" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "moduleAccess" TEXT[] DEFAULT ARRAY['SELF_SERVICE']::TEXT[],
    "jobTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "schedule" "SlaSchedule" NOT NULL DEFAULT 'ALWAYS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "SlaDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaInstance" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "slaDefinitionId" TEXT,
    "name" TEXT NOT NULL,
    "targetHours" INTEGER NOT NULL,
    "schedule" "SlaSchedule" NOT NULL DEFAULT 'ALWAYS',
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "stage" "SlaStage" NOT NULL DEFAULT 'IN_PROGRESS',
    "pausedAt" TIMESTAMP(3),
    "pausedMs" INTEGER NOT NULL DEFAULT 0,
    "breachedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'LOW',
    "type" "TicketType" NOT NULL DEFAULT 'INCIDENT',
    "callerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "assignmentGroupId" TEXT,
    "problemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "domain" TEXT NOT NULL,
    "autoHeal" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("domain")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "incidentId" TEXT,
    "articleId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentNote" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'COMMENT',
    "incidentId" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "assigneeId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "imageUrl" TEXT,
    "specs" JSONB,
    "formSchema" JSONB,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "os" TEXT,
    "user" TEXT,
    "domain" TEXT NOT NULL,
    "persona" TEXT,
    "ownerId" TEXT,
    "cpuPct" DOUBLE PRECISION,
    "memUsedMb" INTEGER,
    "memTotalMb" INTEGER,
    "diskPct" DOUBLE PRECISION,
    "uptimeSec" INTEGER,
    "latencyMs" INTEGER,
    "batteryPct" INTEGER,
    "cpuCores" INTEGER,
    "lastSeenAt" TIMESTAMP(3),
    "extendedInfo" JSONB,
    "lastAlertAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMetric" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "cpuPct" DOUBLE PRECISION NOT NULL,
    "memUsedMb" INTEGER NOT NULL,
    "memTotalMb" INTEGER NOT NULL,
    "diskPct" DOUBLE PRECISION,
    "uptimeSec" INTEGER,
    "latencyMs" INTEGER,
    "batteryPct" INTEGER,
    "wifiSsid" TEXT,
    "wifiSignalDbm" INTEGER,
    "packetLossPct" DOUBLE PRECISION,
    "extendedInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemoteCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "CommandStatus" NOT NULL DEFAULT 'QUEUED',
    "result" TEXT,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RemoteCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentToken" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogRequest" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "CatalogRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "guide" TEXT NOT NULL,
    "source" TEXT,
    "downloaded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "rootCause" TEXT,
    "workaround" TEXT,
    "knownError" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "domain" TEXT NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberCounter" (
    "domain" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "last" INTEGER NOT NULL,

    CONSTRAINT "NumberCounter_pkey" PRIMARY KEY ("domain","series")
);

-- CreateTable
CREATE TABLE "ProblemNote" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'COMMENT',
    "problemId" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "summary" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "prevHash" TEXT,
    "hash" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppCrashEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "appVersion" TEXT,
    "eventType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppCrashEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareFailurePrediction" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "predictedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwareFailurePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareInstallation" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "version" TEXT,
    "domain" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoftwareInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareUsage" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "foregroundMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "domain" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "runbook" TEXT NOT NULL,
    "targetCriteria" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalTargeted" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemediationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroSurveyResponse" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BootProfile" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "totalBootSec" INTEGER NOT NULL,
    "biosSec" INTEGER,
    "osBootSec" INTEGER,
    "profileLoadSec" INTEGER,
    "gpoSec" INTEGER,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BootProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityPosture" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "bitlockerActive" BOOLEAN NOT NULL DEFAULT false,
    "avUpdated" BOOLEAN NOT NULL DEFAULT false,
    "firewallActive" BOOLEAN NOT NULL DEFAULT false,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityPosture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartContract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "action" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggersCount" INTEGER NOT NULL DEFAULT 0,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "SlaInstance_domain_stage_idx" ON "SlaInstance"("domain", "stage");

-- CreateIndex
CREATE INDEX "SlaInstance_incidentId_idx" ON "SlaInstance"("incidentId");

-- CreateIndex
CREATE INDEX "Incident_domain_assignmentGroupId_idx" ON "Incident"("domain", "assignmentGroupId");

-- CreateIndex
CREATE INDEX "Incident_domain_problemId_idx" ON "Incident"("domain", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_domain_number_key" ON "Incident"("domain", "number");

-- CreateIndex
CREATE INDEX "AssignmentGroup_domain_idx" ON "AssignmentGroup"("domain");

-- CreateIndex
CREATE INDEX "Attachment_incidentId_idx" ON "Attachment"("incidentId");

-- CreateIndex
CREATE INDEX "Attachment_articleId_idx" ON "Attachment"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceKey_key" ON "Device"("deviceKey");

-- CreateIndex
CREATE INDEX "Device_domain_idx" ON "Device"("domain");

-- CreateIndex
CREATE INDEX "Device_domain_ownerId_idx" ON "Device"("domain", "ownerId");

-- CreateIndex
CREATE INDEX "DeviceMetric_deviceId_createdAt_idx" ON "DeviceMetric"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "RemoteCommand_deviceId_status_idx" ON "RemoteCommand"("deviceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentToken_token_key" ON "EnrollmentToken"("token");

-- CreateIndex
CREATE INDEX "EnrollmentToken_domain_createdAt_idx" ON "EnrollmentToken"("domain", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_guide_createdAt_idx" ON "Lead"("guide", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Problem_domain_status_idx" ON "Problem"("domain", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_domain_number_key" ON "Problem"("domain", "number");

-- CreateIndex
CREATE INDEX "AuditLog_domain_createdAt_idx" ON "AuditLog"("domain", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_domain_entityType_entityId_idx" ON "AuditLog"("domain", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_domain_actorId_idx" ON "AuditLog"("domain", "actorId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_domain_seq_key" ON "AuditLog"("domain", "seq");

-- CreateIndex
CREATE INDEX "AppCrashEvent_domain_appName_idx" ON "AppCrashEvent"("domain", "appName");

-- CreateIndex
CREATE INDEX "AppCrashEvent_deviceId_createdAt_idx" ON "AppCrashEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "HardwareFailurePrediction_deviceId_component_idx" ON "HardwareFailurePrediction"("deviceId", "component");

-- CreateIndex
CREATE INDEX "SoftwareInstallation_domain_softwareName_idx" ON "SoftwareInstallation"("domain", "softwareName");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareInstallation_deviceId_softwareName_key" ON "SoftwareInstallation"("deviceId", "softwareName");

-- CreateIndex
CREATE INDEX "SoftwareUsage_domain_softwareName_idx" ON "SoftwareUsage"("domain", "softwareName");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareUsage_deviceId_softwareName_key" ON "SoftwareUsage"("deviceId", "softwareName");

-- CreateIndex
CREATE INDEX "RemediationCampaign_domain_status_idx" ON "RemediationCampaign"("domain", "status");

-- CreateIndex
CREATE INDEX "MicroSurveyResponse_deviceId_triggerEvent_idx" ON "MicroSurveyResponse"("deviceId", "triggerEvent");

-- CreateIndex
CREATE INDEX "MicroSurveyResponse_domain_triggerEvent_idx" ON "MicroSurveyResponse"("domain", "triggerEvent");

-- CreateIndex
CREATE INDEX "BootProfile_deviceId_createdAt_idx" ON "BootProfile"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityPosture_deviceId_createdAt_idx" ON "SecurityPosture"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "SmartContract_domain_isActive_idx" ON "SmartContract"("domain", "isActive");

-- CreateIndex
CREATE INDEX "_GroupMembers_B_index" ON "_GroupMembers"("B");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaInstance" ADD CONSTRAINT "SlaInstance_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignmentGroupId_fkey" FOREIGN KEY ("assignmentGroupId") REFERENCES "AssignmentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMetric" ADD CONSTRAINT "DeviceMetric_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemoteCommand" ADD CONSTRAINT "RemoteCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogRequest" ADD CONSTRAINT "CatalogRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogRequest" ADD CONSTRAINT "CatalogRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemNote" ADD CONSTRAINT "ProblemNote_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemNote" ADD CONSTRAINT "ProblemNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppCrashEvent" ADD CONSTRAINT "AppCrashEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareFailurePrediction" ADD CONSTRAINT "HardwareFailurePrediction_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareInstallation" ADD CONSTRAINT "SoftwareInstallation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareUsage" ADD CONSTRAINT "SoftwareUsage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroSurveyResponse" ADD CONSTRAINT "MicroSurveyResponse_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BootProfile" ADD CONSTRAINT "BootProfile_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityPosture" ADD CONSTRAINT "SecurityPosture_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMembers" ADD CONSTRAINT "_GroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "AssignmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMembers" ADD CONSTRAINT "_GroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
