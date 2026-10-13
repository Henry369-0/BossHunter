[CmdletBinding()]
param(
	[string]$ShortcutName = "BossHunter"
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Launcher = Join-Path $PSScriptRoot "start_bosshunter.ps1"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "$ShortcutName.lnk"
$HostExecutable = if ($PSVersionTable.PSEdition -eq "Core") { "pwsh.exe" } else { "powershell.exe" }
$PowerShell = Join-Path $PSHOME $HostExecutable
if (-not (Test-Path -LiteralPath $PowerShell -PathType Leaf)) {
	throw "Could not find the current PowerShell host: $PowerShell"
}
$IconPath = Join-Path $RepoRoot "assets\bosshunter.ico"

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $PowerShell
$Shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Launcher`""
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.Description = "Start the BossHunter Chrome profile and local workbench"
if (Test-Path -LiteralPath $IconPath) {
	$Shortcut.IconLocation = "$IconPath,0"
}
$Shortcut.Save()

Write-Host "Created desktop shortcut: $ShortcutPath"
