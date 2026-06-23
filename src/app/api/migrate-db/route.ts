import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push("Starting manual database migration...");

    // 1. Drop old tables if they exist to avoid conflicts
    const dropSql = `
      DROP TABLE IF EXISTS "Benchmark" CASCADE;
      DROP TABLE IF EXISTS "CompensationRecord" CASCADE;
      DROP TABLE IF EXISTS "Organization" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
      DROP TABLE IF EXISTS "ErrorLog" CASCADE;
      DROP TABLE IF EXISTS "error_logs" CASCADE;
      DROP TABLE IF EXISTS "salaries" CASCADE;
      DROP TABLE IF EXISTS "companies" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TYPE IF EXISTS "UserRole" CASCADE;
      DROP TYPE IF EXISTS "RecordStatus" CASCADE;
      DROP TYPE IF EXISTS "Level" CASCADE;
    `;
    await prisma.$executeRawUnsafe(dropSql);
    steps.push("Dropped old tables and enums successfully.");

    // 2. Create enums and tables
    const createSql = `
      CREATE TYPE "UserRole" AS ENUM ('USER', 'ANALYST', 'ADMIN');
      CREATE TYPE "RecordStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED');
      CREATE TYPE "Level" AS ENUM ('L3', 'L4', 'L5', 'L6', 'SDE-I', 'SDE-II', 'SDE-III', 'Staff', 'Principal', 'IC4', 'IC5');

      CREATE TABLE "users" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "email" TEXT NOT NULL,
          "password_hash" TEXT NOT NULL,
          "role" "UserRole" NOT NULL DEFAULT 'USER',
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "companies" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "normalized_name" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "domain" TEXT,
          "industry" TEXT,
          "size_range" TEXT,
          "verified" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "salaries" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "user_id" UUID,
          "company_id" UUID NOT NULL,
          "role" TEXT NOT NULL,
          "level" "Level" NOT NULL,
          "department" TEXT NOT NULL,
          "base_salary" DECIMAL(12,2) NOT NULL,
          "bonus" DECIMAL(12,2) DEFAULT 0.00,
          "stock" DECIMAL(12,2) DEFAULT 0.00,
          "total_compensation" DECIMAL(12,2) NOT NULL,
          "currency" CHAR(3) NOT NULL DEFAULT 'USD',
          "location" TEXT NOT NULL,
          "experience_years" INTEGER NOT NULL,
          "performance_rating" TEXT,
          "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
          "hash_dedup" CHAR(64) NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "salaries_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "error_logs" (
          "id" BIGSERIAL NOT NULL,
          "reason" TEXT NOT NULL,
          "error_stack" TEXT,
          "endpoint" TEXT,
          "payload" JSONB,
          "severity" TEXT NOT NULL DEFAULT 'ERROR',
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
      CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");
      CREATE UNIQUE INDEX "companies_normalized_name_key" ON "companies"("normalized_name");
      CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");
      CREATE UNIQUE INDEX "companies_domain_key" ON "companies"("domain");
      CREATE UNIQUE INDEX "salaries_hash_dedup_key" ON "salaries"("hash_dedup");
      CREATE INDEX "salaries_company_id_level_location_idx" ON "salaries"("company_id", "level", "location");
      CREATE INDEX "salaries_total_compensation_idx" ON "salaries"("total_compensation");
      CREATE INDEX "salaries_submitted_at_idx" ON "salaries"("submitted_at");

      ALTER TABLE "salaries" ADD CONSTRAINT "salaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "salaries" ADD CONSTRAINT "salaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    await prisma.$executeRawUnsafe(createSql);
    steps.push("Created tables, enums, indexes, and constraints successfully.");

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully!",
      steps
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: "Migration failed",
      error: err.message,
      steps
    }, { status: 500 });
  }
}
