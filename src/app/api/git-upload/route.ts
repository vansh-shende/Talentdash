import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

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
      log.push(`Error running [${cmd}]: ${err.stderr || err.message}`);
      return false;
    }
  };

  try {
    log.push(`Working directory: ${projectDir}`);

    // Remove old origin just in case
    runCmd('git remote remove origin');

    // Add new origin
    const originAdded = runCmd('git remote add origin https://github.com/vansh-shende/Talentdash.git');
    if (!originAdded) {
      return NextResponse.json({ success: false, reason: 'Failed to add remote origin', log }, { status: 500 });
    }

    // Rename branch to main
    runCmd('git branch -M main');

    // Stage changes
    runCmd('git add .');

    // Commit changes
    runCmd('git commit -m "Upload Talentdash project with proper README"');

    // Push to remote repository
    log.push('Attempting push to origin main (this might take a few seconds)...');
    const pushSuccess = runCmd('git push -u origin main');

    if (pushSuccess) {
      log.push('Git upload completed successfully!');
      return NextResponse.json({ success: true, log });
    } else {
      log.push('Push failed. Let us try pushing to master branch as fallback...');
      const fallbackSuccess = runCmd('git push -u origin master');
      if (fallbackSuccess) {
        log.push('Fallback push to master succeeded!');
        return NextResponse.json({ success: true, log });
      } else {
        log.push('Both main and master push attempts failed.');
        return NextResponse.json({ success: false, reason: 'Push failed', log }, { status: 500 });
      }
    }
  } catch (globalErr: any) {
    log.push(`Unexpected error: ${globalErr.message}`);
    return NextResponse.json({ success: false, error: globalErr.message, log }, { status: 500 });
  }
}
