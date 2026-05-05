# Perfect Storm Git Push Automation Setup
# Run this script once to add the git-push function to your PowerShell profile

# Credentials — Pre-filled for Perfect Storm
$GITHUB_USERNAME = "space-ctrl-dot-co"
$GITHUB_PAT = "your_personal_access_token"   # Replace with your PAT — do NOT commit the actual token

# Validate inputs
if ($GITHUB_USERNAME -eq "your_github_username" -or $GITHUB_PAT -eq "your_personal_access_token") {
    Write-Host "[X] ERROR: You must edit this script and fill in your GitHub username and PAT" -ForegroundColor Red
    Write-Host "   Edit setup-git-push.ps1 and replace:" -ForegroundColor Yellow
    Write-Host "   - GITHUB_USERNAME = 'your_github_username'" -ForegroundColor Yellow
    Write-Host "   - GITHUB_PAT = 'your_personal_access_token'" -ForegroundColor Yellow
    exit 1
}

# Get PowerShell profile path
$profilePath = $PROFILE
$profileDir = Split-Path $profilePath

# Create profile directory if it doesn't exist
if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "[+] Created PowerShell profile directory" -ForegroundColor Green
}

# Read existing profile (if any)
$existingContent = ""
if (Test-Path $profilePath) {
    $existingContent = Get-Content $profilePath -Raw
}

# Create the git-push function
$gitPushFunction = @"

# Perfect Storm auto-push with PAT authentication
function git-push {
    `$repoName = git config --get remote.origin.url -ErrorAction Ignore

    # Only auto-auth for Perfect Storm repo
    if (`$repoName -like "*perfect-storm*") {
        `$USERNAME = "$GITHUB_USERNAME"
        `$PAT = "$GITHUB_PAT"
        Remove-Item .\`.git\index.lock -Force -ErrorAction Ignore
        Remove-Item .\`.git\HEAD.lock -Force -ErrorAction Ignore
        git remote set-url origin "https://`${USERNAME}:`${PAT}@github.com/space-ctrl-dot-co/perfect-storm.git"
        git push
        git remote set-url origin "https://github.com/space-ctrl-dot-co/perfect-storm.git"
    } else {
        # For other projects, use normal git push
        git push
    }
}
"@

# Check if function already exists in profile
if ($existingContent.Contains("function git-push")) {
    Write-Host "[!] git-push function already exists in profile. Updating..." -ForegroundColor Yellow
    # Remove old function
    $existingContent = $existingContent -replace "# Perfect Storm auto-push.*?^}", "", [System.Text.RegularExpressions.RegexOptions]::Multiline
}

# Add function to profile
$newContent = $existingContent + $gitPushFunction

# Write profile
Set-Content -Path $profilePath -Value $newContent -Encoding UTF8

Write-Host ""
Write-Host "[+] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To activate the git-push function:" -ForegroundColor Cyan
Write-Host "  1. Close PowerShell" -ForegroundColor Cyan
Write-Host "  2. Open a new PowerShell window" -ForegroundColor Cyan
Write-Host "  3. Navigate to Perfect Storm folder" -ForegroundColor Cyan
Write-Host "  4. Type: git-push" -ForegroundColor Cyan
Write-Host ""
Write-Host "The function will automatically:" -ForegroundColor Cyan
Write-Host "  • Clear git lock files" -ForegroundColor Cyan
Write-Host "  • Authenticate with your PAT" -ForegroundColor Cyan
Write-Host "  • Push to GitHub" -ForegroundColor Cyan
Write-Host "  • Remove PAT from git config (security)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Profile location: $profilePath" -ForegroundColor Gray
