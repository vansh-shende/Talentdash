// Force hot-reload
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import fs from 'fs';
import path from 'path';

// Setup WebSocket constructor for Neon serverless driver in Node environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('#') || !line.trim()) continue;
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load .env file manually:', err);
  }
}

const prismaClientSingleton = () => {
  loadEnv();

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
  const adapter = new PrismaNeon(pool);
  
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
