import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const VALID_LEVELS = [
  'L3', 'L4', 'L5', 'L6', 
  'SDE-I', 'SDE-II', 'SDE-III', 
  'Staff', 'Principal', 
  'IC4', 'IC5'
] as const;

const LEVEL_MAP: Record<string, any> = {
  'L3': 'L3',
  'L4': 'L4',
  'L5': 'L5',
  'L6': 'L6',
  'SDE-I': 'SDE_I',
  'SDE-II': 'SDE_II',
  'SDE-III': 'SDE_III',
  'Staff': 'Staff',
  'Principal': 'Principal',
  'IC4': 'IC4',
  'IC5': 'IC5'
};

const IngestSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  level: z.enum(VALID_LEVELS, {
    invalid_type_error: "Level must be one of the allowed values: L3 | L4 | L5 | L6 | SDE-I | SDE-II | SDE-III | Staff | Principal | IC4 | IC5"
  }),
  location: z.string().min(1, "Location is required"),
  yearsOfExperience: z.coerce.number().int().min(0, "Experience cannot be negative").max(50, "Experience cannot be greater than 50 years"),
  baseSalary: z.coerce.number().positive("Base salary must be greater than 0"),
  variablePay: z.coerce.number().min(0).optional().default(0),
  equity: z.coerce.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default("USD"),
  department: z.string().optional().default("Engineering"),
  performanceRating: z.string().optional()
});

// Normalize company name (lowercase + trimmed + stripped of domain suffixes & legal suffixes)
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  let normalized = name.toLowerCase().trim();
  
  // Remove domain extensions like .com, .org, .co.in, etc.
  const domainRegex = /\.(com|org|net|co|io|in|us|uk|tech|ai|dev|app)(\.[a-z]{2,3})?$/gi;
  normalized = normalized.replace(domainRegex, '');

  // Remove legal suffixes
  const suffixRegex = /\b(inc|pvt\s+ltd|ltd|llc|co|corp|gmbh|sa|srl|pvt|pty\s+ltd|corporation|incorporated|limited)\.?$/gi;
  normalized = normalized.replace(suffixRegex, '');
  
  // Clean up trailing spaces/symbols
  normalized = normalized.replace(/[\s,.]+$/, '');
  
  return normalized.trim();
}

async function logErrorToDb(message: string, stack?: string, payload?: any) {
  try {
    await prisma.errorLog.create({
      data: {
        errorMessage: message,
        errorStack: stack || null,
        endpoint: '/api/ingest-salary',
        payloadSnapshot: payload ? JSON.parse(JSON.stringify(payload)) : null,
        severity: 'ERROR'
      }
    });
  } catch (err: any) {
    console.error('Failed to log error to database:', err.message);
  }
}

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    try {
      body = await req.json();
    } catch (err: any) {
      console.error("JSON parse error:", err.message);
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    // 1. Zod Validation
    const validation = IngestSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("Validation error:", errorMsg);
      try {
        await logErrorToDb(`Validation failed: ${errorMsg}`, JSON.stringify(validation.error.format()), body);
      } catch (logErr: any) {
        console.error("Failed to log error to DB:", logErr.message);
      }
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      companyName,
      jobTitle,
      level,
      location,
      yearsOfExperience,
      baseSalary,
      variablePay,
      equity,
      currency,
      department,
      performanceRating
    } = validation.data;

    // 2. Company Normalization and lookup
    const normalizedName = normalizeCompanyName(companyName);
    let company = await prisma.company.findUnique({
      where: { normalizedName }
    });

    if (!company) {
      company = await prisma.company.create({
        data: { 
          name: companyName, // raw display name
          normalizedName,    // normalized name (e.g. google)
          slug: normalizedName // slug (e.g. google)
        }
      });
    }

    // Map level string to database enum level
    const dbLevel = LEVEL_MAP[level];

    // 3. Deduplication Check (last 48 hours, same company + title + level + location, base salary within 10%)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const minBase = baseSalary * 0.9;
    const maxBase = baseSalary * 1.1;

    const duplicate = await prisma.compensationRecord.findFirst({
      where: {
        companyId: company.id,
        level: dbLevel,
        jobTitle: { equals: jobTitle, mode: 'insensitive' },
        location: { equals: location, mode: 'insensitive' },
        submittedAt: { gte: fortyEightHoursAgo },
        baseSalary: {
          gte: minBase,
          lte: maxBase
        }
      }
    });

    if (duplicate) {
      const conflictMsg = "Duplicate submission detected: a similar record was submitted in the last 48 hours.";
      console.error("Duplicate detected:", duplicate.id);
      try {
        await logErrorToDb(conflictMsg, `Duplicate record ID: ${duplicate.id}`, body);
      } catch (_) {}
      return NextResponse.json({ error: conflictMsg }, { status: 409 });
    }

    // 4. Server-side Total Compensation Recomputation
    const computedTotalComp = baseSalary + (variablePay ?? 0) + (equity ?? 0);

    // 5. Generate secure unique hash for database constraint
    const dedupString = `${company.id}-${jobTitle.toLowerCase()}-${dbLevel}-${location.toLowerCase()}-${baseSalary}-${Date.now()}-${Math.random()}`;
    const hashDedup = crypto.createHash('sha256').update(dedupString).digest('hex');

    // 6. Insert record into database
    const record = await prisma.compensationRecord.create({
      data: {
        jobTitle,
        level: dbLevel,
        department,
        baseSalary,
        variablePay,
        equity,
        totalCompensation: computedTotalComp,
        currency,
        location,
        yearsOfExperience,
        performanceRating: performanceRating || null,
        hashDedup,
        status: 'APPROVED',
        companyId: company.id,
        submittedAt: new Date()
      },
      include: {
        company: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        company: record.company.name,
        jobTitle: record.jobTitle,
        level: record.level,
        location: record.location,
        baseSalary: Number(record.baseSalary),
        variablePay: Number(record.variablePay),
        equity: Number(record.equity),
        totalCompensation: Number(record.totalCompensation),
        submittedAt: record.submittedAt
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error("Ingestion route handler uncaught exception:", err.message, err.stack);
    try {
      await logErrorToDb(`Internal server error during ingestion: ${err.message}`, err.stack, body);
    } catch (_) {}
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
