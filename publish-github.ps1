# OLOV FOOD — React saytni yig'ib GitHub'ga yuklaydi (Git kerak emas, GitHub CLI yetarli).
#   main tarmog'i   — yig'ilgan (build) tayyor sayt; GitHub Pages shuni ko'rsatadi
#   source tarmog'i — saytning React manba kodi (admin panel manbasi YUKLANMAYDI)
# Ishlatish: powershell -ExecutionPolicy Bypass -File publish-github.ps1 [-Message "O'zgarish tavsifi"] [-Repo OPUS-FOOD]
param(
  [string]$Repo = "OPUS-FOOD",
  [string]$Message = "Saytni yangilash"
)
# "Continue": gh'ning stderr chiqishi PowerShell 5.1'da xato deb to'xtatib qo'ymasligi uchun; xatolar $LASTEXITCODE orqali tekshiriladi
$ErrorActionPreference = "Continue"
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$gh = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }
$root = $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding($false)
$tmp = Join-Path $env:TEMP "opus-food-upload.json"

$owner = (& $gh api user --jq .login).Trim()
if (-not $owner) { throw "GitHub'ga kirilmagan. Avval: gh auth login" }
$full = "$owner/$Repo"

# 1) Saytni yig'amiz
Write-Host "Sayt yig'ilmoqda (vite build)..."
Push-Location $root
& npx.cmd vite build --logLevel error
$built = $LASTEXITCODE -eq 0
Pop-Location
if (-not $built) { throw "Saytni yig'ib bo'lmadi" }
$dist = Join-Path $root "dist"

# 2) Shifrlangan admin panel, README va .nojekyll
$locked = Join-Path $root "admin.locked.html"
if (Test-Path $locked) {
  if (-not (Select-String -Path $locked -Pattern '"v":1,"n":' -SimpleMatch -Quiet)) { throw "admin.locked.html shifrlanmagan ko'rinadi — yuklash to'xtatildi." }
  Copy-Item $locked (Join-Path $dist "admin.html") -Force
} else {
  Write-Warning "admin.locked.html yo'q — saytda admin panel bo'lmaydi. Uni yoqish uchun: lock-admin.ps1 -Publish"
}
Copy-Item (Join-Path $root "README.md") (Join-Path $dist "README.md") -Force
[IO.File]::WriteAllText((Join-Path $dist ".nojekyll"), "", $utf8)

function Get-BlobSha([byte[]]$bytes) {
  $hdr = [Text.Encoding]::ASCII.GetBytes("blob $($bytes.Length)`0")
  $sha1 = [Security.Cryptography.SHA1]::Create()
  return -join ($sha1.ComputeHash([byte[]]($hdr + $bytes)) | ForEach-Object { $_.ToString("x2") })
}

function Ensure-Branch([string]$branch) {
  & $gh api "repos/$full/git/ref/heads/$branch" --silent 2>$null
  if ($LASTEXITCODE -eq 0) { return }
  $mainSha = (& $gh api "repos/$full/git/ref/heads/main" --jq .object.sha).Trim()
  [IO.File]::WriteAllText($tmp, (@{ ref = "refs/heads/$branch"; sha = $mainSha } | ConvertTo-Json -Compress), $utf8)
  & $gh api "repos/$full/git/refs" -X POST --input $tmp --silent
  if ($LASTEXITCODE -ne 0) { throw "$branch tarmog'ini yaratib bo'lmadi" }
  Write-Host "Tarmoq yaratildi: $branch"
}

# Tarmoqdagi fayllarni lokal ro'yxat bilan bir xil qiladi: o'zgarganini yuklaydi, ortiqchasini o'chiradi
function Sync-Branch([string]$branch, [hashtable]$files) {
  Write-Host ""
  Write-Host "== $branch tarmog'i ==" -ForegroundColor Yellow
  $existing = @{}
  try {
    $tree = & $gh api "repos/$full/git/trees/$branch`?recursive=1" | ConvertFrom-Json
    foreach ($t in $tree.tree) { if ($t.type -eq "blob") { $existing[$t.path] = $t.sha } }
  } catch {}
  $up = 0; $del = 0
  foreach ($rel in ($files.Keys | Sort-Object)) {
    $bytes = [IO.File]::ReadAllBytes($files[$rel])
    if ($existing[$rel] -eq (Get-BlobSha $bytes)) { continue }
    $body = @{ message = "$Message`: $rel"; content = [Convert]::ToBase64String($bytes); branch = $branch }
    if ($existing.ContainsKey($rel)) { $body.sha = $existing[$rel] }
    [IO.File]::WriteAllText($tmp, ($body | ConvertTo-Json -Compress), $utf8)
    $path = ($rel -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    & $gh api "repos/$full/contents/$path" -X PUT --input $tmp --silent
    if ($LASTEXITCODE -ne 0) { throw "Yuklanmadi: $rel" }
    $up++
    Write-Host "  yuklandi: $rel"
  }
  foreach ($rel in @($existing.Keys)) {
    if ($files.ContainsKey($rel)) { continue }
    $body = @{ message = "$Message`: $rel o'chirildi"; sha = $existing[$rel]; branch = $branch }
    [IO.File]::WriteAllText($tmp, ($body | ConvertTo-Json -Compress), $utf8)
    $path = ($rel -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    & $gh api "repos/$full/contents/$path" -X DELETE --input $tmp --silent
    if ($LASTEXITCODE -ne 0) { throw "O'chirilmadi: $rel" }
    $del++
    Write-Host "  o'chirildi: $rel"
  }
  Write-Host "$branch`: $up ta fayl yuklandi, $del ta fayl o'chirildi."
}

function Collect([string]$base, [string[]]$include, [string[]]$exclude) {
  $map = @{}
  foreach ($inc in $include) {
    $p = Join-Path $base $inc
    if (-not (Test-Path $p)) { continue }
    $items = if ((Get-Item $p -Force).PSIsContainer) { Get-ChildItem $p -Recurse -File -Force } else { Get-Item $p -Force }
    foreach ($f in $items) {
      $rel = $f.FullName.Substring($base.Length + 1) -replace '\\', '/'
      if ($exclude | Where-Object { $rel -like $_ }) { continue }
      $map[$rel] = $f.FullName
    }
  }
  return $map
}

# 3) main — tayyor sayt
$siteFiles = Collect $dist @(".") @()
Sync-Branch "main" $siteFiles

# 4) source — React manba kodi (admin manbasi, yig'ilgan fayllar va yordamchi papkalarsiz)
Ensure-Branch "source"
$srcInclude = @("src", "public", "index.html", "package.json", "package-lock.json", "vite.config.js", "README.md", ".gitignore", "publish-github.ps1", "lock-admin.ps1")
$srcExclude = @("src/admin/*", "src/styles/admin.css")
$sourceFiles = Collect $root $srcInclude $srcExclude
Sync-Branch "source" $sourceFiles
Remove-Item $tmp -ErrorAction SilentlyContinue

# 5) GitHub Pages (main / root)
& $gh api "repos/$full/pages" --silent 2>$null
if ($LASTEXITCODE -ne 0) {
  [IO.File]::WriteAllText($tmp, '{"source":{"branch":"main","path":"/"}}', $utf8)
  & $gh api "repos/$full/pages" -X POST --input $tmp --silent
  Remove-Item $tmp -ErrorAction SilentlyContinue
}
$url = (& $gh api "repos/$full/pages" --jq .html_url 2>$null)
Write-Host ""
Write-Host "Repo:   https://github.com/$full  (manba kodi: source tarmog'i)"
if ($url) { Write-Host "Sayt:   $url  (1-2 daqiqada yangilanadi)" }
