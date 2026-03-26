# Claude Code Hub - One-Click Deployment Script for Windows
# PowerShell 5.1+ required

#Requires -Version 5.1

[CmdletBinding()]
param(
    [Alias("b")]
    [ValidateSet("main", "dev", "")]
    [string]$Branch = "",
    
    [Alias("p")]
    [ValidateRange(1, 65535)]
    [int]$Port = 0,
    
    [Alias("t")]
    [string]$AdminToken = "",
    
    [Alias("d")]
    [string]$DeployDir = "",

    [string]$ComposeFile = "",

    [string]$EnvFile = "",

    [string]$AppService = "app",

    [switch]$Restart,

    [switch]$ProbeOnly,

    [ValidateRange(5, 3600)]
    [int]$RestartTimeout = 90,

    [ValidateRange(1, 10000)]
    [int]$TailLogLines = 80,
    
    [string]$Domain = "",
    
    [switch]$EnableCaddy,
    
    [switch]$ForceNew,
    
    [Alias("y")]
    [switch]$Yes,
    
    [Alias("h")]
    [switch]$Help
)

# Script version
$VERSION = "1.2.0"

# Global variables
$script:SUFFIX = ""
$script:ADMIN_TOKEN = ""
$script:DB_PASSWORD = ""
$script:DEPLOY_DIR = "C:\ProgramData\claude-code-hub"
$script:IMAGE_TAG = "latest"
$script:BRANCH_NAME = "main"
$script:APP_PORT = "23000"
$script:ENABLE_CADDY = $false
$script:DOMAIN_ARG = ""
$script:UPDATE_MODE = $false
$script:FORCE_NEW = $false
$script:RESTART_MODE = $false
$script:PROBE_ONLY = $false
$script:COMPOSE_FILE = ""
$script:ENV_FILE = ""
$script:APP_SERVICE = "app"
$script:RESTART_TIMEOUT_SECONDS = 90
$script:TAIL_LOG_LINES = 80

function Show-Help {
    $helpText = @"
Claude Code Hub - One-Click Deployment Script v$VERSION

Usage: .\deploy.ps1 [OPTIONS]

Options:
  -Branch, -b <name>         Branch to deploy: main (default) or dev
  -Port, -p <port>           App external port (default: 23000)
  -AdminToken, -t <token>    Custom admin token (default: auto-generated)
  -DeployDir, -d <path>      Custom deployment directory
  -ComposeFile <path>        Existing compose file used by -Restart/-ProbeOnly
  -EnvFile <path>            Existing env file used by -Restart/-ProbeOnly
  -AppService <name>         App service name for probes (default: app)
  -Restart                   Restart an existing deployment and run probes
  -ProbeOnly                 Only run deployment probes; do not change containers
  -RestartTimeout <seconds>  Probe timeout for -Restart/-ProbeOnly (default: 90)
  -TailLogLines <count>      Lines of logs to show on probe failure (default: 80)
  -Domain <domain>           Domain for Caddy HTTPS (enables Caddy automatically)
  -EnableCaddy               Enable Caddy reverse proxy without HTTPS (HTTP only)
  -ForceNew                  Force fresh installation (ignore existing deployment)
  -Yes, -y                   Non-interactive mode (skip prompts, use defaults)
  -Help, -h                  Show this help message

Examples:
  .\deploy.ps1                                    # Interactive deployment
  .\deploy.ps1 -Yes                               # Non-interactive with defaults
  .\deploy.ps1 -Branch dev -Port 8080 -Yes        # Deploy dev branch on port 8080
  .\deploy.ps1 -AdminToken "my-secure-token" -Yes # Use custom admin token
  .\deploy.ps1 -Domain hub.example.com -Yes       # Deploy with Caddy HTTPS
  .\deploy.ps1 -EnableCaddy -Yes                  # Deploy with Caddy HTTP-only
  .\deploy.ps1 -Yes                               # Update existing deployment (auto-detected)
  .\deploy.ps1 -ForceNew -Yes                     # Force fresh install even if deployment exists
  .\deploy.ps1 -Restart -DeployDir C:\claude-code-hub -Yes
  .\deploy.ps1 -ProbeOnly -ComposeFile C:\claude-code-hub\docker-compose.yaml

For more information, visit: https://github.com/ding113/claude-code-hub
"@
    Write-Host $helpText
}

