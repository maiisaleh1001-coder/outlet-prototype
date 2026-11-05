param([string]$Scratch, [string]$Out)
$ErrorActionPreference = 'Stop'
$af = Join-Path $Scratch 'artifact-files\44f285b3-1103-4b3c-a16a-c076fa70c113\project'
$utf8 = New-Object System.Text.UTF8Encoding $false
# canvas artboard -> prototype page (links between artboards are rewritten to these names)
$pages = @(
  @('U06c-Home-Reference.dc.html', 'index.html', 'outlet · الرئيسية'),
  @('U07-Category.dc.html', 'category.html', 'outlet · فساتين'),
  @('U07a-Categories.dc.html', 'categories.html', 'outlet · الأقسام')
)

New-Item -ItemType Directory -Force (Join-Path $Out 'assets') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $Out 'fonts') | Out-Null

$map = [ordered]@{
  'a562e12c89fe0ec9d355bd86ce804687' = @('img3\coat.jpg', 'banner-coat.jpg')
  '504966b45d09937eeada81b732f2b221' = @('img5\dress.jpg', 'dress.jpg')
  'de703db850f57b79578101f2154c8772' = @('img5\shirt.jpg', 'shirt.jpg')
  'daa22da475bb4b44e57d364dcc0d5c08' = @('img5\pants.jpg', 'pants.jpg')
  'fe8f5727b39dcfc42f3a684cface7857' = @('img5\sneakers.jpg', 'sneakers.jpg')
  'cb0d93e90438c4bd0d7b6daaf7ca9b4f' = @('img5\sweater.jpg', 'sweater.jpg')
  '98cf40bd51847362c41ebd26839dcf59' = @('img5\trench.jpg', 'trench.jpg')
  '512d40ccda81f29e7193f44bd2822edb' = @('img4\bag.jpg', 'bag.jpg')
  'f25034e4b13b6ea69f44b3cd323805fb' = @('img6\dress-black.jpg', 'dress-black.jpg')
  '9bf41d72be4fe463a878d02b3bdd7580' = @('img6\dress-green.jpg', 'dress-green.jpg')
  'b87942df371354176ea99ac913a1d058' = @('img6\dress-polka.jpg', 'dress-polka.jpg')
  'c1ed37366ee47f2955f5accde48c7c74' = @('img6\dress-terracotta.jpg', 'dress-terracotta.jpg')
  '6031353edae23690855de7662cc619b2' = @('img6\dress-ivory.jpg', 'dress-ivory.jpg')
  '6ff2f52077bcc2ac6b030c6858f5cded' = @('img6\dress-pink.jpg', 'dress-pink.jpg')
  '0c6822045e8fd422a348d4459bb4def9' = @('img6\dress-pleated.jpg', 'dress-pleated.jpg')
}
foreach ($k in $map.Keys) {
  $from = Join-Path (Join-Path $Scratch 'outlet-canvas') $map[$k][0]
  Copy-Item $from (Join-Path $Out ('assets\' + $map[$k][1])) -Force
}

foreach ($w in 'Regular','Medium','Bold') {
  Copy-Item (Join-Path $af "ds\outlet\fonts\thmanyahsans-$w.otf") (Join-Path $Out "fonts\thmanyahsans-$w.otf") -Force
}

foreach ($pg in $pages) {
$src = [System.IO.File]::ReadAllText((Join-Path $af $pg[0]), [System.Text.Encoding]::UTF8)
foreach ($k in $map.Keys) { $src = $src.Replace('/_blob/' + $k, 'assets/' + $map[$k][1]) }
if ($src -match '/_blob/') { throw "unmapped blob left in $($pg[0])" }
foreach ($p2 in $pages) { $src = $src.Replace('href="' + $p2[0] + '"', 'href="' + $(if ($p2[1] -eq 'index.html') { './' } else { $p2[1] }) + '"') }
$title = $pg[2]
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
<title>$title</title>
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
<script src="app.js"></script>
<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
</script>
</body>
</html>
"@
[System.IO.File]::WriteAllText((Join-Path $Out $pg[1]), $html, $utf8)
}

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

$css += @'
.proto-toast { position: absolute; left: 50%; bottom: 104px; transform: translate(-50%, 12px); max-width: calc(100% - 48px); box-sizing: border-box; padding: 10px 16px; border-radius: 999px; background: #1C1917; color: #FFFFFF; font: 500 13px/20px "Thmanyah Sans", system-ui, sans-serif; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .2s ease, transform .2s ease; z-index: 20; }
.proto-toast.show { opacity: 1; transform: translate(-50%, 0); }
.proto-pop { animation: proto-pop .3s ease; }
.proto-hide { display: none !important; }
.proto-empty { padding: 48px 24px; text-align: center; font: 700 16px/24px "Thmanyah Sans", system-ui, sans-serif; color: #1C1917; }
.proto-empty span { display: block; margin-top: 4px; font-weight: 400; font-size: 13px; line-height: 20px; color: #6B635D; }
@keyframes proto-pop { 50% { transform: scale(1.25); } }
@media (prefers-reduced-motion: reduce) { .proto-toast, .proto-pop { transition: none; animation: none; } }
'@

# Prototype-only behaviour (the canvas stays static): back, favourites, add to cart, toasts for screens not designed yet
$app = @'
(function () {
  var screen = document.querySelector('.screen');
  var toastEl, toastTimer;
  function toast(msg) {
    if (!screen) return;
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'proto-toast'; toastEl.setAttribute('role', 'status'); screen.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function read(key, fallback) { try { var v = sessionStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function write(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

  var cart = read('outlet-cart', 3);
  var favs = read('outlet-favs', {});
  function cartBadges() { return document.querySelectorAll('a[aria-label^="سلة التسوق"] > span'); }
  function paintCart(pop) {
    cartBadges().forEach(function (b) {
      b.textContent = cart;
      b.parentNode.setAttribute('aria-label', 'سلة التسوق، ' + cart + ' قطع');
      if (pop) { b.classList.remove('proto-pop'); void b.offsetWidth; b.classList.add('proto-pop'); }
    });
  }
  function favKey(btn) { var img = btn.parentNode.querySelector('img'); return img ? img.getAttribute('src') : ''; }
  function paintFav(btn, on) {
    var svg = btn.querySelector('svg');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'شيل من المفضلة' : 'أضف للمفضلة');
    if (svg) { svg.setAttribute('fill', on ? '#EA580C' : 'none'); svg.setAttribute('stroke', on ? '#EA580C' : 'currentColor'); }
  }
  paintCart(false);
  document.querySelectorAll('button[aria-label="أضف للمفضلة"]').forEach(function (b) { paintFav(b, !!favs[favKey(b)]); });

  // Search: filters the products and categories on the current screen as you type
  function norm(s) {
    return (s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
  }
  var extra = { 'فساتين': 'فستان', 'قمصان': 'قميص بلوزه', 'بناطيل': 'بنطلون بنطال', 'شنط': 'شنطه حقيبه', 'أحذية': 'حذاء جزمه كوتشي سنيكرز', 'جواكيت': 'جاكيت معطف بالطو' };
  var input = screen && screen.querySelector('input[type="search"]');
  if (input) {
    var items = [];
    document.querySelectorAll('button[aria-label$=" للسلة"]').forEach(function (b) {
      var card = b.closest('div[style*="border-radius: 18px"]');
      if (card) items.push(card);
    });
    screen.querySelectorAll('a').forEach(function (a) {
      if (a.querySelector('img') && !a.closest('nav')) items.push(a);
    });
    items.forEach(function (el) {
      var alts = [].map.call(el.querySelectorAll('img'), function (i) { return i.alt; }).join(' ');
      var txt = el.textContent + ' ' + alts + ' ' + (el.getAttribute('aria-label') || '');
      Object.keys(extra).forEach(function (k) { if (txt.indexOf(k) !== -1) txt += ' ' + extra[k]; });
      el._q = norm(txt);
    });
    var scroller = items.length ? items[0].closest('[style*="overflow-y: auto"]') : null;
    var sections = [].map.call(screen.querySelectorAll('h2'), function (h) { return h.parentNode.parentNode; });
    var gradient = screen.querySelector('[style*="linear-gradient"]');
    var banner = gradient ? gradient.parentNode : null;
    var empty = document.createElement('div');
    empty.className = 'proto-empty proto-hide';
    if (scroller) scroller.appendChild(empty);
    var run = function () {
      var q = norm(input.value), words = q ? q.split(' ') : [], shown = 0;
      items.forEach(function (el) {
        var ok = words.every(function (w) { return el._q.indexOf(w) !== -1; });
        el.classList.toggle('proto-hide', !ok);
        if (ok) shown++;
      });
      sections.forEach(function (s) {
        var has = [].some.call(s.querySelectorAll('*'), function (c) { return items.indexOf(c) !== -1 && !c.classList.contains('proto-hide'); });
        s.classList.toggle('proto-hide', !!q && !has);
      });
      if (banner) banner.classList.toggle('proto-hide', !!q);
      empty.innerHTML = 'مفيش نتايج لـ «' + input.value.replace(/[<>&]/g, '') + '»<span>جرّب كلمة تانية، زي فستان أو شنطة أو جاكيت</span>';
      empty.classList.toggle('proto-hide', !q || shown > 0);
      if (scroller) scroller.scrollTop = 0;
    };
    input.addEventListener('input', run);
    input.addEventListener('search', run);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var back = t.closest('a[aria-label="رجوع"]');
    if (back) {
      var fromHere = false;
      try { fromHere = document.referrer && new URL(document.referrer).origin === location.origin; } catch (err) {}
      if (fromHere && history.length > 1) { e.preventDefault(); history.back(); }
      return;
    }
    var fav = t.closest('button[aria-pressed], button[aria-label="أضف للمفضلة"]');
    if (fav) {
      var key = favKey(fav), on = !favs[key];
      if (on) favs[key] = 1; else delete favs[key];
      write('outlet-favs', favs);
      paintFav(fav, on);
      toast(on ? 'اتضافت للمفضلة' : 'اتشالت من المفضلة');
      return;
    }
    var add = t.closest('button[aria-label^="أضف "][aria-label$=" للسلة"]');
    if (add) {
      cart += 1; write('outlet-cart', cart); paintCart(true);
      toast('اتضافت للسلة');
      return;
    }
    var chip = t.closest('nav[aria-label="التصنيفات"] a');
    if (chip && chip.getAttribute('href').charAt(0) === '#') { e.preventDefault(); toast('القسم ده لسه بيتصمم، جرّب فساتين'); return; }
    var dead = t.closest('a[href^="#"], button');
    if (dead && !dead.closest('label')) { e.preventDefault(); toast('الشاشة دي لسه بتتصمم'); }
  });
})();
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
const CACHE = 'outlet-proto-v3';
const CORE = [
  './',
  './index.html',
  './category.html',
  './categories.html',
  './app.js',
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
- `category.html` — the category product list (فساتين), opened from the home categories
- `styles.css` — device frame and fonts
- `assets/` — placeholder product and campaign photos (AI-generated stand-ins)
- `fonts/` — Thmanyah Sans (licence for client/commercial use still to be confirmed)

No build step: Vercel serves the folder as-is.
'@

[System.IO.File]::WriteAllText((Join-Path $Out 'styles.css'), $css, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'app.js'), $app, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'favicon.svg'), $favicon, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'README.md'), $readme, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'manifest.webmanifest'), $manifest, $utf8)
[System.IO.File]::WriteAllText((Join-Path $Out 'sw.js'), $sw, $utf8)
New-Item -ItemType Directory -Force (Join-Path $Out 'scripts') | Out-Null
Copy-Item $PSCommandPath (Join-Path $Out 'scripts\build-prototype.ps1') -Force
Get-ChildItem $Out -Recurse -File | Select-Object @{n='file';e={$_.FullName.Substring($Out.Length+1)}}, Length | Format-Table -AutoSize | Out-String
