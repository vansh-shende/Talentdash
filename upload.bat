@echo off
echo ===================================================
echo   TalentDash GitHub Uploader
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo Please install Git and try again.
    pause
    exit /b
)

:: Set remote origin
echo Configuring remote repository...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/vansh-shende/Talentdash.git
if %errorlevel% neq 0 (
    echo [ERROR] Failed to set remote origin.
    pause
    exit /b
)

:: Rename branch to main
echo Setting branch name to main...
git branch -M main

:: Stage all files
echo Staging files...
git add .

:: Commit
echo Committing changes...
git commit -m "Upload Talentdash project with proper README"

:: Push to GitHub
echo.
echo Pushing to GitHub (https://github.com/vansh-shende/Talentdash.git)...
echo Note: If prompted, please authenticate with your GitHub credentials.
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Project successfully uploaded to GitHub!
    echo ===================================================
) else (
    echo.
    echo [WARNING] Push failed. If the repository is empty, make sure you have write permissions.
    echo You can try pushing to master branch if needed:
    echo git push -u origin master
)

echo.
pause
