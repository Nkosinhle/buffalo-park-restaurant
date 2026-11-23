$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host 'Git is not installed. Install Git for Windows from https://git-scm.com/download/win and rerun this script.' -ForegroundColor Red
    exit 1
}
if (-not (Test-Path 'package.json')) { throw 'package.json not found. Extract the entire ZIP first.' }
if (-not (Test-Path '.git')) { git init -b main }
git branch -M main
$remote = git remote 2>$null
if ($LASTEXITCODE -ne 0) { $remote = '' }
if ($remote -contains 'origin') {
    git remote set-url origin https://github.com/Nkosinhle/buffalo-park-restaurant.git
} else {
    git remote add origin https://github.com/Nkosinhle/buffalo-park-restaurant.git
}
git add .
$pending = git status --porcelain
if ($pending) {
    git -c user.name='Nkosinhle' -c user.email='129213050+Nkosinhle@users.noreply.github.com' commit -m 'Initial Buffalo Park Restaurant website'
}
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'GitHub push failed. Make sure you authenticate with your Nkosinhle GitHub account.' }
Write-Host 'Website source uploaded: https://github.com/Nkosinhle/buffalo-park-restaurant' -ForegroundColor Green
