import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Mandatory Pagination (default 25, max 100)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 2. Extract filters
    const query = searchParams.get('query');
    const company = searchParams.get('company');
    const role = searchParams.get('role');
    const location = searchParams.get('location');
    const level = searchParams.get('level');

    // 3. Build Prisma Query filters
    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        {
          company: {
            name: {
              contains: query.trim(),
              mode: 'insensitive'
            }
          }
        },
        {
          role: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }

    if (company) {
      whereClause.company = {
        name: {
          contains: company.trim(),
          mode: 'insensitive'
        }
      };
    }

    if (role) {
      whereClause.role = {
        contains: role.trim(),
        mode: 'insensitive'
      };
    }

    if (location) {
      whereClause.location = {
        contains: location.trim(),
        mode: 'insensitive'
      };
    }

    if (level) {
      whereClause.level = level;
    }

    // 4. Sorting Parameters
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const validSortFields = ['submittedAt', 'totalCompensation', 'baseSalary', 'experienceYears'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

    // 5. Query DB
    const [totalCount, records] = await prisma.$transaction([
      prisma.salary.count({ where: whereClause }),
      prisma.salary.findMany({
        where: whereClause,
        include: {
          company: true
        },
        orderBy: {
          [orderByField]: sortOrder
        },
        skip,
        take: limit
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // 6. Format and return response
    const formattedRecords = records.map(record => ({
      id: record.id,
      company: record.company.name,
      companyId: record.company.id,
      jobTitle: record.role,
      level: record.level,
      baseSalary: Number(record.baseSalary),
      variablePay: Number(record.bonus),
      equity: Number(record.stock),
      totalCompensation: Number(record.totalCompensation),
      currency: record.currency,
      location: record.location,
      yearsOfExperience: record.experienceYears,
      submittedAt: record.submittedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      pagination: {
        totalCount,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (err: any) {
    console.error('Error fetching salaries:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
