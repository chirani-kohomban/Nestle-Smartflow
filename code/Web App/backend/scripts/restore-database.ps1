param(
  [string]$BackupFile,
  [string]$DatabaseName = $env:MYSQL_DATABASE
)

if (-not $DatabaseName) {
  $DatabaseName = "nestle_smartflow"
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $workspaceRoot "backups"

if (-not $BackupFile) {
  $latest = Get-ChildItem -Path $backupDir -Filter "$($DatabaseName)-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) {
    throw "No backup file found in $backupDir"
  }

  $BackupFile = $latest.FullName
}

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  throw "mysql client is not available on PATH. Install MySQL client tools or add them to PATH."
}

$env:MYSQL_PWD = $env:MYSQL_PASSWORD

try {
  Get-Content -Raw $BackupFile | & mysql --host=$env:MYSQL_HOST --port=$env:MYSQL_PORT --user=$env:MYSQL_USER $DatabaseName
  Write-Host "Database restored from $BackupFile"
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}