function Initialize-Parameters {
    if ($Restart -and $ProbeOnly) {
        Write-ColorOutput "-Restart and -ProbeOnly cannot be used together" -Type Error
        exit 1
    }

    # Apply CLI parameters
    if ($Branch) {
        if ($Branch -eq "main") {
            $script:IMAGE_TAG = "latest"
            $script:BRANCH_NAME = "main"
        } elseif ($Branch -eq "dev") {
            $script:IMAGE_TAG = "dev"
            $script:BRANCH_NAME = "dev"
        }
    }
    
    if ($Port -gt 0) {
        $script:APP_PORT = $Port.ToString()
    }
    
    if ($AdminToken) {
        if ($AdminToken.Length -lt 16) {
            Write-ColorOutput "Admin token too short: minimum 16 characters required" -Type Error
            exit 1
        }
        $script:ADMIN_TOKEN = $AdminToken
    }
    
    if ($DeployDir) {
        $script:DEPLOY_DIR = $DeployDir
    }

    if ($ComposeFile) {
        $script:COMPOSE_FILE = $ComposeFile
    }

    if ($EnvFile) {
        $script:ENV_FILE = $EnvFile
    }

    if ($AppService) {
        $script:APP_SERVICE = $AppService
    }

    if ($Restart) {
        $script:RESTART_MODE = $true
    }

    if ($ProbeOnly) {
        $script:PROBE_ONLY = $true
    }

    $script:RESTART_TIMEOUT_SECONDS = $RestartTimeout
    $script:TAIL_LOG_LINES = $TailLogLines
    
    if ($Domain) {
        # Validate domain format
        if ($Domain -notmatch '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$') {
            Write-ColorOutput "Invalid domain format: $Domain" -Type Error
            exit 1
        }
        $script:DOMAIN_ARG = $Domain
        $script:ENABLE_CADDY = $true
    }
    
    if ($EnableCaddy) {
        $script:ENABLE_CADDY = $true
    }

    if ($ForceNew) {
        $script:FORCE_NEW = $true
    }
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    switch ($Type) {
        "Header" { Write-Host $Message -ForegroundColor Cyan }
        "Info" { Write-Host "[INFO] $Message" -ForegroundColor Blue }
        "Success" { Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
        "Error" { Write-Host "[ERROR] $Message" -ForegroundColor Red }
        default { Write-Host $Message }
    }
}

function Show-Header {
    Write-ColorOutput "+=================================================================+" -Type Header
    Write-ColorOutput "|                                                                 |" -Type Header
    Write-ColorOutput "|           Claude Code Hub - One-Click Deployment               |" -Type Header
    Write-ColorOutput "|                      Version $VERSION                             |" -Type Header
    Write-ColorOutput "|                                                                 |" -Type Header
    Write-ColorOutput "+=================================================================+" -Type Header
    Write-Host ""
}

function Test-DockerInstalled {
    Write-ColorOutput "Checking Docker installation..." -Type Info
    
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Docker is not installed" -Type Warning
            return $false
        }
        
        $composeVersion = docker compose version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Docker Compose is not installed" -Type Warning
            return $false
        }
        
        Write-ColorOutput "Docker and Docker Compose are installed" -Type Success
        Write-Host $dockerVersion
        Write-Host $composeVersion
        return $true
    }
    catch {
        Write-ColorOutput "Docker is not installed" -Type Warning
        return $false
    }
}

