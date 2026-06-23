import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const log: string[] = [];
  const projectDir = path.resolve(process.cwd());

  const runCmd = (cmd: string) => {
    try {
      log.push(`Executing: ${cmd}`);
      const output = execSync(cmd, { cwd: projectDir, encoding: 'utf-8', stdio: 'pipe' });
      log.push(`Success output:\n${output || '(no output)'}`);
      return true;
    } catch (err: any) {
      log.push(`Error running [${cmd}]:\n${err.stderr || err.stdout || err.message}`);
      return false;
    }
  };

  try {
    log.push(`Starting local build test in: ${projectDir}`);

    // First generate Prisma Client
    const prismaGen = runCmd('npx prisma generate');
    if (!prismaGen) {
      return NextResponse.json({ success: false, reason: 'Prisma generation failed', log }, { status: 500 });
    }

    // Run Next.js build
    log.push('Running next build...');
    const nextBuild = runCmd('npx next build');

    // Clean up this route file after execution so we don't commit it
    const buildRoutePath = path.join(projectDir, 'src', 'app', 'api', 'build-test', 'route.ts');
    const buildRouteDir = path.join(projectDir, 'src', 'app', 'api', 'build-test');
    if (fs.existsSync(buildRoutePath)) {
      fs.unlinkSync(buildRoutePath);
    }
    if (fs.existsSync(buildRouteDir)) {
      fs.rmdirSync(buildRouteDir);
    }

    if (nextBuild) {
      return NextResponse.json({ success: true, log });
    } else {
      return NextResponse.json({ success: false, reason: 'Next.js build failed', log }, { status: 500 });
    }
  } catch (globalErr: any) {
    log.push(`Unexpected error: ${globalErr.message}`);
    return NextResponse.json({ success: false, error: globalErr.message, log }, { status: 500 });
  }
}
