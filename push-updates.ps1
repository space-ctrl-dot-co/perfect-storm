# Perfect Storm — push live data + Storm View v09 to GitHub
# Usage: .\push-updates.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Perfect Storm - staging changes" -ForegroundColor Cyan

git add "src/App.jsx"
Write-Host "  + src/App.jsx" -ForegroundColor Green

git add "src/hooks/useLiveSignals.js"
Write-Host "  + src/hooks/useLiveSignals.js" -ForegroundColor Green

git add "src/hooks/useLivePrices.js"
Write-Host "  + src/hooks/useLivePrices.js" -ForegroundColor Green

git add "src/ps-feeds.js"
Write-Host "  + src/ps-feeds.js" -ForegroundColor Green

git add "netlify/functions/price.js"
Write-Host "  + netlify/functions/price.js" -ForegroundColor Green

git add "netlify.toml"
Write-Host "  + netlify.toml" -ForegroundColor Green

git add "Plans & Reports/"
Write-Host "  + Plans & Reports/" -ForegroundColor Green

git add "Archive/"
Write-Host "  + Archive/" -ForegroundColor Green


Write-Host ""
Write-Host "Committing..." -ForegroundColor Cyan

$commitMsg = "fix: StormView TDZ + live feed + LIVE/OFFLINE indicator`n`nStormView: moved visibleTickers before useMemo deps (TDZ fix).`nAdded useCallback to React import.`nSignal Feed: wired to real RSS from useLiveSignals, removed`nhardcoded LIVE_FEED simulation entirely.`nNav: LIVE (green) / OFFLINE (red) indicator replaces old PRICES`nblock, font matches STORM title. Feed header shows last update`ntimestamp. Netlify: added /api/price redirect."

git commit -m $commitMsg
Write-Host "Committed" -ForegroundColor Green

Write-Host ""
Write-Host "Pushing to origin/master..." -ForegroundColor Cyan
git push origin master

Write-Host ""
Write-Host "Done - Netlify will build and deploy automatically" -ForegroundColor Green
Write-Host "https://perfect-storm.app" -ForegroundColor Cyan
Write-Host ""
