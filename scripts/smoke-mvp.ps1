param(
  [string]$ApiBaseUrl = "http://localhost:4000/api/v1",
  [string]$ShopeeWebhookSecret = "local-shopee-webhook-secret"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [object]$Body,
    [hashtable]$Headers = @{},
    [int]$TimeoutSec = 10
  )

  $params = @{
    Method = $Method
    Uri = $Url
    Headers = $Headers
    TimeoutSec = $TimeoutSec
  }

  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    Invoke-RestMethod @params
  } catch {
    throw "Request failed: $Method $Url. $($_.Exception.Message)"
  }
}

function Assert-Success {
  param(
    [Parameter(Mandatory = $true)]$Response,
    [Parameter(Mandatory = $true)][string]$Name
  )

  if ($Response.success -ne $true) {
    throw "$Name failed: response.success was not true"
  }

  Write-Host "[ok] $Name"
}

Write-Host "Running Omnia MVP smoke checks against $ApiBaseUrl"

$health = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/health"
Assert-Success -Response $health -Name "backend health"

$cashierLogin = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/auth/login" -Body @{
  username = "demo.cashier"
  password = "password123"
  device_id = "mvp-smoke-cashier"
}
Assert-Success -Response $cashierLogin -Name "cashier login"
$cashierToken = $cashierLogin.data.token

$adminLogin = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/auth/login" -Body @{
  username = "demo.admin"
  password = "password123"
  device_id = "mvp-smoke-admin"
}
Assert-Success -Response $adminLogin -Name "HQ admin login"
$adminToken = $adminLogin.data.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

$products = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/products"
Assert-Success -Response $products -Name "product master data"

$branches = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/branches"
Assert-Success -Response $branches -Name "branch master data"

$branchId = $branches.data[0].id
$registers = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/registers"
Assert-Success -Response $registers -Name "register master data"

$register = $registers.data | Where-Object { $_.branch_id -eq $branchId } | Select-Object -First 1
if ($null -eq $register) {
  throw "No register found for branch $branchId"
}

$eventId = "mvp-smoke-$([guid]::NewGuid().ToString())"
$transactionId = "txn-$eventId"
$product = $products.data[0]
$occurredAt = (Get-Date).ToUniversalTime().ToString("o")
$bundle = @{
  event_id = $eventId
  event_type = "transaction.bundle"
  event_version = 1
  branch_id = $branchId
  source_system = "branch_app"
  source_mode = "offline_replay"
  occurred_at = $occurredAt
  produced_by_user_id = $cashierLogin.data.user.id
  payload = @{
    transaction = @{
      id = $transactionId
      transaction_no = "SMOKE-$($eventId.Substring(10, 8))"
      branch_id = $branchId
      register_id = $register.id
      shift_id = $null
      cashier_user_id = $cashierLogin.data.user.id
      transaction_datetime = $occurredAt
      subtotal_amount = 15000
      discount_amount = 0
      tax_amount = 0
      total_amount = 15000
      payment_status = "paid"
      transaction_status = "completed"
      source_mode = "offline_replay"
      local_reference_id = $eventId
    }
    items = @(
      @{
        id = "item-$eventId"
        product_id = $product.id
        product_name_snapshot = $product.name
        sku_snapshot = $product.sku
        unit_price = 15000
        quantity = 1
        discount_amount = 0
        tax_amount = 0
        line_total = 15000
      }
    )
    payments = @(
      @{
        id = "pay-$eventId"
        payment_method_code = "cash"
        amount = 15000
        payment_status = "paid"
        paid_at = $occurredAt
      }
    )
    stock_movements = @(
      @{
        id = "stock-$eventId"
        product_id = $product.id
        source_type = "sales_transaction"
        source_id = $transactionId
        movement_type = "sale_out"
        quantity_delta = -1
        reason_code = "sale"
        performed_by_user_id = $cashierLogin.data.user.id
        movement_at = $occurredAt
      }
    )
  }
}

$syncHeaders = @{
  Authorization = "Bearer $cashierToken"
  "Idempotency-Key" = $eventId
}
$sync = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/sync/bundles" -Body $bundle -Headers $syncHeaders
Assert-Success -Response $sync -Name "transaction bundle sync"

$duplicate = Invoke-Json -Method "POST" -Url "$ApiBaseUrl/sync/bundles" -Body $bundle -Headers $syncHeaders
Assert-Success -Response $duplicate -Name "transaction bundle idempotency"
if ($duplicate.data.result_status -ne "duplicate_ignored") {
  throw "Expected duplicate_ignored, got $($duplicate.data.result_status)"
}

$dashboard = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/dashboard/central" -Headers $adminHeaders
Assert-Success -Response $dashboard -Name "executive dashboard API"

$shopeeHealth = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/monitoring/integrations/shopee" -Headers $adminHeaders
Assert-Success -Response $shopeeHealth -Name "Shopee integration health"

$ai = Invoke-Json -Method "GET" -Url "$ApiBaseUrl/ai/insights" -Headers $adminHeaders
Assert-Success -Response $ai -Name "AI insight API"

Write-Host "MVP smoke checks completed."
