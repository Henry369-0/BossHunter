[CmdletBinding()]
param(
	[switch]$SkipChrome,
	[string]$PythonPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

if ($PythonPath) {
	if (-not (Test-Path -LiteralPath $PythonPath)) {
		throw "Configured Python was not found: $PythonPath"
	}
	$Runner = (Resolve-Path -LiteralPath $PythonPath).Path
	$RunnerPrefix = @("-m", "bosshunter.main")
} else {
	$Bosshunter = Get-Command "bosshunter" -ErrorAction SilentlyContinue
	if ($Bosshunter) {
		$Runner = $Bosshunter.Source
		$RunnerPrefix = @()
	} else {
		$Python = Get-Command "py" -ErrorAction SilentlyContinue
		if (-not $Python) {
			$Python = Get-Command "python" -ErrorAction SilentlyContinue
		}
		if (-not $Python) {
			throw "Could not find BossHunter or Python. Install the project first with: pip install -e ."
		}
		$Runner = $Python.Source
		$RunnerPrefix = @("-m", "bosshunter.main")
	}
}

if (-not $SkipChrome) {
	$ChromeCandidates = @()
	if ($env:ProgramFiles) {
		$ChromeCandidates += Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
	}
	if (${env:ProgramFiles(x86)}) {
		$ChromeCandidates += Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"
	}
	if ($env:LOCALAPPDATA) {
		$ChromeCandidates += Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"
	}
	$ChromeCandidates = $ChromeCandidates | Where-Object { Test-Path -LiteralPath $_ }
	if (-not $ChromeCandidates) {
		throw "Could not find Google Chrome. Install Chrome or use -SkipChrome to start only the local workbench."
	}

	$Chrome = $ChromeCandidates | Select-Object -First 1
	$ChromeProfile = Join-Path $env:LOCALAPPDATA "BossHunterChrome"
	# Start-Process joins ArgumentList; preserve spaces in the profile path for Windows argv parsing.
	$ChromeArguments = @(
		"--remote-debugging-port=9222",
		"--user-data-dir=`"$ChromeProfile`"",
		"https://www.zhipin.com"
	)
	Write-Host "Starting the BossHunter Chrome profile..."
	Start-Process -FilePath $Chrome -ArgumentList $ChromeArguments
	$ChromeReady = $false
	for ($i = 0; $i -lt 20; $i++) {
		Start-Sleep -Milliseconds 500
		try {
			$null = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json/version" -TimeoutSec 2
			$ChromeReady = $true
			break
		} catch {
			# Chrome is still starting.
		}
	}
	if (-not $ChromeReady) {
		throw "Chrome remote debugging did not become ready at http://127.0.0.1:9222. Check that Chrome can use the dedicated profile."
	}

	Write-Host "Starting the Browser Runtime..."
	& $Runner @RunnerPrefix "connect"
	if ($LASTEXITCODE -ne 0) {
		Write-Warning "Browser connection check returned exit code $LASTEXITCODE. The workbench will still be opened."
	}
}

Write-Host "Starting the local workbench..."
$WebArguments = @($RunnerPrefix) + @("web", "--no-open")
$WebProcess = Start-Process -FilePath $Runner -ArgumentList $WebArguments -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru

$WorkbenchReady = $false
$LastWorkbenchError = "The service did not respond."
for ($i = 0; $i -lt 20; $i++) {
	Start-Sleep -Milliseconds 500
	if ($WebProcess.HasExited) {
		throw "The local workbench exited with code $($WebProcess.ExitCode). Run the launcher directly to check the installation and port 8686."
	}
	try {
		$Health = Invoke-RestMethod -Uri "http://127.0.0.1:8686/api/health" -TimeoutSec 2
		if ($Health.status -ne "ok" -or -not $Health.version) {
			throw "Port 8686 did not return a healthy BossHunter response."
		}
		$Page = Invoke-WebRequest -Uri "http://127.0.0.1:8686/" -UseBasicParsing -TimeoutSec 2
		if ($Page.StatusCode -ne 200 -or $Page.Content -notmatch '(?is)<title[^>]*>[^<]*BossHunter[^<]*</title>') {
			throw "Port 8686 did not serve the BossHunter workbench page."
		}
		$WorkbenchReady = $true
		break
	} catch {
		$LastWorkbenchError = $_.Exception.Message
	}
}
if (-not $WorkbenchReady) {
	throw "The local BossHunter workbench did not become ready at http://127.0.0.1:8686. $LastWorkbenchError"
}
if ($WebProcess.HasExited) {
	throw "The local workbench exited with code $($WebProcess.ExitCode) while checking readiness. The workbench page will not be opened."
}

if (-not $SkipChrome) {
	Start-Process -FilePath $Chrome -ArgumentList @(
		"--remote-debugging-port=9222",
		"--user-data-dir=`"$ChromeProfile`"",
		"http://127.0.0.1:8686"
	)
}
if ($WebProcess.HasExited) {
	throw "The local workbench exited with code $($WebProcess.ExitCode) before startup completed."
}

if ($SkipChrome) {
	Write-Host "BossHunter is ready at http://127.0.0.1:8686. Open this address in your browser."
} else {
	Write-Host "BossHunter is ready. Log in manually in the dedicated Chrome window if needed."
}
