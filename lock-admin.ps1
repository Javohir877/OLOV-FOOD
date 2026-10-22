# OPUS FOOD — admin panelni parol bilan SHIFRLAYDI.
# admin-src/ dagi panelni bitta faylga yig'adi, AES-256 bilan shifrlaydi va ildizdagi admin.html'ga
# faqat parol so'raydigan "eshik" sahifasini yozadi. Parolsiz panelning na ko'rinishi, na kodi ochiladi.
#
# Ishlatish:  powershell -ExecutionPolicy Bypass -File lock-admin.ps1 [-Publish]
#   -Publish   shifrlangandan keyin saytni GitHub'ga ham yuklaydi
# Parol hech qayerga saqlanmaydi. Uni unutsangiz — skriptni qayta ishga tushirib yangi parol qo'ying.
param(
  [switch]$Publish,
  [string]$Password  # faqat avtomatik sinov uchun; odatda bo'sh qoldiring — skript o'zi so'raydi
)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$src = Join-Path $root "admin-src"

if (-not $Password) {
  Write-Host ""
  Write-Host "OPUS FOOD admin paneli uchun parol o'rnatish" -ForegroundColor Yellow
  Write-Host "(kiritayotganingizda belgilar ko'rinmaydi — bu normal)"
  $plain = { param($s) [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
  $a = & $plain (Read-Host "Yangi parol (kamida 8 belgi)" -AsSecureString)
  $b = & $plain (Read-Host "Parolni takrorlang" -AsSecureString)
  if ($a -ne $b) { throw "Parollar bir xil emas. Qaytadan urinib ko'ring." }
  if ($a.Length -lt 8) { throw "Parol kamida 8 belgidan iborat bo'lsin." }
  $Password = $a
}

# 1) Panelni bitta HTML'ga yig'amiz
$utf8 = New-Object Text.UTF8Encoding($false)
$html = [IO.File]::ReadAllText((Join-Path $src "admin.html"), $utf8)
$css = [IO.File]::ReadAllText((Join-Path $src "admin.css"), $utf8)
$js = [IO.File]::ReadAllText((Join-Path $src "admin.js"), $utf8)
$html = $html.Replace("/*INLINE:admin.css*/", $css).Replace("/*INLINE:admin.js*/", $js.Replace("</script", "<\/script"))

# 2) Shifrlash: PBKDF2-SHA256 -> 64 bayt (AES-256 kalit + HMAC kalit), AES-256-CBC, HMAC-SHA256
$iter = 310000
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$salt = New-Object byte[] 16; $rng.GetBytes($salt)
$iv = New-Object byte[] 16; $rng.GetBytes($iv)
$kdf = [Security.Cryptography.Rfc2898DeriveBytes]::new($utf8.GetBytes($Password), $salt, $iter, [Security.Cryptography.HashAlgorithmName]::SHA256)
$keys = $kdf.GetBytes(64)
$encKey = [byte[]]$keys[0..31]
$macKey = [byte[]]$keys[32..63]

$aes = [Security.Cryptography.Aes]::Create()
$aes.Mode = [Security.Cryptography.CipherMode]::CBC
$aes.Padding = [Security.Cryptography.PaddingMode]::PKCS7
$aes.Key = $encKey
$aes.IV = $iv
$plainBytes = $utf8.GetBytes($html)
$ct = $aes.CreateEncryptor().TransformFinalBlock($plainBytes, 0, $plainBytes.Length)
$hmac = [Security.Cryptography.HMACSHA256]::new($macKey)
$mac = $hmac.ComputeHash([byte[]]($iv + $ct))

$payload = '{"v":1,"n":' + $iter + ',"s":"' + [Convert]::ToBase64String($salt) + '","i":"' + [Convert]::ToBase64String($iv) +
  '","m":"' + [Convert]::ToBase64String($mac) + '","c":"' + [Convert]::ToBase64String($ct) + '"}'

# 3) "Eshik" sahifasi — parol so'raydi, brauzerning o'zida ochadi (WebCrypto)
$gate = @'
<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OPUS FOOD</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0C0A09">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#F7F0EA;
    background:radial-gradient(700px 500px at 80% -10%,rgba(255,90,26,.18),transparent 60%),#0C0A09}
  .box{width:min(380px,100%);padding:34px 28px;border-radius:26px;display:grid;gap:14px;text-align:center;
    background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09);box-shadow:0 24px 60px -24px #000}
  .logo{width:60px;height:60px;margin:0 auto;border-radius:18px;display:grid;place-items:center;font-size:28px;
    background:linear-gradient(135deg,#FF9A2E,#FF5A1A 50%,#E8320A);box-shadow:0 14px 36px -12px rgba(255,90,26,.7)}
  h1{margin:4px 0 0;font-size:24px}
  p{margin:0;color:#9C918A;font-size:14px}
  input{height:48px;padding:0 14px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);color:inherit;font:inherit;outline:0}
  input:focus{border-color:#FF5A1A;box-shadow:0 0 0 3px rgba(255,90,26,.18)}
  button{height:48px;border:0;border-radius:12px;font:inherit;font-weight:700;color:#fff;cursor:pointer;
    background:linear-gradient(135deg,#FF9A2E,#FF5A1A 50%,#E8320A);box-shadow:0 14px 36px -14px rgba(255,90,26,.8)}
  button[disabled]{opacity:.6;cursor:wait}
  .err{color:#FF7A7A;font-weight:600;min-height:1em}
  a{color:#9C918A;text-decoration:none;font-size:14px} a:hover{color:#F7F0EA}
  .shake{animation:s .4s}@keyframes s{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
</style>
</head>
<body>
<form class="box" id="gate">
  <div class="logo">🔒</div>
  <h1>Yopiq bo'lim</h1>
  <p>Bu sahifa faqat sayt egasi uchun.</p>
  <input type="password" id="pass" placeholder="Parol" autocomplete="current-password" required>
  <p class="err" id="err"></p>
  <button id="go">Ochish</button>
  <a href="./">← Saytga qaytish</a>
</form>
<script>
(() => {
  const D = __PAYLOAD__;
  const KEY = "opus_gate";
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (u) => btoa(String.fromCharCode.apply(null, u));
  const form = document.getElementById("gate"), err = document.getElementById("err"), go = document.getElementById("go");

  async function unlock(bits) {
    const iv = b64(D.i), ct = b64(D.c);
    const data = new Uint8Array(iv.length + ct.length); data.set(iv); data.set(ct, iv.length);
    const mk = await crypto.subtle.importKey("raw", bits.slice(32), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!(await crypto.subtle.verify("HMAC", mk, b64(D.m), data))) return false;
    const ek = await crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-CBC", false, ["decrypt"]);
    const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-CBC", iv }, ek, ct));
    try { sessionStorage.setItem(KEY, toB64(bits)); } catch (e) { /* sessiya saqlanmaydi */ }
    document.open(); document.write(html); document.close();
    return true;
  }

  if (!window.crypto || !crypto.subtle) {
    err.textContent = "Xavfsiz ulanish (https) kerak.";
    go.disabled = true;
    return;
  }

  // Shu oynada avval ochilgan bo'lsa — qayta parol so'ramaymiz
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      form.style.visibility = "hidden";
      const fail = () => { sessionStorage.removeItem(KEY); form.style.visibility = ""; };
      unlock(b64(saved)).then((ok) => { if (!ok) fail(); }).catch(fail);
    }
  } catch (e) { /* */ }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    go.disabled = true; go.textContent = "Tekshirilmoqda...";
    try {
      const pass = new TextEncoder().encode(document.getElementById("pass").value);
      const base = await crypto.subtle.importKey("raw", pass, "PBKDF2", false, ["deriveBits"]);
      const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: b64(D.s), iterations: D.n }, base, 512));
      if (await unlock(bits)) return;
    } catch (x) { /* noto'g'ri parol */ }
    err.textContent = "Parol noto'g'ri";
    go.disabled = false; go.textContent = "Ochish";
    form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
    document.getElementById("pass").select();
  });
})();
</script>
</body>
</html>
'@

$out = Join-Path $root "admin.html"
[IO.File]::WriteAllText($out, $gate.Replace("__PAYLOAD__", $payload), $utf8)
$Password = $null; $a = $null; $b = $null
Write-Host ""
Write-Host "Admin panel shifrlandi: admin.html ($([math]::Round((Get-Item $out).Length / 1KB)) KB)" -ForegroundColor Green

if ($Publish) {
  Write-Host "GitHub'ga yuklanmoqda..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "publish-github.ps1") -Message "Admin panel parolini yangilash"
}
