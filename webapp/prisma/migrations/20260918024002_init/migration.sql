-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'HEAD_BUDGET', 'VERIFIKATOR_BUDGET', 'ADMIN_BUDGET', 'DIV_PAJAK', 'PENGAJU', 'HEAD_DEPARTEMEN', 'CEO_PROJECT', 'CFO', 'CEO1');

-- CreateEnum
CREATE TYPE "Panel" AS ENUM ('BUDGET', 'PENGAJU', 'APPROVER');

-- CreateEnum
CREATE TYPE "PkpStatus" AS ENUM ('PKP', 'NON_PKP');

-- CreateEnum
CREATE TYPE "FormKind" AS ENUM ('PNJ', 'BAYAR', 'BIAYA', 'PTG', 'DPH', 'PO', 'FIN');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('DOC01', 'DOC02', 'DOC03', 'DOC04', 'DOC05');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'DEPT_APPROVAL', 'GATE1_KELENGKAPAN', 'RETURNED', 'GATE2_PARALLEL', 'GATE3_BUDGET_REVIEW', 'TREASURY_CHECK', 'GATE4_CEO_PROJECT', 'GATE5_CFO', 'GATE6_CEO1', 'APPROVED', 'REJECTED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "TagLevel" AS ENUM ('PASS', 'WARN', 'FAIL', 'INFO', 'NA');

-- CreateEnum
CREATE TYPE "GateVerdict" AS ENUM ('CLEAR', 'CLEAR_WITH_NOTES', 'RETURNED', 'REJECTED', 'APPROVED', 'PENDING');

-- CreateEnum
CREATE TYPE "Lane" AS ENUM ('TAX', 'LEGAL', 'HRD_GA', 'ACCOUNTING');

-- CreateEnum
CREATE TYPE "LaneStatus" AS ENUM ('TERVERIFIKASI', 'PERLU_REVISI', 'MENUNGGU', 'TIDAK_DIPERLUKAN');

-- CreateEnum
CREATE TYPE "ContractKind" AS ENUM ('KONTRAK', 'LOA', 'ADENDUM', 'PO');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('AKTIF', 'SELESAI', 'DIPUTUS', 'KEDALUWARSA');

-- CreateEnum
CREATE TYPE "PaymentScheduleStatus" AS ENUM ('PAID', 'OPEN', 'PLAN');

-- CreateEnum
CREATE TYPE "GuaranteeKind" AS ENUM ('UANG_MUKA', 'PELAKSANAAN', 'PEMELIHARAAN');

-- CreateEnum
CREATE TYPE "ParamUnit" AS ENUM ('RP', 'PCT', 'WD', 'CD', 'MIN', 'CYCLE', 'TEXT');

-- CreateEnum
CREATE TYPE "ParamGroup" AS ENUM ('TINGKAT_KEWENANGAN', 'TARIF_PAJAK', 'AMBANG_KONTRAK', 'AMBANG_DEVIASI', 'SLA_MASA_BERLAKU');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParamHistoryKind" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'PERUBAHAN_LANGSUNG', 'DIKEMBALIKAN');

