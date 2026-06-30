# Crea un nuevo feature folder en specs/NNN-<slug>/ a partir de los templates.
# Uso:  .\create-new-feature.ps1 "Nombre de la feature"
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Name
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  try { (git -C $PSScriptRoot rev-parse --show-toplevel).Trim() }
  catch { (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path }
}

function Convert-ToSlug([string]$s) {
  $lower = $s.ToLowerInvariant()
  $norm  = [Text.NormalizationForm]::FormD
  $clean = ($lower.Normalize($norm).ToCharArray() | Where-Object {
    [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [Globalization.UnicodeCategory]::NonSpacingMark
  }) -join ''
  $kebab = [Regex]::Replace($clean, '[^a-z0-9]+', '-')
  return $kebab.Trim('-')
}

function Get-NextFeatureNumber([string]$dir) {
  if (-not (Test-Path $dir)) { return '001' }
  $last = Get-ChildItem $dir -Directory `
    | Where-Object { $_.Name -match '^(\d{3})-' } `
    | ForEach-Object { [int]($_.Name.Substring(0, 3)) } `
    | Sort-Object | Select-Object -Last 1
  if (-not $last) { return '001' }
  return ('{0:000}' -f ($last + 1))
}

$Root  = Get-RepoRoot
$Specs = Join-Path $Root 'specs'
if (-not (Test-Path $Specs)) { New-Item -ItemType Directory -Path $Specs | Out-Null }

$Num  = Get-NextFeatureNumber $Specs
$Slug = Convert-ToSlug $Name
$Dir  = Join-Path $Specs "$Num-$Slug"

if (Test-Path $Dir) { throw "Ya existe: $Dir" }

New-Item -ItemType Directory -Force -Path (Join-Path $Dir 'checklists') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Dir 'contracts')  | Out-Null

function Render([string]$tpl, [string]$dest) {
  (Get-Content $tpl -Raw) -replace '\{\{FEATURE_NAME\}\}', [Regex]::Escape($Name).Replace('\','') `
    | Set-Content -Path $dest -Encoding utf8
}

$Templates = Join-Path $Root '.specify\templates'
Render (Join-Path $Templates 'spec-template.md')      (Join-Path $Dir 'spec.md')
Render (Join-Path $Templates 'plan-template.md')      (Join-Path $Dir 'plan.md')
Render (Join-Path $Templates 'tasks-template.md')     (Join-Path $Dir 'tasks.md')
Render (Join-Path $Templates 'checklist-template.md') (Join-Path $Dir 'checklists\acceptance.md')

@"
# Quickstart — $Name

Pasos mínimos para validar la feature en local.

``````bash
supabase start && pnpm db:reset
pnpm dev
``````

(Completar con los pasos concretos al implementar.)
"@ | Set-Content (Join-Path $Dir 'quickstart.md') -Encoding utf8

Write-Host "OK $Dir"
