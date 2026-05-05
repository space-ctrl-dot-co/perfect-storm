# fix-and-push.ps1
# Creates a fresh single-commit history, bypassing the bad commit entirely.
Set-Location $PSScriptRoot

Write-Host "[1] Creating orphan branch..." -ForegroundColor Cyan
git checkout --orphan fresh-master

Write-Host "[2] Staging all files..." -ForegroundColor Cyan
git add -A

Write-Host "[3] Committing clean snapshot..." -ForegroundColor Cyan
git commit -m "Perfect Storm: Russell 1000 analyzer, 700 tickers, full S&P 500 coverage"

Write-Host "[4] Replacing master..." -ForegroundColor Cyan
git branch -D master
git branch -m master

Write-Host "[5] Force pushing..." -ForegroundColor Cyan
git push origin master --force

Write-Host "Done." -ForegroundColor Green
git log --oneline -3
