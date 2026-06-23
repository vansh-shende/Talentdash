import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  try {
    // Run a fast, lightweight query to check connection health
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latencyMs: latency,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const dbUrl = process.env.DATABASE_URL || '';
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
      dbUrlLength: dbUrl.length,
      dbUrlStart: dbUrl ? dbUrl.substring(0, 15) : 'none',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
