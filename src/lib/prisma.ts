// Force hot-reload
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Setup WebSocket constructor for Neon serverless driver in Node environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const prismaClientSingleton = () => {

  const connectionString = process.env.DATABASE_URL || '';
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Database operations will fail.");
  }
  
  // If it's local postgres, connect directly using standard pg Pool and @prisma/adapter-pg
  if (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
    const pg = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Otherwise, use Neon serverless driver (e.g. for Edge/Neon production)
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
