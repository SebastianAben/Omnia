param(
  [switch] $Reset
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dbDir = Join-Path $root ".omnia"
$dbPath = Join-Path $dbDir "omnia-local.db"
$journalPath = "$dbPath-journal"
$schemaPath = Join-Path $PSScriptRoot "schema.sql"

New-Item -ItemType Directory -Force -Path $dbDir | Out-Null

if (-not (Get-Command sqlite3 -ErrorAction SilentlyContinue)) {
  throw "sqlite3 is required to initialize the Omnia desktop local database."
}

if ($Reset) {
  $backupDir = Join-Path $dbDir "backups"
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $timestamp = Get-Date -Format "yyyyMMddHHmmss"

  if (Test-Path $dbPath) {
    Move-Item -Force -LiteralPath $dbPath -Destination (Join-Path $backupDir "omnia-local.$timestamp.db")
  }

  if (Test-Path $journalPath) {
    Move-Item -Force -LiteralPath $journalPath -Destination (Join-Path $backupDir "omnia-local.$timestamp.db-journal")
  }
}

function Invoke-SqliteScalar {
  param([string] $Sql)
  $output = & sqlite3 $dbPath $Sql
  if ($LASTEXITCODE -ne 0) {
    throw "sqlite3 failed while executing: $Sql"
  }

  if ($null -eq $output) {
    return ""
  }

  return $output.Trim()
}

function Add-ColumnIfMissing {
  param(
    [string] $Table,
    [string] $Column,
    [string] $Definition
  )

  $exists = Invoke-SqliteScalar "SELECT COUNT(*) FROM pragma_table_info('$Table') WHERE name = '$Column';"
  if ($exists -eq "0") {
    & sqlite3 $dbPath "ALTER TABLE $Table ADD COLUMN $Column $Definition;"
  }
}

$schemaSql = Get-Content -Raw -LiteralPath $schemaPath
$schemaSql | & sqlite3 $dbPath
if ($LASTEXITCODE -ne 0) {
  throw "sqlite3 failed while applying schema: $schemaPath"
}

Add-ColumnIfMissing "sync_queue_local" "next_retry_at" "TEXT"
Add-ColumnIfMissing "sync_queue_local" "last_error_code" "TEXT"
Add-ColumnIfMissing "sync_queue_local" "last_error_message" "TEXT"
Add-ColumnIfMissing "sync_queue_local" "acknowledged_at" "TEXT"
Add-ColumnIfMissing "sync_queue_local" "ack_status" "TEXT"
Add-ColumnIfMissing "payments_local" "amount_received" "INTEGER"

Write-Output "Desktop local SQLite database ready: $dbPath"
