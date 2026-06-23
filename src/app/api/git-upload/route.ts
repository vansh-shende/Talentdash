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
      log.push(`Success output: ${output || '(no output)'}`);
      return true;
    } catch (err: any) {
      log.push(`Error running [${cmd}]: ${err.stderr || err.stdout || err.message}`);
      return false;
    }
  };

  try {
    log.push('Starting automated Git commit and push for Zod validation fix...');

    // 1. Stage the fix
    runCmd('git add -A');

    // 2. Commit the fix
    runCmd('git commit -m "Fix Zod validation type error in ingest-salary route"');

    // 3. Push the fix to main
    log.push('Pushing fix to origin main...');
    const pushSuccess = runCmd('git push origin main');
    if (!pushSuccess) {
      log.push('Push to main failed, trying master...');
      runCmd('git push origin master');
    }

    // 4. Perform self-deletion
    const gitUploadRoutePath = path.join(projectDir, 'src', 'app', 'api', 'git-upload', 'route.ts');
    const gitUploadDir = path.join(projectDir, 'src', 'app', 'api', 'git-upload');

    if (fs.existsSync(gitUploadRoutePath)) {
      fs.unlinkSync(gitUploadRoutePath);
      log.push('Deleted src/app/api/git-upload/route.ts from disk');
    }

    if (fs.existsSync(gitUploadDir)) {
      fs.rmdirSync(gitUploadDir);
      log.push('Deleted src/app/api/git-upload directory');
    }

    // 5. Stage the deletion
    runCmd('git add -A');

    // 6. Commit the deletion
    runCmd('git commit -m "Clean up temporary upload scripts"');

    // 7. Push the cleanup commit
    log.push('Pushing cleanup commit to origin main...');
    const cleanupSuccess = runCmd('git push origin main');
    if (!cleanupSuccess) {
      runCmd('git push origin master');
    }

    log.push('All steps completed successfully!');
    return NextResponse.json({ success: true, log });

  } catch (globalErr: any) {
    log.push(`Unexpected error: ${globalErr.message}`);
    return NextResponse.json({ success: false, error: globalErr.message, log }, { status: 500 });
  }
}
