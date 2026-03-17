-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('FRED', 'TREASURY_FISCAL_DATA', 'FEDERAL_RESERVE', 'USASPENDING', 'FOREIGN_ASSISTANCE', 'BLS', 'BEA');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'DEGRADED', 'DISABLED');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('NONE', 'QUERY_API_KEY', 'HEADER_API_KEY', 'BEARER');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'IRREGULAR', 'INTRADAY');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('NUMERIC', 'TEXT', 'JSON');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('PRELIMINARY', 'FINAL', 'REVISED');

-- CreateEnum
CREATE TYPE "IngestRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'PARTIAL_FAILED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IngestRunTrigger" AS ENUM ('SCHEDULED', 'MANUAL', 'BACKFILL', 'STARTUP');

-- CreateEnum
CREATE TYPE "IngestEventLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncMode" AS ENUM ('INCREMENTAL', 'FULL');

-- CreateEnum
CREATE TYPE "FreshnessStatus" AS ENUM ('FRESH', 'STALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MetricKind" AS ENUM ('DELTA', 'ROLLING_AVERAGE', 'ANNUALIZED_CHANGE', 'Z_SCORE', 'PERCENTILE', 'VELOCITY', 'COMPOSITE_PROXY');

-- CreateEnum
CREATE TYPE "CacheScope" AS ENUM ('SOURCE', 'ENDPOINT', 'DERIVED_METRIC', 'INTERNAL');

-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('MANUAL_REFRESH', 'CACHE_INVALIDATE', 'SOURCE_HEALTH_INSPECT', 'INGEST_RUN_INSPECT', 'STALE_DATA_INSPECT', 'FRESHNESS_REFRESH', 'SYSTEM_DIAGNOSTIC');

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "status" "SourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "baseUrl" TEXT NOT NULL,
    "authType" "AuthType" NOT NULL DEFAULT 'NONE',
    "timeoutMs" INTEGER NOT NULL DEFAULT 15000,
    "rateLimitPerMinute" INTEGER,
    "updateFrequency" "Frequency",
    "expectedLatencyHours" INTEGER,
    "staleAfterHours" INTEGER,
    "tags" TEXT[],
    "metadata" JSONB,
    "lastAttemptedSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastHealthyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodologyNote" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "disclosure" TEXT,
    "limitations" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MethodologyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "methodologyNoteId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "apiPath" TEXT,
    "sourcePageUrl" TEXT NOT NULL,
    "updateFrequency" "Frequency" NOT NULL,
    "valueType" "ValueType" NOT NULL DEFAULT 'NUMERIC',
    "staleAfterHours" INTEGER,
    "expectedLatencyHours" INTEGER,
    "tags" TEXT[],
    "metadata" JSONB,
    "lastAttemptedSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "freshnessStatus" "FreshnessStatus" NOT NULL DEFAULT 'UNKNOWN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "methodologyNoteId" TEXT,
    "slug" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "category" TEXT NOT NULL,
    "valueType" "ValueType" NOT NULL DEFAULT 'NUMERIC',
    "sourcePageUrl" TEXT NOT NULL,
    "tags" TEXT[],
    "metadata" JSONB,
    "lastObservationAt" TIMESTAMP(3),
    "lastAttemptedSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "freshnessStatus" "FreshnessStatus" NOT NULL DEFAULT 'UNKNOWN',
    "staleAfterHours" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "ingestRunId" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "numericValue" DECIMAL(24,8),
    "textValue" TEXT,
    "jsonValue" JSONB,
    "valueStatus" "ObservationStatus" NOT NULL DEFAULT 'FINAL',
    "revisionOrdinal" INTEGER NOT NULL DEFAULT 1,
    "isLatestRevision" BOOLEAN NOT NULL DEFAULT true,
    "sourceObservationKey" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "sourceUrl" TEXT NOT NULL,
    "sourceUnit" TEXT,
    "sourceFrequency" "Frequency",
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "warnings" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DerivedMetricDefinition" (
    "id" TEXT NOT NULL,
    "methodologyNoteId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kind" "MetricKind" NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "formula" TEXT NOT NULL,
    "dependencies" JSONB NOT NULL,
    "isProxy" BOOLEAN NOT NULL DEFAULT false,
    "displayWarning" TEXT,
    "lowerBound" DECIMAL(24,8),
    "upperBound" DECIMAL(24,8),
    "tags" TEXT[],
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DerivedMetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DerivedMetricSnapshot" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "sourceRunId" TEXT,
    "asOf" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(24,8),
    "payload" JSONB,
    "freshnessStatus" "FreshnessStatus" NOT NULL DEFAULT 'UNKNOWN',
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "methodologyVersion" INTEGER NOT NULL DEFAULT 1,
    "sourceTimestamps" JSONB,
    "warnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DerivedMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "datasetId" TEXT,
    "trigger" "IngestRunTrigger" NOT NULL,
    "syncMode" "SyncMode" NOT NULL DEFAULT 'INCREMENTAL',
    "status" "IngestRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requestedBy" TEXT,
    "requestId" TEXT,
    "correlationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "itemsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "warningsCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRunEvent" (
    "id" TEXT NOT NULL,
    "ingestRunId" TEXT NOT NULL,
    "level" "IngestEventLevel" NOT NULL,
    "code" TEXT,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestRunEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "freshnessStatus" "FreshnessStatus" NOT NULL DEFAULT 'UNKNOWN',
    "freshnessLagSeconds" INTEGER,
    "successRate24h" DECIMAL(5,2),
    "partialFailureRate24h" DECIMAL(5,2),
    "averageLatencyMs24h" INTEGER,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "latestObservedDataPointAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheEntry" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "scope" "CacheScope" NOT NULL,
    "tags" TEXT[],
    "value" JSONB,
    "checksum" TEXT,
    "ttlSeconds" INTEGER NOT NULL,
    "staleAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CacheEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "requestId" TEXT,
    "route" TEXT,
    "sourceIpHash" TEXT,
    "userAgent" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_slug_key" ON "DataSource"("slug");

-- CreateIndex
CREATE INDEX "DataSource_kind_status_idx" ON "DataSource"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MethodologyNote_slug_key" ON "MethodologyNote"("slug");

-- CreateIndex
CREATE INDEX "Dataset_category_isActive_idx" ON "Dataset"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_dataSourceId_slug_key" ON "Dataset"("dataSourceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE INDEX "Series_category_frequency_idx" ON "Series"("category", "frequency");

-- CreateIndex
CREATE UNIQUE INDEX "Series_datasetId_sourceCode_key" ON "Series"("datasetId", "sourceCode");

-- CreateIndex
CREATE INDEX "Observation_seriesId_observedAt_isLatestRevision_idx" ON "Observation"("seriesId", "observedAt" DESC, "isLatestRevision");

-- CreateIndex
CREATE INDEX "Observation_sourceObservationKey_idx" ON "Observation"("sourceObservationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_seriesId_observedAt_revisionOrdinal_key" ON "Observation"("seriesId", "observedAt", "revisionOrdinal");

-- CreateIndex
CREATE UNIQUE INDEX "DerivedMetricDefinition_slug_key" ON "DerivedMetricDefinition"("slug");

-- CreateIndex
CREATE INDEX "DerivedMetricSnapshot_asOf_freshnessStatus_idx" ON "DerivedMetricSnapshot"("asOf" DESC, "freshnessStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DerivedMetricSnapshot_definitionId_asOf_key" ON "DerivedMetricSnapshot"("definitionId", "asOf");

-- CreateIndex
CREATE INDEX "IngestRun_dataSourceId_startedAt_idx" ON "IngestRun"("dataSourceId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "IngestRun_status_startedAt_idx" ON "IngestRun"("status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "IngestRunEvent_ingestRunId_createdAt_idx" ON "IngestRunEvent"("ingestRunId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "SourceHealth_score_freshnessStatus_idx" ON "SourceHealth"("score", "freshnessStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SourceHealth_dataSourceId_scopeKey_key" ON "SourceHealth"("dataSourceId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "CacheEntry_cacheKey_key" ON "CacheEntry"("cacheKey");

-- CreateIndex
CREATE INDEX "CacheEntry_scope_staleAt_idx" ON "CacheEntry"("scope", "staleAt");

-- CreateIndex
CREATE INDEX "CacheEntry_expiresAt_idx" ON "CacheEntry"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_methodologyNoteId_fkey" FOREIGN KEY ("methodologyNoteId") REFERENCES "MethodologyNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_methodologyNoteId_fkey" FOREIGN KEY ("methodologyNoteId") REFERENCES "MethodologyNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_ingestRunId_fkey" FOREIGN KEY ("ingestRunId") REFERENCES "IngestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivedMetricDefinition" ADD CONSTRAINT "DerivedMetricDefinition_methodologyNoteId_fkey" FOREIGN KEY ("methodologyNoteId") REFERENCES "MethodologyNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivedMetricSnapshot" ADD CONSTRAINT "DerivedMetricSnapshot_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "DerivedMetricDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivedMetricSnapshot" ADD CONSTRAINT "DerivedMetricSnapshot_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "IngestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRun" ADD CONSTRAINT "IngestRun_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRun" ADD CONSTRAINT "IngestRun_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRunEvent" ADD CONSTRAINT "IngestRunEvent_ingestRunId_fkey" FOREIGN KEY ("ingestRunId") REFERENCES "IngestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceHealth" ADD CONSTRAINT "SourceHealth_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
