param(
  [string]$Message = "chore: deploy"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (git status --porcelain)) {
  Write-Host "Nothing to commit."
} else {
  git add -A
  git commit -m $Message
}

$sha = (git rev-parse HEAD).Trim()
git push origin master

Write-Host "Pushed $sha — waiting for GitHub Actions..."
node "$PSScriptRoot/wait-for-deploy.mjs" $sha
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploy complete. Hard-close Telegram mini app to pick up the new frontend bundle."