import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id1 = searchParams.get('id1');
    const id2 = searchParams.get('id2');

    // 1. Error Handling: Return 404 if either ID is missing in the query
    if (!id1 || !id2) {
      return NextResponse.json({ error: "Both id1 and id2 parameters are required" }, { status: 404 });
    }

    // 2. Error Handling: Return 400 if IDs are identical
    if (id1 === id2) {
      return NextResponse.json({ error: "Cannot compare a record to itself. IDs must be different." }, { status: 400 });
    }

    // Validate UUID format before querying the database
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id1) || !uuidRegex.test(id2)) {
      return NextResponse.json({ error: "Invalid UUID format" }, { status: 400 });
    }

    // 3. Fetch both records in parallel
    const [record1, record2] = await Promise.all([
      prisma.salary.findUnique({
        where: { id: id1 },
        include: { company: true }
      }),
      prisma.salary.findUnique({
        where: { id: id2 },
        include: { company: true }
      })
    ]);

    // 4. Error Handling: Return 404 if either ID is not found in database
    if (!record1 || !record2) {
      return NextResponse.json({ error: "One or both of the compensation records could not be found." }, { status: 404 });
    }

    // 5. Compute Deltas (Record 2 minus Record 1)
    const base1 = Number(record1.baseSalary);
    const base2 = Number(record2.baseSalary);
    const var1 = Number(record1.bonus || 0);
    const var2 = Number(record2.bonus || 0);
    const eq1 = Number(record1.stock || 0);
    const eq2 = Number(record2.stock || 0);
    const tc1 = Number(record1.totalCompensation);
    const tc2 = Number(record2.totalCompensation);
    const exp1 = record1.experienceYears;
    const exp2 = record2.experienceYears;

    const deltas = {
      base_delta: base2 - base1,
      variable_delta: var2 - var1,
      equity_delta: eq2 - eq1,
      tc_delta: tc2 - tc1,
      experience_delta: exp2 - exp1
    };

    // 6. Format and return response
    return NextResponse.json({
      success: true,
      records: {
        record1: {
          id: record1.id,
          company: record1.company.name,
          jobTitle: record1.role,
          level: record1.level,
          location: record1.location,
          baseSalary: base1,
          variablePay: var1,
          equity: eq1,
          totalCompensation: tc1,
          yearsOfExperience: exp1,
          currency: record1.currency,
          submittedAt: record1.submittedAt
        },
        record2: {
          id: record2.id,
          company: record2.company.name,
          jobTitle: record2.role,
          level: record2.level,
          location: record2.location,
          baseSalary: base2,
          variablePay: var2,
          equity: eq2,
          totalCompensation: tc2,
          yearsOfExperience: exp2,
          currency: record2.currency,
          submittedAt: record2.submittedAt
        }
      },
      comparison: deltas
    });

  } catch (err: any) {
    console.error('Error comparing records:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