-- CreateEnum
CREATE TYPE "NotifCategory" AS ENUM ('SLA', 'STATUS', 'UMUR', 'TAUTAN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "departmentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleNote" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentSequence" INTEGER NOT NULL DEFAULT 100000,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "allocNo" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "costCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pagu" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationMoveLog" (
    "id" TEXT NOT NULL,
    "fromAllocId" TEXT NOT NULL,
    "toAllocId" TEXT NOT NULL,
    "submissionId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "byId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllocationMoveLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "npwp" TEXT,
    "pkpStatus" "PkpStatus" NOT NULL DEFAULT 'NON_PKP',
    "bank" TEXT,
    "rekening" TEXT,
    "alamat" TEXT,
    "tipeSupplier" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "indexNo" TEXT NOT NULL,
    "kind" "FormKind" NOT NULL,
    "docType" "DocType" NOT NULL,
    "subject" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "costCode" TEXT NOT NULL,
    "allocationId" TEXT,
    "value" DECIMAL(18,2) NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentGate" INTEGER NOT NULL DEFAULT 1,
    "routeGate" INTEGER NOT NULL DEFAULT 4,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "returnCycles" INTEGER NOT NULL DEFAULT 0,
    "tagLevel" "TagLevel" NOT NULL DEFAULT 'INFO',
    "vendorId" TEXT,
    "taxTxTypeCode" TEXT,
    "taxProposedRate" DECIMAL(6,3),
    "taxVerifiedAt" TIMESTAMP(3),
    "taxVerifiedById" TEXT,
    "formData" JSONB NOT NULL DEFAULT '{}',
    "documentChecklist" JSONB NOT NULL DEFAULT '[]',
    "memo" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractId" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateDecision" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "gate" INTEGER NOT NULL,
    "verdict" "GateVerdict" NOT NULL,
    "comment" TEXT,
    "ruleResults" JSONB NOT NULL DEFAULT '[]',
    "actorId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaneClearance" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "lane" "Lane" NOT NULL,
    "status" "LaneStatus" NOT NULL DEFAULT 'MENUNGGU',
    "note" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaneClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureColumn" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "gate" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "jabatan" TEXT,
    "name" TEXT,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isManual" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SignatureColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailApprovalLink" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "gate" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "decision" "GateVerdict",
    "decidedById" TEXT,

    CONSTRAINT "EmailApprovalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "instrumentNo" TEXT NOT NULL,
    "kind" "ContractKind" NOT NULL,
    "vendorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "costCode" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dpPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "retensiPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "ContractStatus" NOT NULL DEFAULT 'AKTIF',
    "tagLevel" "TagLevel" NOT NULL DEFAULT 'INFO',
    "parentContractId" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "PaymentScheduleStatus" NOT NULL DEFAULT 'PLAN',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "contractId" TEXT,
    "gross" DECIMAL(18,2) NOT NULL,
    "recoupDp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retensi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "denda" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pph" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ppn" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netto" DECIMAL(18,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guarantee" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "kind" "GuaranteeKind" NOT NULL,
    "number" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "TagLevel" NOT NULL DEFAULT 'INFO',

    CONSTRAINT "Guarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParameterDefinition" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "group" "ParamGroup" NOT NULL,
    "unit" "ParamUnit" NOT NULL,
    "min" DECIMAL(18,4),
    "max" DECIMAL(18,4),
    "ascendingGroup" TEXT,
    "ownerRole" "Role" NOT NULL,
    "ruleId" TEXT,
    "sampleValue" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ParameterDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParameterValue" (
    "parameterId" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParameterValue_pkey" PRIMARY KEY ("parameterId")
);

-- CreateTable
CREATE TABLE "ParameterProposal" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "proposedValue" TEXT NOT NULL,
    "proposedEffectiveDate" TIMESTAMP(3) NOT NULL,
    "approverRole" "Role" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "proposedById" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedEffectiveDate" TIMESTAMP(3),
    "decisionReason" TEXT,

    CONSTRAINT "ParameterProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParameterHistory" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "kind" "ParamHistoryKind" NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "byId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "reason" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParameterHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "category" "NotifCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "submissionId" TEXT,
    "tagLevel" "TagLevel" NOT NULL DEFAULT 'INFO',
    "toUserId" TEXT,
    "toRole" "Role",
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_companyId_name_key" ON "Project"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_allocNo_key" ON "BudgetAllocation"("allocNo");

-- CreateIndex
CREATE INDEX "BudgetAllocation_companyId_projectId_idx" ON "BudgetAllocation"("companyId", "projectId");

-- CreateIndex
CREATE INDEX "BudgetAllocation_costCode_idx" ON "BudgetAllocation"("costCode");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_indexNo_key" ON "Submission"("indexNo");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_companyId_projectId_idx" ON "Submission"("companyId", "projectId");

-- CreateIndex
CREATE INDEX "Submission_createdById_idx" ON "Submission"("createdById");

-- CreateIndex
CREATE INDEX "GateDecision_submissionId_idx" ON "GateDecision"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "LaneClearance_submissionId_lane_key" ON "LaneClearance"("submissionId", "lane");

-- CreateIndex
CREATE INDEX "SignatureColumn_submissionId_idx" ON "SignatureColumn"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailApprovalLink_token_key" ON "EmailApprovalLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_instrumentNo_key" ON "Contract"("instrumentNo");

-- CreateIndex
CREATE INDEX "Contract_companyId_projectId_idx" ON "Contract"("companyId", "projectId");

-- CreateIndex
CREATE INDEX "Guarantee_expiresAt_idx" ON "Guarantee"("expiresAt");

-- CreateIndex
CREATE INDEX "ParameterProposal_parameterId_status_idx" ON "ParameterProposal"("parameterId", "status");

-- CreateIndex
CREATE INDEX "ParameterHistory_parameterId_idx" ON "ParameterHistory"("parameterId");

-- CreateIndex
CREATE INDEX "Notification_toUserId_readAt_idx" ON "Notification"("toUserId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_toRole_readAt_idx" ON "Notification"("toRole", "readAt");

-- CreateIndex
CREATE INDEX "ActivityLog_at_idx" ON "ActivityLog"("at");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationMoveLog" ADD CONSTRAINT "AllocationMoveLog_fromAllocId_fkey" FOREIGN KEY ("fromAllocId") REFERENCES "BudgetAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationMoveLog" ADD CONSTRAINT "AllocationMoveLog_toAllocId_fkey" FOREIGN KEY ("toAllocId") REFERENCES "BudgetAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationMoveLog" ADD CONSTRAINT "AllocationMoveLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationMoveLog" ADD CONSTRAINT "AllocationMoveLog_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "BudgetAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateDecision" ADD CONSTRAINT "GateDecision_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateDecision" ADD CONSTRAINT "GateDecision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaneClearance" ADD CONSTRAINT "LaneClearance_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaneClearance" ADD CONSTRAINT "LaneClearance_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureColumn" ADD CONSTRAINT "SignatureColumn_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailApprovalLink" ADD CONSTRAINT "EmailApprovalLink_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailApprovalLink" ADD CONSTRAINT "EmailApprovalLink_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantee" ADD CONSTRAINT "Guarantee_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterValue" ADD CONSTRAINT "ParameterValue_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "ParameterDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterProposal" ADD CONSTRAINT "ParameterProposal_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "ParameterDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterProposal" ADD CONSTRAINT "ParameterProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterProposal" ADD CONSTRAINT "ParameterProposal_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterHistory" ADD CONSTRAINT "ParameterHistory_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "ParameterDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterHistory" ADD CONSTRAINT "ParameterHistory_byId_fkey" FOREIGN KEY ("byId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