function Show-DockerInstallInstructions {
    Write-ColorOutput "Docker is not installed on this system" -Type Error
    Write-Host ""
    Write-ColorOutput "Please install Docker Desktop for Windows:" -Type Info
    Write-Host "  1. Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host "  2. Run the installer and follow the instructions"
    Write-Host "  3. Restart your computer after installation"
    Write-Host "  4. Run this script again"
    Write-Host ""
    Write-ColorOutput "Press any key to open Docker Desktop download page..." -Type Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

function Select-Branch {
    # Skip if branch already set via CLI or non-interactive mode
    if ($Branch) {
        Write-ColorOutput "Using branch from CLI argument: $script:BRANCH_NAME" -Type Info
        return
    }
    
    if ($Yes) {
        Write-ColorOutput "Non-interactive mode: using default branch (main)" -Type Info
        return
    }

    Write-Host ""
    Write-ColorOutput "Please select the branch to deploy:" -Type Info
    Write-Host "  1) main   (Stable release - recommended for production)" -ForegroundColor Green
    Write-Host "  2) dev    (Latest features - for testing)" -ForegroundColor Yellow
    Write-Host ""
    
    while ($true) {
        $choice = Read-Host "Enter your choice [1]"
        if ([string]::IsNullOrWhiteSpace($choice)) {
            $choice = "1"
        }
        
        switch ($choice) {
            "1" {
                $script:IMAGE_TAG = "latest"
                $script:BRANCH_NAME = "main"
                Write-ColorOutput "Selected branch: main (image tag: latest)" -Type Success
                break
            }
            "2" {
                $script:IMAGE_TAG = "dev"
                $script:BRANCH_NAME = "dev"
                Write-ColorOutput "Selected branch: dev (image tag: dev)" -Type Success
                break
            }
            default {
                Write-ColorOutput "Invalid choice. Please enter 1 or 2." -Type Error
                continue
            }
        }
        break
    }
}

function New-RandomSuffix {
    $chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    $script:SUFFIX = -join ((1..4) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    Write-ColorOutput "Generated random suffix: $SUFFIX" -Type Info
}

function New-AdminToken {
    # Skip if token already set via CLI
    if ($script:ADMIN_TOKEN) {
        Write-ColorOutput "Using admin token from CLI argument" -Type Info
        return
    }

    # Generate more bytes to ensure we have enough after removing special chars
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $token = [Convert]::ToBase64String($bytes) -replace '[/+=]', ''
    $script:ADMIN_TOKEN = $token.Substring(0, [Math]::Min(32, $token.Length))
    Write-ColorOutput "Generated secure admin token" -Type Info
}

function New-DbPassword {
    # Generate more bytes to ensure we have enough after removing special chars
    $bytes = New-Object byte[] 36
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $password = [Convert]::ToBase64String($bytes) -replace '[/+=]', ''
    $script:DB_PASSWORD = $password.Substring(0, [Math]::Min(24, $password.Length))
    Write-ColorOutput "Generated secure database password" -Type Info
}

function Test-ExistingDeployment {
    if ($script:FORCE_NEW) {
        Write-ColorOutput "Force-new flag set, skipping existing deployment detection" -Type Info
        return $false
    }
    if ((Test-Path "$($script:DEPLOY_DIR)\.env") -and (Test-Path "$($script:DEPLOY_DIR)\docker-compose.yaml")) {
        Write-ColorOutput "Detected existing deployment in $($script:DEPLOY_DIR)" -Type Info
        $script:UPDATE_MODE = $true
        return $true
    }
    return $false
}

function Get-SuffixFromCompose {
    $composeFile = "$($script:DEPLOY_DIR)\docker-compose.yaml"
    $content = Get-Content $composeFile -Raw
    if ($content -match 'container_name: claude-code-hub-db-([a-z0-9]+)') {
        $script:SUFFIX = $Matches[1]
        Write-ColorOutput "Using existing suffix: $($script:SUFFIX)" -Type Info
    }
    else {
        Write-ColorOutput "Could not extract suffix from docker-compose.yaml, generating new one" -Type Warning
        New-RandomSuffix
    }
}

function Import-ExistingEnv {
    $envFile = "$($script:DEPLOY_DIR)\.env"

    # Load DB_PASSWORD
    $dbPwLine = Select-String -Path $envFile -Pattern '^DB_PASSWORD=' | Select-Object -First 1
    if ($dbPwLine) {
        $script:DB_PASSWORD = ($dbPwLine.Line -split '=', 2)[1]
        Write-ColorOutput "Preserved existing database password" -Type Info
    }
    else {
        Write-ColorOutput "DB_PASSWORD not found in existing .env, generating new one" -Type Warning
        New-DbPassword
    }

    # Load ADMIN_TOKEN (CLI argument takes priority)
    if (-not $script:ADMIN_TOKEN) {
        $tokenLine = Select-String -Path $envFile -Pattern '^ADMIN_TOKEN=' | Select-Object -First 1
        if ($tokenLine) {
            $script:ADMIN_TOKEN = ($tokenLine.Line -split '=', 2)[1]
            Write-ColorOutput "Preserved existing admin token" -Type Info
        }
        else {
            Write-ColorOutput "ADMIN_TOKEN not found in existing .env, generating new one" -Type Warning
            New-AdminToken
        }
    }

    # Load APP_PORT (CLI argument takes priority)
    if ($Port -eq 0) {
        $portLine = Select-String -Path $envFile -Pattern '^APP_PORT=' | Select-Object -First 1
        if ($portLine) {
            $script:APP_PORT = ($portLine.Line -split '=', 2)[1]
        }
    }
}

function Resolve-RuntimePaths {
    if (-not $script:COMPOSE_FILE) {
        $archboxCompose = Join-Path $script:DEPLOY_DIR "docker-compose.archbox.yaml"
        $defaultCompose = Join-Path $script:DEPLOY_DIR "docker-compose.yaml"

        if (Test-Path $archboxCompose) {
            $script:COMPOSE_FILE = $archboxCompose
        }
        elseif (Test-Path $defaultCompose) {
            $script:COMPOSE_FILE = $defaultCompose
        }
        else {
            $script:COMPOSE_FILE = $defaultCompose
        }
    }

    if (-not $script:ENV_FILE) {
        $script:ENV_FILE = Join-Path $script:DEPLOY_DIR ".env"
    }
}

function Get-ComposeArgs {
    param(
        [string[]]$Arguments
    )

    $composeArgs = @("compose", "-f", $script:COMPOSE_FILE)
    if ($script:ENV_FILE -and (Test-Path $script:ENV_FILE)) {
        $composeArgs += @("--env-file", $script:ENV_FILE)
    }
    if ($Arguments) {
        $composeArgs += $Arguments
    }
    return ,$composeArgs
}

function Invoke-Compose {
    param(
        [string[]]$Arguments
    )

    Push-Location $script:DEPLOY_DIR
    try {
        & docker @(Get-ComposeArgs -Arguments $Arguments)
    }
    finally {
        Pop-Location
    }
}

function Get-ComposeCommandHint {
    $parts = @("cd `"$($script:DEPLOY_DIR)`"", "docker compose")

    if ($script:COMPOSE_FILE -and $script:COMPOSE_FILE -ne (Join-Path $script:DEPLOY_DIR "docker-compose.yaml")) {
        $parts += "-f `"$($script:COMPOSE_FILE)`""
    }

    if ($script:ENV_FILE -and $script:ENV_FILE -ne (Join-Path $script:DEPLOY_DIR ".env")) {
        $parts += "--env-file `"$($script:ENV_FILE)`""
    }

    return (($parts -join " ") + " ")
}

function Get-EnvValue {
    param(
        [string]$Key,
        [string]$DefaultValue = ""
    )

    if ($script:ENV_FILE -and (Test-Path $script:ENV_FILE)) {
        $line = Select-String -Path $script:ENV_FILE -Pattern "^$Key=" | Select-Object -Last 1
        if ($line) {
            return ($line.Line -split '=', 2)[1]
        }
    }

    return $DefaultValue
}

function Get-RuntimeAppPort {
    return (Get-EnvValue -Key "APP_PORT" -DefaultValue $script:APP_PORT)
}

function Get-RuntimeServices {
    try {
        $services = Invoke-Compose -Arguments @("config", "--services") 2>$null
        $serviceList = @($services | Where-Object { $_ -and $_.Trim() })
        if ($serviceList.Count -gt 0) {
            return $serviceList
        }
    }
    catch {
    }

    return @("postgres", "redis", $script:APP_SERVICE)
}

function Get-ServiceContainerId {
    param(
        [string]$ServiceName
    )

    try {
        $containerId = Invoke-Compose -Arguments @("ps", "-q", $ServiceName) 2>$null | Select-Object -First 1
        if ($containerId) {
            return $containerId.Trim()
        }
    }
    catch {
    }

    return $null
}

function Get-ContainerName {
    param(
        [string]$ContainerId
    )

    if (-not $ContainerId) {
        return $null
    }

    $containerName = (& docker inspect --format='{{.Name}}' $ContainerId 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $containerName) {
        return $null
    }

    return $containerName.Trim().TrimStart('/')
}

function Get-ContainerState {
    param(
        [string]$ContainerId
    )

    if (-not $ContainerId) {
        return $null
    }

    $containerState = (& docker inspect --format='{{.State.Status}}' $ContainerId 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $containerState) {
        return $null
    }

    return $containerState.Trim()
}

function Get-ContainerHealth {
    param(
        [string]$ContainerId
    )

    if (-not $ContainerId) {
        return $null
    }

    $containerHealth = (& docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $ContainerId 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $containerHealth) {
        return $null
    }

    return $containerHealth.Trim()
}

function Get-ContainerPorts {
    param(
        [string]$ContainerId
    )

    if (-not $ContainerId) {
        return "none"
    }

    $ports = @(& docker port $ContainerId 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $ports -or $ports.Count -eq 0) {
        return "none"
    }

    return ($ports | Where-Object { $_ -and $_.Trim() } | ForEach-Object { $_.Trim() }) -join ", "
}

function Test-HostHealthSilent {
    param(
        [string]$AppPort
    )

    $url = "http://127.0.0.1:$AppPort/api/actions/health"

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
        return ($response.StatusCode -eq 200)
    }
    catch {
        return $false
    }
}

function Test-ContainerHealthSilent {
    param(
        [string]$ContainerId,
        [string]$AppPort
    )

    if (-not $ContainerId) {
        return $false
    }

    & docker exec $ContainerId sh -lc "curl -fsS -m 5 http://127.0.0.1:$AppPort/api/actions/health >/dev/null" *> $null
    return ($LASTEXITCODE -eq 0)
}

function Show-HostHealthProbe {
    param(
        [string]$AppPort
    )

    $url = "http://127.0.0.1:$AppPort/api/actions/health"

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "Host health probe: $url -> 200" -Type Success
            return $true
        }

        Write-ColorOutput "Host health probe: $url -> HTTP $($response.StatusCode)" -Type Warning
        return $false
    }
    catch {
        $message = $_.Exception.Message
        if (-not $message) {
            $message = "request failed"
        }
        Write-ColorOutput "Host health probe: $url -> $message" -Type Warning
        return $false
    }
}

function Show-ContainerHealthProbe {
    param(
        [string]$ContainerId,
        [string]$ContainerName,
        [string]$AppPort
    )

    if (-not $ContainerId) {
        Write-ColorOutput "Container health probe: $ContainerName -> missing container" -Type Warning
        return $false
    }

    $probeOutput = (& docker exec $ContainerId sh -lc "curl -sS -m 5 http://127.0.0.1:$AppPort/api/actions/health" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -eq 0 -and $probeOutput -like '*"status":"ok"*') {
        Write-ColorOutput "Container health probe: $ContainerName -> ok" -Type Success
        return $true
    }

    if (-not $probeOutput) {
        $probeOutput = "probe returned no output"
    }

    if ($probeOutput.Length -gt 160) {
        $probeOutput = $probeOutput.Substring(0, 160)
    }

    Write-ColorOutput "Container health probe: $ContainerName -> $probeOutput" -Type Warning
    return $false
}

function Show-RuntimeProbe {
    param(
        [string]$AppPort
    )

    $ready = $false

    Write-Host ""
    Write-ColorOutput "Runtime probe summary" -Type Info
    Write-Host "  deploy_dir: $($script:DEPLOY_DIR)"
    Write-Host "  compose_file: $($script:COMPOSE_FILE)"
    Write-Host "  env_file: $($script:ENV_FILE)"
    Write-Host "  app_service: $($script:APP_SERVICE)"
    Write-Host "  app_port: $AppPort"
    Write-Host ""

    Write-ColorOutput "docker compose ps" -Type Info
    try {
        Invoke-Compose -Arguments @("ps")
    }
    catch {
    }
    Write-Host ""

    foreach ($serviceName in (Get-RuntimeServices)) {
        if (-not $serviceName) {
            continue
        }

        $containerId = Get-ServiceContainerId -ServiceName $serviceName
        if (-not $containerId) {
            Write-ColorOutput "service=$serviceName container=missing" -Type Warning
            continue
        }

        $containerName = Get-ContainerName -ContainerId $containerId
        $containerState = Get-ContainerState -ContainerId $containerId
        $containerHealth = Get-ContainerHealth -ContainerId $containerId
        $containerPorts = Get-ContainerPorts -ContainerId $containerId

        Write-Host "  service=$serviceName container=$containerName state=$containerState health=$containerHealth ports=$containerPorts"

        if ($serviceName -eq $script:APP_SERVICE -and $containerHealth -eq "healthy") {
            $ready = $true
        }
    }
    Write-Host ""

    if (Show-HostHealthProbe -AppPort $AppPort) {
        $ready = $true
    }

    $appContainerId = Get-ServiceContainerId -ServiceName $script:APP_SERVICE
    if ($appContainerId) {
        $appContainerName = Get-ContainerName -ContainerId $appContainerId
        if (Show-ContainerHealthProbe -ContainerId $appContainerId -ContainerName $appContainerName -AppPort $AppPort) {
            $ready = $true
        }
    }
    else {
        Write-ColorOutput "App service container is missing; skipping container health probe" -Type Warning
    }

    return $ready
}

function Test-RuntimeReady {
    param(
        [string]$AppPort
    )

    $appContainerId = Get-ServiceContainerId -ServiceName $script:APP_SERVICE
    if (-not $appContainerId) {
        return $false
    }

    $containerHealth = Get-ContainerHealth -ContainerId $appContainerId
    if ($containerHealth -eq "healthy") {
        return $true
    }

    if (Test-ContainerHealthSilent -ContainerId $appContainerId -AppPort $AppPort) {
        return $true
    }

    if (Test-HostHealthSilent -AppPort $AppPort) {
        return $true
    }

    return $false
}

function Show-RuntimeFailureLogs {
    Write-ColorOutput "Recent $($script:APP_SERVICE) logs (tail $($script:TAIL_LOG_LINES))" -Type Warning
    try {
        Invoke-Compose -Arguments @("logs", "--tail", $script:TAIL_LOG_LINES.ToString(), $script:APP_SERVICE)
    }
    catch {
    }
}

function Wait-ForRuntimeReady {
    param(
        [string]$AppPort
    )

    Write-ColorOutput "Waiting for runtime readiness (max $($script:RESTART_TIMEOUT_SECONDS) seconds)..." -Type Info

    $elapsed = 0
    while ($elapsed -lt $script:RESTART_TIMEOUT_SECONDS) {
        if (Test-RuntimeReady -AppPort $AppPort) {
            Write-ColorOutput "Runtime probes passed" -Type Success
            return $true
        }

        $appContainerId = Get-ServiceContainerId -ServiceName $script:APP_SERVICE
        $state = "missing"
        $health = "missing"
        if ($appContainerId) {
            $state = Get-ContainerState -ContainerId $appContainerId
            $health = Get-ContainerHealth -ContainerId $appContainerId
        }

        Write-ColorOutput "Probe attempt ${elapsed}s/$($script:RESTART_TIMEOUT_SECONDS)s: app state=$state, health=$health" -Type Info
        Start-Sleep -Seconds 5
        $elapsed += 5
    }

    Write-ColorOutput "Runtime did not become ready within $($script:RESTART_TIMEOUT_SECONDS) seconds" -Type Warning
    return $false
}

function Restart-Runtime {
    param(
        [string]$AppPort
    )

    Write-ColorOutput "Restarting existing deployment" -Type Info

    $restartSucceeded = $true
    try {
        Invoke-Compose -Arguments @("restart")
        if ($LASTEXITCODE -ne 0) {
            $restartSucceeded = $false
        }
    }
    catch {
        $restartSucceeded = $false
    }

    if (-not $restartSucceeded) {
        Write-ColorOutput "docker compose restart failed; falling back to docker compose up -d" -Type Warning
        Invoke-Compose -Arguments @("up", "-d")
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to restart deployment"
        }
    }

    if (Wait-ForRuntimeReady -AppPort $AppPort) {
        [void](Show-RuntimeProbe -AppPort $AppPort)
        return $true
    }

    [void](Show-RuntimeProbe -AppPort $AppPort)
    Show-RuntimeFailureLogs
    return $false
}

function Invoke-RuntimeMode {
    Resolve-RuntimePaths

    if (-not (Test-Path $script:DEPLOY_DIR)) {
        Write-ColorOutput "Deployment directory does not exist: $($script:DEPLOY_DIR)" -Type Error
        return $false
    }

    if (-not (Test-Path $script:COMPOSE_FILE)) {
        Write-ColorOutput "Compose file does not exist: $($script:COMPOSE_FILE)" -Type Error
        return $false
    }

    $appPort = Get-RuntimeAppPort

    if ($script:PROBE_ONLY) {
        Write-ColorOutput "=== PROBE MODE ===" -Type Info
        return (Show-RuntimeProbe -AppPort $appPort)
    }

    Write-ColorOutput "=== RESTART MODE ===" -Type Info
    [void](Show-RuntimeProbe -AppPort $appPort)
    return (Restart-Runtime -AppPort $appPort)
}

function New-DeploymentDirectory {
    Write-ColorOutput "Creating deployment directory: $DEPLOY_DIR" -Type Info
    
    try {
        if (-not (Test-Path $DEPLOY_DIR)) {
            New-Item -ItemType Directory -Path $DEPLOY_DIR -Force | Out-Null
        }
        
        New-Item -ItemType Directory -Path "$DEPLOY_DIR\data\postgres" -Force | Out-Null
        New-Item -ItemType Directory -Path "$DEPLOY_DIR\data\redis" -Force | Out-Null
        
        Write-ColorOutput "Deployment directory created" -Type Success
    }
    catch {
        Write-ColorOutput "Failed to create deployment directory: $_" -Type Error
        exit 1
    }
}

function Write-ComposeFile {
    Write-ColorOutput "Writing docker-compose.yaml..." -Type Info
    
    # Build ports section for app (only if Caddy is not enabled)
    $appPortsSection = ""
    if (-not $script:ENABLE_CADDY) {
        $appPortsSection = @"
    ports:
      - "`${APP_PORT:-$($script:APP_PORT)}:`${APP_PORT:-$($script:APP_PORT)}"
"@
    }

    $composeContent = @"
services:
  postgres:
    image: postgres:18
    container_name: claude-code-hub-db-$SUFFIX
    restart: unless-stopped
    ports:
      - "127.0.0.1:35432:5432"
    env_file:
      - ./.env
    environment:
      POSTGRES_USER: `${DB_USER:-postgres}
      POSTGRES_PASSWORD: `${DB_PASSWORD:-postgres}
      POSTGRES_DB: `${DB_NAME:-claude_code_hub}
      PGDATA: /data/pgdata
      TZ: Asia/Shanghai
      PGTZ: Asia/Shanghai
    volumes:
      - ./data/postgres:/data
    networks:
      - claude-code-hub-net-$SUFFIX
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U `${DB_USER:-postgres} -d `${DB_NAME:-claude_code_hub}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  redis:
    image: redis:7-alpine
    container_name: claude-code-hub-redis-$SUFFIX
    restart: unless-stopped
    volumes:
      - ./data/redis:/data
    command: redis-server --appendonly yes
    networks:
      - claude-code-hub-net-$SUFFIX
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s

  app:
    image: ghcr.io/ding113/claude-code-hub:$IMAGE_TAG
    container_name: claude-code-hub-app-$SUFFIX
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - ./.env
    environment:
      NODE_ENV: production
      PORT: `${APP_PORT:-$($script:APP_PORT)}
      DSN: postgresql://`${DB_USER:-postgres}:`${DB_PASSWORD:-postgres}@claude-code-hub-db-${SUFFIX}:5432/`${DB_NAME:-claude_code_hub}
      REDIS_URL: redis://claude-code-hub-redis-${SUFFIX}:6379
      AUTO_MIGRATE: `${AUTO_MIGRATE:-true}
      ENABLE_RATE_LIMIT: `${ENABLE_RATE_LIMIT:-true}
      SESSION_TTL: `${SESSION_TTL:-300}
      TZ: Asia/Shanghai
$appPortsSection
    restart: unless-stopped
    networks:
      - claude-code-hub-net-$SUFFIX
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:`${APP_PORT:-$($script:APP_PORT)}/api/actions/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
"@

    # Add Caddy service if enabled
    if ($script:ENABLE_CADDY) {
        $composeContent += @"

  caddy:
    image: caddy:2-alpine
    container_name: claude-code-hub-caddy-$SUFFIX
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      app:
        condition: service_healthy
    networks:
      - claude-code-hub-net-$SUFFIX
"@
    }

    $composeContent += @"

networks:
  claude-code-hub-net-${SUFFIX}:
    driver: bridge
    name: claude-code-hub-net-$SUFFIX
"@

    # Add Caddy volumes if enabled
    if ($script:ENABLE_CADDY) {
        $composeContent += @"

volumes:
  caddy_data:
  caddy_config:
"@
    }
    
    try {
        Set-Content -Path "$DEPLOY_DIR\docker-compose.yaml" -Value $composeContent -Encoding UTF8
        Write-ColorOutput "docker-compose.yaml created" -Type Success
    }
    catch {
        Write-ColorOutput "Failed to write docker-compose.yaml: $_" -Type Error
        exit 1
    }
}

function Write-Caddyfile {
    if (-not $script:ENABLE_CADDY) {
        return
    }

    Write-ColorOutput "Writing Caddyfile..." -Type Info

    if ($script:DOMAIN_ARG) {
        # HTTPS mode with domain (Let's Encrypt automatic)
        $caddyContent = @"
$($script:DOMAIN_ARG) {
    reverse_proxy app:$($script:APP_PORT)
    encode gzip
}
"@
        Write-ColorOutput "Caddyfile created (HTTPS mode with domain: $($script:DOMAIN_ARG))" -Type Success
    }
    else {
        # HTTP-only mode
        $caddyContent = @"
:80 {
    reverse_proxy app:$($script:APP_PORT)
    encode gzip
}
"@
        Write-ColorOutput "Caddyfile created (HTTP-only mode)" -Type Success
    }

    try {
        Set-Content -Path "$DEPLOY_DIR\Caddyfile" -Value $caddyContent -Encoding UTF8
    }
    catch {
        Write-ColorOutput "Failed to write Caddyfile: $_" -Type Error
        exit 1
    }
}

function Write-EnvFile {
    Write-ColorOutput "Writing .env file..." -Type Info

    # Update mode: backup existing .env, then restore custom variables after writing
    $backupFile = $null
    if ($script:UPDATE_MODE -and (Test-Path "$($script:DEPLOY_DIR)\.env")) {
        $backupFile = "$($script:DEPLOY_DIR)\.env.bak"
        Copy-Item "$($script:DEPLOY_DIR)\.env" $backupFile
        Write-ColorOutput "Backed up existing .env to .env.bak" -Type Info
    }
    
    # Determine secure cookies setting based on Caddy and domain
    $secureCookies = "true"
    if ($script:ENABLE_CADDY -and -not $script:DOMAIN_ARG) {
        # HTTP-only Caddy mode - disable secure cookies
        $secureCookies = "false"
    }

    # If domain is set, APP_URL should use https
    $appUrl = ""
    if ($script:DOMAIN_ARG) {
        $appUrl = "https://$($script:DOMAIN_ARG)"
    }
    
    $envContent = @"
# Admin Token (KEEP THIS SECRET!)
ADMIN_TOKEN=$ADMIN_TOKEN

# Database Configuration
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=claude_code_hub

# Application Configuration
APP_PORT=$($script:APP_PORT)
APP_URL=$appUrl

# Auto Migration (enabled for first-time setup)
AUTO_MIGRATE=true

# Redis Configuration
ENABLE_RATE_LIMIT=true

# Session Configuration
SESSION_TTL=300
STORE_SESSION_MESSAGES=false
STORE_SESSION_RESPONSE_BODY=true

# Cookie Security
ENABLE_SECURE_COOKIES=$secureCookies

# Circuit Breaker Configuration
ENABLE_CIRCUIT_BREAKER_ON_NETWORK_ERRORS=false
ENABLE_ENDPOINT_CIRCUIT_BREAKER=false

# Environment
NODE_ENV=production
TZ=Asia/Shanghai
LOG_LEVEL=info
"@
    
    try {
        Set-Content -Path "$DEPLOY_DIR\.env" -Value $envContent -Encoding UTF8

        # Restore user custom variables from backup (variables not managed by this script)
        if ($backupFile -and (Test-Path $backupFile)) {
            $managedKeys = @(
                "ADMIN_TOKEN", "DB_USER", "DB_PASSWORD", "DB_NAME",
                "APP_PORT", "APP_URL", "AUTO_MIGRATE", "ENABLE_RATE_LIMIT",
                "SESSION_TTL", "STORE_SESSION_MESSAGES", "STORE_SESSION_RESPONSE_BODY",
                "ENABLE_SECURE_COOKIES", "ENABLE_CIRCUIT_BREAKER_ON_NETWORK_ERRORS",
                "ENABLE_ENDPOINT_CIRCUIT_BREAKER", "NODE_ENV", "TZ", "LOG_LEVEL"
            )
            $customVars = Get-Content $backupFile | Where-Object {
                if (-not $_ -or -not $_.Trim() -or $_.TrimStart().StartsWith('#')) { return $false }
                $key = ($_ -split '=', 2)[0].Trim()
                return ($managedKeys -notcontains $key)
            }
            if ($customVars -and $customVars.Count -gt 0) {
                $customBlock = "`n# User Custom Configuration (preserved from previous deployment)`n" + ($customVars -join "`n")
                Add-Content -Path "$DEPLOY_DIR\.env" -Value $customBlock -Encoding UTF8
                Write-ColorOutput "Preserved $($customVars.Count) custom environment variables" -Type Info
            }
        }

        # W-015: Restrict .env file permissions (equivalent to chmod 600)
        # Remove inheritance and set owner-only access
        $envFile = "$DEPLOY_DIR\.env"
        $acl = Get-Acl $envFile
        $acl.SetAccessRuleProtection($true, $false)  # Disable inheritance, don't copy existing rules
        $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            $currentUser,
            "FullControl",
            "Allow"
        )
        $acl.SetAccessRule($accessRule)
        Set-Acl -Path $envFile -AclObject $acl

        Write-ColorOutput ".env file created" -Type Success
    }
    catch {
        Write-ColorOutput "Failed to write .env file: $_" -Type Error
        exit 1
    }
}

function Start-Services {
    Write-ColorOutput "Starting Docker services..." -Type Info
    
    try {
        Invoke-Compose -Arguments @("pull")
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to pull Docker images"
        }
        
        Invoke-Compose -Arguments @("up", "-d")
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to start services"
        }

        Write-ColorOutput "Docker services started" -Type Success
    }
    catch {
        Write-ColorOutput "Failed to start services: $_" -Type Error
        exit 1
    }
}

