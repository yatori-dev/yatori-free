param(
  [string]$File = "src/lib/api.ts"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -LiteralPath $File)) {
  throw "File not found: $File"
}

$content = Get-Content -Raw -LiteralPath $File
$patterns = @(
  [regex]"'(/[^']+)'",
  [regex]'"(/[^"]+)"',
  [regex]'`(/[^`]+)`'
)

$paths = foreach ($pattern in $patterns) {
  foreach ($match in $pattern.Matches($content)) {
    $value = $match.Groups[1].Value.Trim()
    if ($value -and !$value.StartsWith('//')) {
      $value
    }
  }
}

$paths = $paths | Sort-Object -Unique

$paths
