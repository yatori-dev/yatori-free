param(
  [string]$Url = "https://yatori-api.hungrym0.com/openapi.json",
  [string]$Secret = $env:YATORI_API_DOC_SECRET,
  [string]$OutputDir = ".tmp/api-docs"
)

$ErrorActionPreference = "Stop"

$resolvedOutputDir = Resolve-Path -LiteralPath "." | ForEach-Object {
  Join-Path $_ $OutputDir
}

if (!(Test-Path -LiteralPath $resolvedOutputDir)) {
  New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$targetPath = Join-Path $resolvedOutputDir "openapi-$timestamp.json"

if ($Secret -and $Url -notmatch "([?&])secret=") {
  $separator = if ($Url.Contains("?")) { "&" } else { "?" }
  $Url = "$Url${separator}secret=$Secret"
}

if ($Url -notmatch "([?&])secret=") {
  throw "YATORI_API_DOC_SECRET is required, or pass -Url with the secret query parameter."
}

Invoke-WebRequest -Uri $Url -OutFile $targetPath

Write-Output "saved=$targetPath"
