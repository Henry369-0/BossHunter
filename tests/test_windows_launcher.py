from pathlib import Path
import base64
import ctypes
import json
import os
import shutil
import subprocess
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = REPO_ROOT / "scripts" / "windows" / "start_bosshunter.ps1"
INSTALLER = REPO_ROOT / "scripts" / "windows" / "install_desktop_shortcut.ps1"


class WindowsLauncherTests(unittest.TestCase):
	def test_launcher_is_portable_and_opens_both_services(self):
		text = LAUNCHER.read_text(encoding="utf-8")
		self.assertIn("$PSScriptRoot", text)
		self.assertIn("bosshunter.main", text)
		self.assertIn("$PythonPath", text)
		self.assertIn("Get-Command", text)
		self.assertIn("remote-debugging-port=9222", text)
		self.assertIn("http://127.0.0.1:8686", text)
		self.assertIn("-WindowStyle Hidden", text)
		self.assertNotIn("C:\\Users\\123", text)

	def test_installer_creates_a_shortcut_to_the_launcher(self):
		text = INSTALLER.read_text(encoding="utf-8")
		self.assertIn("CreateShortcut", text)
		self.assertIn("start_bosshunter.ps1", text)
		self.assertIn('GetFolderPath("Desktop")', text)
		self.assertIn("-WindowStyle Hidden", text)
		self.assertNotIn("C:\\Users\\123", text)


def _windows_argv(command_line):
	"""Parse the same joined argument string Windows receives from Start-Process."""
	from ctypes import wintypes
	shell32 = ctypes.WinDLL("shell32", use_last_error=True)
	shell32.CommandLineToArgvW.argtypes = [wintypes.LPCWSTR, ctypes.POINTER(ctypes.c_int)]
	shell32.CommandLineToArgvW.restype = ctypes.POINTER(wintypes.LPWSTR)
	count = ctypes.c_int()
	argv = shell32.CommandLineToArgvW(command_line, ctypes.byref(count))
	if not argv:
		raise ctypes.WinError(ctypes.get_last_error())
	try:
		return [argv[index] for index in range(count.value)]
	finally:
		kernel32 = ctypes.WinDLL("kernel32")
		kernel32.LocalFree.argtypes = [ctypes.c_void_p]
		kernel32.LocalFree(argv)


FIXTURE_SCRIPT = r'''
param([string]$Target, [string]$Mode, [string]$FixtureRoot, [string]$Runner)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$global:fixtureMode = $Mode
$global:fixtureStarted = @()
$global:fixtureRequests = @()
$global:fixtureMessages = @()
$global:fixtureShortcut = $null
$global:fixtureSaved = $false
$global:fixtureFailed = $false
$global:fixtureError = ''
$env:ProgramFiles = Join-Path $FixtureRoot 'Program Files'
${env:ProgramFiles(x86)} = ''
$env:LOCALAPPDATA = Join-Path $FixtureRoot '中文 User With Spaces\AppData\Local'
$fakeChrome = Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
if ($Mode -ne 'skip') {
    $null = Microsoft.PowerShell.Management\New-Item -ItemType Directory -Path (Split-Path $fakeChrome -Parent) -Force
    Set-Content -LiteralPath $fakeChrome -Value ''
}
function Start-Sleep { param($Milliseconds) }
function Write-Host {
    param([Parameter(ValueFromRemainingArguments=$true)]$Object)
    $global:fixtureMessages += ($Object -join ' ')
}
function Start-Process {
    param($FilePath, $ArgumentList, $WorkingDirectory, $WindowStyle, [switch]$PassThru)
    $global:fixtureStarted += [pscustomobject]@{ Path=$FilePath; Arguments=@($ArgumentList); WindowStyle=$WindowStyle }
    if ($PassThru) {
        $global:fixtureWebProcess = [pscustomobject]@{ HasExited=($global:fixtureMode -eq 'exited'); ExitCode=7 }
        return $global:fixtureWebProcess
    }
}
function Invoke-RestMethod {
    param($Uri, $TimeoutSec)
    $global:fixtureRequests += $Uri
    if ($Uri -like '*9222*') {
        if ($global:fixtureMode -eq 'chrome-timeout') { throw 'Chrome unavailable' }
        return @{ Browser='Fixture Chrome' }
    }
    if ($global:fixtureMode -eq 'timeout') { throw 'Workbench unavailable' }
    return @{ status='ok'; version='2.3.0' }
}
function Invoke-WebRequest {
    param($Uri, [switch]$UseBasicParsing, $TimeoutSec)
    $global:fixtureRequests += $Uri
    if ($global:fixtureMode -eq 'timeout') { throw 'Workbench unavailable' }
    $title = if ($global:fixtureMode -eq 'foreign') { 'Unrelated workbench' } else { 'BossHunter Dashboard' }
    if ($global:fixtureMode -eq 'late-exit') { $global:fixtureWebProcess.HasExited = $true }
    return @{ StatusCode=200; Content="<html><title>$title</title></html>" }
}
function New-Object {
    param($ComObject)
    if ($ComObject -ne 'WScript.Shell') { throw 'Unexpected COM request' }
    $shortcut = [pscustomobject]@{ TargetPath=''; Arguments=''; WorkingDirectory=''; Description=''; IconLocation='' }
    $shortcut | Add-Member -MemberType ScriptMethod -Name Save -Value { $global:fixtureSaved = $true }
    $global:fixtureShortcut = $shortcut
    $shell = [pscustomobject]@{}
    $shell | Add-Member -MemberType ScriptMethod -Name CreateShortcut -Value { param($Path); return $global:fixtureShortcut }
    return $shell
}
try {
    if ($Mode -eq 'installer') { & $Target } else { & $Target -PythonPath $Runner -SkipChrome:($Mode -eq 'skip') }
} catch {
    $global:fixtureFailed = $true
    $global:fixtureError = $_.Exception.Message
}
$record = [pscustomobject]@{
    Failed=$global:fixtureFailed; Error=$global:fixtureError;
    Started=@($global:fixtureStarted); Requests=@($global:fixtureRequests); Messages=@($global:fixtureMessages);
    Profile=(Join-Path $env:LOCALAPPDATA 'BossHunterChrome');
    Shortcut=$global:fixtureShortcut; Saved=$global:fixtureSaved; PSHome=$PSHOME; PSEdition=$PSVersionTable.PSEdition
}
$json = $record | ConvertTo-Json -Depth 5 -Compress
[Console]::WriteLine('FIXTURE:' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json)))
if ($global:fixtureFailed) { exit 1 }
'''