function Wait-ForHealth {
    $appPort = Get-RuntimeAppPort

    if (Wait-ForRuntimeReady -AppPort $appPort) {
        [void](Show-RuntimeProbe -AppPort $appPort)
        return $true
    }

    [void](Show-RuntimeProbe -AppPort $appPort)
    Show-RuntimeFailureLogs
    Write-ColorOutput "Services did not become healthy within $($script:RESTART_TIMEOUT_SECONDS) seconds" -Type Warning
    Write-ColorOutput "You can check the logs with: $(Get-ComposeCommandHint)logs -f" -Type Info
    return $false
}

function Get-NetworkAddresses {
    $addresses = @()
    
    try {
        $adapters = Get-NetIPAddress -AddressFamily IPv4 | 
            Where-Object { 
                $_.InterfaceAlias -notlike '*Loopback*' -and 
                $_.InterfaceAlias -notlike '*Docker*' -and
                $_.IPAddress -notlike '169.254.*'
            }
        
        foreach ($adapter in $adapters) {
            $addresses += $adapter.IPAddress
        }
    }
    catch {
        # Silently continue
    }
    
    $addresses += "localhost"
    return $addresses
}

function Show-SuccessMessage {
    $addresses = Get-NetworkAddresses
    
    Write-Host ""
    Write-Host "+================================================================+" -ForegroundColor Green
    Write-Host "|                                                                |" -ForegroundColor Green
    if ($script:UPDATE_MODE) {
        Write-Host "|          Claude Code Hub Updated Successfully!                |" -ForegroundColor Green
    }
    else {
        Write-Host "|          Claude Code Hub Deployed Successfully!               |" -ForegroundColor Green
    }
    Write-Host "|                                                                |" -ForegroundColor Green
    Write-Host "+================================================================+" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Deployment Directory:" -ForegroundColor Blue
    Write-Host "   $DEPLOY_DIR"
    Write-Host ""
    
    Write-Host "Access URLs:" -ForegroundColor Blue
    if ($script:ENABLE_CADDY) {
        if ($script:DOMAIN_ARG) {
            # HTTPS mode with domain
            Write-Host "   https://$($script:DOMAIN_ARG)" -ForegroundColor Green
        }
        else {
            # HTTP-only Caddy mode
            foreach ($addr in $addresses) {
                Write-Host "   http://${addr}" -ForegroundColor Green
            }
        }
    }
    else {
        # Direct app access
        foreach ($addr in $addresses) {
            Write-Host "   http://${addr}:$($script:APP_PORT)" -ForegroundColor Green
        }
    }
    Write-Host ""

    # In update mode, skip printing the admin token (user already knows it)
    if (-not $script:UPDATE_MODE) {
        Write-Host "Admin Token (KEEP THIS SECRET!):" -ForegroundColor Blue
        Write-Host "   $ADMIN_TOKEN" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "Usage Documentation:" -ForegroundColor Blue
    if ($script:ENABLE_CADDY -and $script:DOMAIN_ARG) {
        Write-Host "   Chinese: https://$($script:DOMAIN_ARG)/zh-CN/usage-doc" -ForegroundColor Green
        Write-Host "   English: https://$($script:DOMAIN_ARG)/en-US/usage-doc" -ForegroundColor Green
    }
    else {
        $firstAddr = $addresses[0]
        $portSuffix = ""
        if (-not $script:ENABLE_CADDY) {
            $portSuffix = ":$($script:APP_PORT)"
        }
        Write-Host "   Chinese: http://${firstAddr}${portSuffix}/zh-CN/usage-doc" -ForegroundColor Green
        Write-Host "   English: http://${firstAddr}${portSuffix}/en-US/usage-doc" -ForegroundColor Green
    }
    Write-Host ""
    
    Write-Host "Useful Commands:" -ForegroundColor Blue
    $composeHint = Get-ComposeCommandHint
    Write-Host "   View logs:     $($composeHint)logs -f" -ForegroundColor Yellow
    Write-Host "   Stop services: $($composeHint)down" -ForegroundColor Yellow
    Write-Host "   Restart:       $($composeHint)restart" -ForegroundColor Yellow

    if ($script:ENABLE_CADDY) {
        Write-Host ""
        Write-Host "Caddy Configuration:" -ForegroundColor Blue
        if ($script:DOMAIN_ARG) {
            Write-Host "   Mode: HTTPS with Let's Encrypt (domain: $($script:DOMAIN_ARG))"
            Write-Host "   Ports: 80 (HTTP redirect), 443 (HTTPS)"
        }
        else {
            Write-Host "   Mode: HTTP-only reverse proxy"
            Write-Host "   Port: 80"
        }
    }

    Write-Host ""
    if (-not $script:UPDATE_MODE) {
        Write-Host "IMPORTANT: Please save the admin token in a secure location!" -ForegroundColor Red
    }
    else {
        Write-Host "NOTE: Your existing secrets and custom configuration have been preserved." -ForegroundColor Blue
    }
    Write-Host ""
}

function Main {
    # Handle help flag first
    if ($Help) {
        Show-Help
        exit 0
    }

    # Initialize parameters from CLI args
    Initialize-Parameters

    Show-Header
    
    if (-not (Test-DockerInstalled)) {
        Show-DockerInstallInstructions
        exit 1
    }

    if ($script:RESTART_MODE -or $script:PROBE_ONLY) {
        $runtimeOk = Invoke-RuntimeMode
        if (-not $runtimeOk) {
            exit 1
        }
        exit 0
    }
    
    Select-Branch

    # Key branch: detect existing deployment
    if (Test-ExistingDeployment) {
        Write-ColorOutput "=== UPDATE MODE ===" -Type Info
        Write-ColorOutput "Updating existing deployment (secrets and custom config will be preserved)" -Type Info
        Get-SuffixFromCompose
        Import-ExistingEnv
    }
    else {
        Write-ColorOutput "=== FRESH INSTALL MODE ===" -Type Info
        New-RandomSuffix
        New-AdminToken
        New-DbPassword
    }
    
    New-DeploymentDirectory
    Write-ComposeFile
    Write-Caddyfile
    Write-EnvFile

    $script:COMPOSE_FILE = Join-Path $script:DEPLOY_DIR "docker-compose.yaml"
    $script:ENV_FILE = Join-Path $script:DEPLOY_DIR ".env"
    
    Start-Services
    
    $isHealthy = Wait-ForHealth
    
    if ($isHealthy) {
        Show-SuccessMessage
    }
    else {
        if ($script:UPDATE_MODE) {
            Write-ColorOutput "Update completed but some services may not be fully healthy yet" -Type Warning
        }
        else {
            Write-ColorOutput "Deployment completed but some services may not be fully healthy yet" -Type Warning
        }
        Write-ColorOutput "Please check the logs: $(Get-ComposeCommandHint)logs -f" -Type Info
        Show-SuccessMessage
    }
}

# Run main function
Main
