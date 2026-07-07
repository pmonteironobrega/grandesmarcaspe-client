# Roda migrations no servidor remoto (191.252.222.63) via SSH.
#
# Uso (na raiz do gmpe-site):
#   npm run db:migrate:remote
#   npm run db:migrate:remote -- -SyncDist
#
# Caminho do servidor: GMPE_SERVER_DIR ou ../projects/grandesmarcaspe-server

param(
  [switch]$SyncDist
)

$ErrorActionPreference = "Stop"

$DefaultServerDir = Resolve-Path (Join-Path $PSScriptRoot "../../projects/grandesmarcaspe-server")
$ServerDir = if ($env:GMPE_SERVER_DIR) { $env:GMPE_SERVER_DIR } else { $DefaultServerDir }

if (-not (Test-Path $ServerDir)) {
  Write-Error "Repositório do servidor não encontrado em: $ServerDir`nDefina GMPE_SERVER_DIR com o caminho correto."
}

$RemoteArgs = @()
if ($SyncDist) {
  $RemoteArgs += "-SyncDist"
}

& (Join-Path $ServerDir "deploy/scripts/remote-db-migrate.ps1") @RemoteArgs
