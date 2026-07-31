param(
  [string]$Url = "https://yatori-api.hungrym0.com/openapi.json",
  [string]$Secret = $env:YATORI_API_DOC_SECRET,
  [string]$EnvFile,
  [string]$OutputDir = ".tmp/api-docs"
)

$ErrorActionPreference = "Stop"

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory)]
    [string]$Path,
    [Parameter(Mandatory)]
    [string]$Name
  )

  foreach ($line in Get-Content -LiteralPath $Path) {
    $match = [regex]::Match(
      $line,
      '^\s*(?:export\s+)?(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<value>.*)\s*$'
    )
    if (!$match.Success -or $match.Groups['name'].Value -ne $Name) {
      continue
    }

    $value = $match.Groups['value'].Value.Trim()
    if (
      $value.Length -ge 2 -and
      (($value.StartsWith('"') -and $value.EndsWith('"')) -or
       ($value.StartsWith("'") -and $value.EndsWith("'")))
    ) {
      return $value.Substring(1, $value.Length - 2)
    }
    return $value
  }

  return $null
}

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../../../.."))
if (!$EnvFile) {
  $EnvFile = Join-Path $repositoryRoot ".env"
}

if (!$Secret -and (Test-Path -LiteralPath $EnvFile)) {
  $Secret = Get-DotEnvValue -Path $EnvFile -Name "YATORI_API_DOC_SECRET"
}

$resolvedOutputDir = Resolve-Path -LiteralPath "." | ForEach-Object {
  Join-Path $_ $OutputDir
}

if (!(Test-Path -LiteralPath $resolvedOutputDir)) {
  New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$targetPath = Join-Path $resolvedOutputDir "openapi-$timestamp.json"

$hasUrlSecret = $Url -match "([?&])(?:secret|docsSecret)="
if (!$Secret -and !$hasUrlSecret) {
  throw "YATORI_API_DOC_SECRET is required in the environment or repository root .env, or pass -Secret/-Url."
}

$request = @{
  Uri = $Url
  OutFile = $targetPath
}
if ($Secret -and !$hasUrlSecret) {
  $request.Headers = @{ "X-Docs-Secret" = $Secret }
}

Invoke-WebRequest @request

Write-Output "saved=$targetPath"
