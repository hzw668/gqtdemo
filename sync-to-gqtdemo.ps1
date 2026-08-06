# Sync local repo files to https://github.com/hzw668/gqtdemo
param(
    [string]$Message = "同步本地变更到 gqtdemo",
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
    $OutputEncoding = [System.Text.UTF8Encoding]::new()
    $null = cmd /c "chcp 65001 >nul"
} catch {
}

function Exit-WithError {
    param([string]$Text, [int]$Code = 1)
    Write-Error $Text
    exit $Code
}

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    Exit-WithError "当前目录不是 git 仓库：$RepoRoot"
}

try {
    $remoteUrl = git remote get-url $Remote 2>$null
} catch {
    Exit-WithError "无法读取远程 '$Remote' 的 URL，请确认远程已配置。"
}

if (-not $remoteUrl) {
    Exit-WithError "远程 '$Remote' 不存在。"
}

$normalizedUrl = $remoteUrl.TrimEnd("/").ToLowerInvariant()
if ($normalizedUrl -notmatch "github\.com[/:]hzw668/gqtdemo(\.git)?$") {
    Exit-WithError "远程 URL 不匹配预期仓库。当前：$remoteUrl`n期望包含：github.com/hzw668/gqtdemo"
}

Write-Host "仓库根目录: $RepoRoot"
Write-Host "远程 ($Remote): $remoteUrl"
Write-Host "分支: $Branch"
if ($DryRun) {
    Write-Host "模式: DryRun（不会提交或推送）"
}

$status = git status --porcelain
if (-not $status) {
    Write-Host "无本地变更，无需同步。"
    git status -sb
    exit 0
}

Write-Host ""
Write-Host "待同步变更："
git status --short

if ($DryRun) {
    Write-Host ""
    Write-Host "DryRun 结束。实际同步请去掉 -DryRun 后重跑。"
    exit 0
}

git add -A
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "git add -A 失败。"
}

$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "暂存区为空，跳过提交与推送。"
    git status -sb
    exit 0
}

$beforeHead = (git rev-parse HEAD).Trim()
# Invoke commit via argument array
& git @("commit", "-m", $Message)
$commitExit = $LASTEXITCODE
$afterHead = (git rev-parse HEAD).Trim()
$remainingStaged = git diff --cached --name-only
$commitOk = ($commitExit -eq 0) -or (($afterHead -ne $beforeHead) -and (-not $remainingStaged))
if (-not $commitOk) {
    Exit-WithError "本地提交失败。"
}
if ($commitExit -ne 0) {
    Write-Warning "提交已成功（HEAD=$afterHead），但 git 退出码为 $commitExit（常见于控制台输出写入失败）。继续推送。"
}

git push $Remote $Branch
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "git push 失败。若远程有新提交，可先执行：git pull --rebase $Remote $Branch，再重新运行本脚本。"
}

Write-Host ""
Write-Host "同步完成。"
git status -sb
Write-Host "远程地址: $remoteUrl"