@unittest.skipUnless(os.name == "nt", "Windows launcher behavior requires Windows")
class WindowsLauncherBehaviorTests(unittest.TestCase):
	@classmethod
	def setUpClass(cls):
		cls.hosts = list(dict.fromkeys(path for name in ("powershell", "pwsh") if (path := shutil.which(name))))
		if not cls.hosts:
			raise unittest.SkipTest("PowerShell is unavailable")

	def run_fixture(self, mode, host):
		with tempfile.TemporaryDirectory(prefix="bosshunter-launcher-") as directory:
			root = Path(directory)
			harness = root / "fixture.ps1"
			harness.write_text(FIXTURE_SCRIPT, encoding="utf-8-sig")
			runner = root / "fake-python.ps1"
			runner.write_text("$global:LASTEXITCODE = 0\n", encoding="utf-8-sig")
			target = INSTALLER if mode == "installer" else LAUNCHER
			result = subprocess.run(
				[host, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", str(harness),
				 "-Target", str(target), "-Mode", mode, "-FixtureRoot", str(root), "-Runner", str(runner)],
				capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30,
			)
			line = next((line for line in result.stdout.splitlines() if line.startswith("FIXTURE:")), None)
			self.assertIsNotNone(line, result.stdout + result.stderr)
			return result, json.loads(base64.b64decode(line[len("FIXTURE:"):]))

	def test_failed_workbench_does_not_report_ready_or_open_a_dead_page(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("timeout", host)
				self.assertNotEqual(result.returncode, 0)
				self.assertTrue(record["Error"])
				self.assertFalse(any("is ready" in text for text in record["Messages"]))
				self.assertFalse(any("http://127.0.0.1:8686" in process["Arguments"] for process in record["Started"]))

	def test_unrelated_http_200_service_is_not_ready(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("foreign", host)
				self.assertNotEqual(result.returncode, 0)
				self.assertFalse(any("is ready" in text for text in record["Messages"]))

	def test_early_workbench_exit_is_reported(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("exited", host)
				self.assertNotEqual(result.returncode, 0)
				self.assertIn("7", record["Error"])

	def test_chrome_profile_is_one_unicode_argument(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("ready", host)
				self.assertEqual(result.returncode, 0, record["Error"])
				self.assertIn("中文 User With Spaces", record["Profile"])
				chrome = [process for process in record["Started"] if process["Path"].endswith("chrome.exe")]
				self.assertEqual(len(chrome), 2)
				for process in chrome:
					argv = _windows_argv('chrome.exe ' + ' '.join(process["Arguments"]))
					self.assertEqual(argv[1], "--remote-debugging-port=9222")
					self.assertEqual(argv[2], "--user-data-dir=" + record["Profile"])
					self.assertEqual(len(argv), 4)

	def test_workbench_exit_during_probe_never_reports_ready_or_opens_page(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("late-exit", host)
				self.assertNotEqual(result.returncode, 0)
				self.assertIn("7", record["Error"])
				self.assertFalse(any("is ready" in text for text in record["Messages"]))
				self.assertFalse(any("http://127.0.0.1:8686" in process["Arguments"] for process in record["Started"]))

	def test_skip_chrome_can_start_workbench_without_browser(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("skip", host)
				self.assertEqual(result.returncode, 0, record["Error"])
				self.assertEqual(len(record["Started"]), 1)
				self.assertEqual(record["Started"][0]["WindowStyle"], "Hidden")
				self.assertFalse(any("9222" in uri for uri in record["Requests"]))
				self.assertTrue(any("is ready" in text for text in record["Messages"]))

	def test_installer_targets_an_existing_host_in_both_editions(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("installer", host)
				self.assertEqual(result.returncode, 0, record["Error"])
				self.assertTrue(record["Saved"])
				shortcut_host = Path(record["Shortcut"]["TargetPath"])
				self.assertTrue(shortcut_host.is_file(), str(shortcut_host))
				expected = "pwsh.exe" if record["PSEdition"] == "Core" else "powershell.exe"
				self.assertEqual(shortcut_host.name.lower(), expected)

	def test_chrome_timeout_stops_before_workbench_start(self):
		for host in self.hosts:
			with self.subTest(host=host):
				result, record = self.run_fixture("chrome-timeout", host)
				self.assertNotEqual(result.returncode, 0)
				self.assertEqual(len(record["Started"]), 1)
				self.assertFalse(any("is ready" in text for text in record["Messages"]))


if __name__ == "__main__":
	unittest.main()
