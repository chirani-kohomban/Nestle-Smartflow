param(
  [string]$OutputDir = "backups",
  [string]$DatabaseName = $env:MYSQL_DATABASE
)

if (-not $DatabaseName) {
  $DatabaseName = "nestle_smartflow"
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $workspaceRoot $OutputDir

if (-not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $targetDir "$($DatabaseName)-$timestamp.sql"

if (-not (Get-Command mysqldump -ErrorAction SilentlyContinue)) {
  throw "mysqldump is not available on PATH. Install MySQL client tools or add them to PATH."
}

$env:MYSQL_PWD = $env:MYSQL_PASSWORD

try {
  & mysqldump --host=$env:MYSQL_HOST --port=$env:MYSQL_PORT --user=$env:MYSQL_USER --databases $DatabaseName --routines --triggers --single-transaction --quick --result-file=$backupFile
  Write-Host "Backup created at $backupFile"
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}