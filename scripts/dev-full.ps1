param(
  [switch] $SkipStart,
  [switch] $ForceInstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Assert-Command {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Name
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Command '$Name' tidak ditemukan. Install dependency tersebut lalu jalankan ulang."
  }
}

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Command,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command gagal: $Command $($Arguments -join ' ')"
  }
}

function Copy-EnvIfMissing {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Source,
    [Parameter(Mandatory = $true)]
    [string] $Destination
  )

  if (-not (Test-Path $Destination)) {
    Copy-Item $Source $Destination
    Write-Host "Created $Destination"
  }
}

function Set-EnvValueIfBlank {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path,
    [Parameter(Mandatory = $true)]
    [string] $Key,
    [Parameter(Mandatory = $true)]
    [string] $Value
  )

  if (-not (Test-Path $Path)) {
    return
  }

  $lines = @(Get-Content $Path)
  $found = $false
  $updated = $false
  $nextLines = $lines | ForEach-Object {
    if ($_ -match "^\s*$([regex]::Escape($Key))\s*=(.*)$") {
      $found = $true
      if ($Matches[1].Trim().Length -eq 0) {
        $updated = $true
        "$Key=$Value"
      } else {
        $_
      }
    } else {
      $_
    }
  }

  if (-not $found) {
    $nextLines += "$Key=$Value"
    $updated = $true
  }

  if ($updated) {
    Set-Content -Path $Path -Value $nextLines -Encoding UTF8
    Write-Host "Updated $Key in $Path"
  }
}

function Import-EnvFile {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $key, $value = $line.Split("=", 2)
    [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
  }
}

function Wait-ForHealthyContainer {
  param(
    [Parameter(Mandatory = $true)]
    [string] $ContainerName
  )

  Write-Host "Waiting for $ContainerName..."
  for ($attempt = 1; $attempt -le 30; $attempt++) {
    $status = docker inspect --format "{{.State.Health.Status}}" $ContainerName 2>$null
    if ($status -eq "healthy") {
      Write-Host "$ContainerName is healthy"
      return
    }

    Start-Sleep -Seconds 2
  }

  throw "$ContainerName belum healthy setelah 60 detik."
}

Assert-Command "pnpm"
Assert-Command "docker"
Assert-Command "sqlite3"

Copy-EnvIfMissing ".env.example" ".env.local"
Copy-EnvIfMissing "apps/backend-api/.env.example" "apps/backend-api/.env"
Copy-EnvIfMissing ".env.example" "apps/desktop-app/.env.local"

Set-EnvValueIfBlank ".env.local" "JWT_SECRET" "replace-with-local-development-secret"
Set-EnvValueIfBlank ".env.local" "REFRESH_TOKEN_SECRET" "replace-with-local-refresh-secret"
Set-EnvValueIfBlank "apps/backend-api/.env" "JWT_SECRET" "replace-with-a-long-local-development-secret"
Set-EnvValueIfBlank "apps/backend-api/.env" "REFRESH_TOKEN_SECRET" "replace-with-a-long-local-refresh-secret"

Import-EnvFile ".env.local"
Import-EnvFile "apps/backend-api/.env"

if ($ForceInstall -or -not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  Invoke-Native "pnpm" "install"
} else {
  Write-Host "Dependencies already installed; skipping pnpm install. Use -ForceInstall to reinstall."
}

Write-Host "Starting local infrastructure..."
Invoke-Native "docker" "compose" "up" "-d" "postgres" "redis"
Wait-ForHealthyContainer "omnia-postgres"
Wait-ForHealthyContainer "omnia-redis"

Write-Host "Preparing Prisma client and central database..."
Get-ChildItem -Path "node_modules/.pnpm" -Recurse -Filter "query_engine-windows.dll.node.tmp*" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue
Invoke-Native "pnpm" "--filter" "@omnia/backend-api" "prisma:generate"
Invoke-Native "pnpm" "--filter" "@omnia/backend-api" "exec" "prisma" "migrate" "deploy" "--schema" "prisma/schema.prisma"
Invoke-Native "pnpm" "--filter" "@omnia/backend-api" "prisma:seed"

Write-Host "Preparing desktop local SQLite database..."
$localDbDir = Join-Path $repoRoot "apps/desktop-app/.omnia"
$localDbPath = Join-Path $localDbDir "omnia-local.db"
$localSchemaPath = Join-Path $repoRoot "apps/desktop-app/local-store/schema.sql"
New-Item -ItemType Directory -Force -Path $localDbDir | Out-Null
Get-Content -Raw $localSchemaPath | sqlite3 $localDbPath
if ($LASTEXITCODE -ne 0) {
  throw "Command gagal: sqlite3 $localDbPath"
}

Write-Host ""
Write-Host "Omnia siap dijalankan."
Write-Host "Desktop renderer: http://localhost:3000"
Write-Host "Backend API docs:  http://localhost:4000/api/v1/docs"
Write-Host ""

if ($SkipStart) {
  Write-Host "SkipStart aktif; proses dev tidak dijalankan."
  exit 0
}

Write-Host "Starting all workspace dev processes..."
Invoke-Native "pnpm" "dev"
