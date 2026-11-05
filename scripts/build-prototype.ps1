param([string]$Scratch, [string]$Out)
$ErrorActionPreference = 'Stop'
$af = Join-Path $Scratch 'artifact-files\44f285b3-1103-4b3c-a16a-c076fa70c113\project'
$src = [System.IO.File]::ReadAllText((Join-Path $af 'U06c-Home-Reference.dc.html'), [System.Text.Encoding]::UTF8)

New-Item -ItemType Directory -Force (Join-Path $Out 'assets') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Out 'fonts') | Out-Null

$map = [ordered]@{
  'a562e12c89fe0ec9d355bd86ce804687' = @('img3\coat.jpg', 'banner-coat.jpg')
  '2f9eb8be64d8e7228f59c496a3e037ff' = @('img5\dress.jpg', 'dress.jpg')
  'fb14fa60fc18da751ce8e31dcfddac30' = @('img5\shirt.jpg', 'shirt.jpg')
  'fd8bad367c92206fc7a1419a41e2f86a' = @('img5\pants.jpg', 'pants.jpg')
  'fe8f5727b39dcfc42f3a684cface7857' = @('img5\sneakers.jpg', 'sneakers.jpg')
  '4397f189a88043a43f0c2dbf582f0a8c' = @('img5\sweater.jpg', 'sweater.jpg')
  '93e0ce1ef08d24bc2048e504702dd9aa' = @('img5\trench.jpg', 'trench.jpg')
  '223942797a623099adc6f3ddc4c92dab' = @('img4\bag.jpg', 'bag.jpg')
}
foreach ($k in $map.Keys) {
  $from = Join-Path (Join-Path $Scratch 'outlet-canvas') $map[$k][0]
  Copy-Item $from (Join-Path $Out ('assets\' + $map[$k][1])) -Force
  $src = $src.Replace('/_blob/' + $k, 'assets/' + $map[$k][1])
}
if ($src -match '/_blob/') { throw 'unmapped blob left' }

foreach ($w in 'Regular','Medium','Bold') {
  Copy-Item (Join-Path $af "ds\outlet\fonts\thmanyahsans-$w.otf") (Join-Path $Out "fonts\thmanyahsans-$w.otf") -Force
}

$helmet = [regex]::Match($src, '(?s)<helmet>(.*?)</helmet>').Groups[1].Value.Trim()
$body = [regex]::Match($src, '(?s)</helmet>(.*?)</x-dc>').Groups[1].Value.Trim()
$body = $body -replace '^<div style="width: 390px; height: 844px;', '<div class="screen" style="width: 390px; height: 844px;'

$html = @"
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<title>outlet · الرئيسية</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="outlet">
<script>
(function () {
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone) document.documentElement.classList.add('standalone');
})();
</script>
<link rel="stylesheet" href="styles.css">
$helmet
</head>
<body>
<main class="stage">
<div class="device">
$body
</div>
</main>
<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
</script>
</body>
</html>
"@

$css = @'
@font-face { font-family: "Thmanyah Sans"; src: url("fonts/thmanyahsans-Regular.otf") format("opentype"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Thmanyah Sans"; src: url("fonts/thmanyahsans-Medium.otf") format("opentype"); font-weight: 500; font-display: swap; }
@font-face { font-family: "Thmanyah Sans"; src: url("fonts/thmanyahsans-Bold.otf") format("opentype"); font-weight: 700; font-display: swap; }
* { -webkit-tap-highlight-color: transparent; }
html, body { margin: 0; background: #EFE9E4; }
.stage { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; box-sizing: border-box; }
.device { width: 390px; height: 844px; border-radius: 48px; overflow: hidden; background: #FFFFFF; box-shadow: 0 0 0 10px #1C1917, 0 30px 80px rgba(28,25,23,0.35); }
@media (max-width: 500px), (max-height: 700px) and (max-width: 900px) {
  html, body { background: #FFFFFF; }
  .stage { padding: 0; display: block; }
  .device { width: 100vw; height: 100vh; height: 100dvh; border-radius: 0; box-shadow: none; }
  .device > .screen { width: 100vw !important; height: 100vh !important; height: 100dvh !important; }
}
/* Installed app (opened from the home-screen icon): always edge to edge, full screen height */
html.standalone, html.standalone body { background: #FFFFFF; height: 100%; overflow: hidden; }
html.standalone .stage { padding: 0; display: block; min-height: 0; height: 100%; }
html.standalone .device { width: 100%; height: 100%; border-radius: 0; box-shadow: none; }
html.standalone .device > .screen { width: 100% !important; height: 100% !important; }
@media (display-mode: standalone) {
  html, body { background: #FFFFFF; height: 100%; overflow: hidden; }
  .stage { padding: 0; display: block; min-height: 0; height: 100%; }
  .device { width: 100%; height: 100%; border-radius: 0; box-shadow: none; }
  .device > .screen { width: 100% !important; height: 100% !important; }
}
'@

$manifest = @'
{
  "name": "outlet · سوق الملابس المستعملة",
  "short_name": "outlet",
  "description": "نموذج تفاعلي للشاشة الرئيسية لتطبيق outlet",
  "lang": "ar",
  "dir": "rtl",
  "id": "./",
  "start_url": "./?app=1",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
'@

$assetList = (Get-ChildItem (Join-Path $Out 'assets') -File | ForEach-Object { "  './assets/" + $_.Name + "'," }) -join "`n"
$sw = @"
// Network first, so every push shows up on the next open; the cache is only a fallback for offline.
const CACHE = 'outlet-proto-v1';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './fonts/thmanyahsans-Regular.otf',
  './fonts/thmanyahsans-Medium.otf',
  './fonts/thmanyahsans-Bold.otf',
$assetList
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
"@

# PNG icons (iOS ignores SVG touch icons): orange tile with the white t-shirt mark
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force (Join-Path $Out 'icons') | Out-Null
function New-TeePath([float]$scale, [float]$ox, [float]$oy) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  function P([float]$x, [float]$y) { New-Object System.Drawing.PointF (($ox + $x * $scale), ($oy + $y * $scale)) }
  $pts = @((P 9 3.5), (P 4 5.8), (P 3.6 6.7), (P 4.9 10), (P 5.7 10.4), (P 7 9.9), (P 7 19.5), (P 8 20.5), (P 16 20.5), (P 17 19.5), (P 17 9.9), (P 18.3 10.4), (P 19.1 10), (P 20.4 6.7), (P 20 5.8), (P 15 3.5))
  $p.AddLines([System.Drawing.PointF[]]$pts)
  # neck: quadratic curves converted to cubic
  $p.AddBezier((P 15 3.5), (P 14.4667 4.8333), (P 13.4667 5.5), (P 12 5.5))
  $p.AddBezier((P 12 5.5), (P 10.5333 5.5), (P 9.5333 4.8333), (P 9 3.5))
  $p.CloseFigure()
  return $p
}
function Save-Icon([int]$size, [float]$markRatio, [string]$file) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#EA580C'))
  $markPx = $size * $markRatio
  $scale = $markPx / 17.0
  $ox = ($size - 17.0 * $scale) / 2 - 3.5 * $scale
  $oy = ($size - 17.0 * $scale) / 2 - 3.5 * $scale
  $path = New-TeePath $scale $ox $oy
  $g.FillPath([System.Drawing.Brushes]::White, $path)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($scale * 0.9)
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawPath($pen, $path)
  $g.Dispose()
  $bmp.Save((Join-Path $Out "icons\$file"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Save-Icon 180 0.56 'apple-touch-icon.png'
Save-Icon 192 0.56 'icon-192.png'
Save-Icon 512 0.56 'icon-512.png'
Save-Icon 512 0.42 'icon-512-maskable.png'

$favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#EA580C"/><path d="M24 14 13 19q-1.3.7-.9 2l2.9 7.3q.5 1.3 1.8.9l2.9-1.1v21.3q0 2.2 2.2 2.2h17.8q2.2 0 2.2-2.2V28.1l2.9 1.1q1.3.4 1.8-.9l2.9-7.3q.4-1.3-.9-2L40 14q-1.8 4.4-8 4.4T24 14Z" fill="#fff"/></svg>'

$readme = @'
# outlet · Home prototype

Static, clickable prototype of the outlet home screen (Arabic, RTL), exported from the design canvas.

- `index.html` — the home screen (scrollable inside a phone frame on desktop, full screen on phones)
- `styles.css` — device frame and fonts
- `assets/` — placeholder product and campaign photos (AI-generated stand-ins)
- `fonts/` — Thmanyah Sans (licence for client/commercial use still to be confirmed)

No build step: Vercel serves the folder as-is.
'@

$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $Out 'index.html'), $html, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'styles.css'), $css, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'favicon.svg'), $favicon, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'README.md'), $readme, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'manifest.webmanifest'), $manifest, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'sw.js'), $sw, $utf8)
New-Item -ItemType Directory -Force (Join-Path $Out 'scripts') | Out-Null
Copy-Item $PSCommandPath (Join-Path $Out 'scripts\build-prototype.ps1') -Force
Get-ChildItem $Out -Recurse -File | Select-Object @{n='file';e={$_.FullName.Substring($Out.Length+1)}}, Length | Format-Table -AutoSize | Out-String
