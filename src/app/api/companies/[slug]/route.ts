import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Company slug is required" }, { status: 400 });
    }

    const normalizedSlug = slug.toLowerCase().trim();

    // 1. Find the company
    const company = await prisma.company.findUnique({
      where: { slug: normalizedSlug }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // 2. Perform Server-side SQL Aggregations for Averages and Counts
    const aggregations = await prisma.salary.aggregate({
      where: {
        companyId: company.id
      },
      _avg: {
        baseSalary: true,
        bonus: true,
        stock: true,
        totalCompensation: true
      },
      _count: {
        _all: true
      }
    });

    const totalSubmissions = aggregations._count._all;

    // If there are no records for this company yet, return empty stats
    if (totalSubmissions === 0) {
      return NextResponse.json({
        success: true,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          industry: company.industry,
          headcountRange: company.headcountRange,
          foundedYear: company.foundedYear,
          headquarters: company.headquarters
        },
        stats: {
          medianTotalCompensation: 0,
          averageTotalCompensation: 0,
          averageBaseSalary: 0,
          averageVariablePay: 0,
          averageEquity: 0,
          totalSubmissions: 0
        },
        levelDistribution: []
      });
    }

    // 3. PostgreSQL Server-side Median Calculation using percentile_cont(0.5)
    const medianResult = await prisma.$queryRaw<[{ median: number | null }]>`
      SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY total_compensation)::numeric, 0)::float as median
      FROM salaries
      WHERE company_id = ${company.id}::uuid
    `;
    const medianTotalCompensation = medianResult[0]?.median || 0;

    // 4. Server-side SQL GROUP BY Aggregation for Level Distribution
    const levelDistributionQuery = await prisma.salary.groupBy({
      by: ['level'],
      where: {
        companyId: company.id
      },
      _count: {
        _all: true
      }
    });

    const levelDistribution = levelDistributionQuery.map(group => ({
      level: group.level,
      count: group._count._all
    }));

    // 5. Build and return final response
    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industry: company.industry,
        headcountRange: company.headcountRange,
        foundedYear: company.foundedYear,
        headquarters: company.headquarters
      },
      stats: {
        medianTotalCompensation,
        averageTotalCompensation: Number(aggregations._avg.totalCompensation || 0),
        averageBaseSalary: Number(aggregations._avg.baseSalary || 0),
        averageVariablePay: Number(aggregations._avg.bonus || 0),
        averageEquity: Number(aggregations._avg.stock || 0),
        totalSubmissions
      },
      levelDistribution
    });

  } catch (err: any) {
    console.error('Error fetching company details:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
