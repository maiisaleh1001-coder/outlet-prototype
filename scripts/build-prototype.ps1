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
.proto-sheet-wrap { position: absolute; inset: 0; z-index: 30; }
.proto-backdrop { position: absolute; inset: 0; background: rgba(28,25,23,0.45); opacity: 0; transition: opacity .25s ease; }
.proto-sheet { position: absolute; left: 0; right: 0; bottom: 0; transform: translateY(100%); transition: transform .32s cubic-bezier(.2,.8,.2,1); }
.proto-sheet-wrap.open .proto-backdrop { opacity: 1; }
.proto-sheet-wrap.open .proto-sheet { transform: translateY(0); }
.proto-sheet.dragging { transition: none; }
.proto-toast { z-index: 40; }
@media (prefers-reduced-motion: reduce) { .proto-backdrop, .proto-sheet { transition: none; } }
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

  // Quick-add bottom sheet: opened by the + on any product card
  var sellers = [['خزانة لمى', '4.9', 'الرياض', 38], ['دولاب سارة', '4.8', 'جدة', 21], ['ركن هند', '5.0', 'الدمام', 54], ['ستايل نوف', '4.7', 'الخبر', 12]];
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  var ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>';
  var ICON_CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 19.92L8.48 13.4c-.77-.77-.77-2.03 0-2.8L15 4.08"></path></svg>';
  var ICON_HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"></path></svg>';
  var ICON_BAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 7.67V6.7c0-2.25 1.81-4.46 4.06-4.67a4.5 4.5 0 0 1 4.94 4.48v1.38M9 22h6c4.02 0 4.74-1.61 4.95-3.57l.75-6C20.97 9.99 20.27 8 16 8H8c-4.27 0-4.97 1.99-4.7 4.43l.75 6C4.26 20.39 4.98 22 9 22Z"></path></svg>';
  var ICON_SHIELD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none"><path d="M10.49 2.23 5.5 4.11c-1.15.43-2.09 1.79-2.09 3.01v7.43c0 1.18.78 2.73 1.73 3.44l4.3 3.21c1.41 1.06 3.73 1.06 5.14 0l4.3-3.21c.95-.71 1.73-2.26 1.73-3.44V7.12c0-1.23-.94-2.59-2.09-3.02l-4.99-1.87c-.85-.31-2.21-.31-3.04 0Z"></path><path d="m9.05 11.87 1.61 1.61 4.3-4.3"></path></svg>';
  var sheetOpen = null;
  function openSheet(card, opener) {
    if (!screen || sheetOpen) return;
    var img = card.querySelector('img');
    var nameEl = card.querySelector('span[style*="ellipsis"]');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var priceEl = card.querySelector('span[style*="font-size: 16px"]');
    var oldEl = card.querySelector('s');
    var badge = [].filter.call(card.querySelectorAll('span'), function (s) { return /^خصم/.test(s.textContent.trim()); })[0];
    var h = hash(name);
    var size = /حذاء/.test(name) ? '40' : /شنط/.test(name) ? 'مقاس واحد' : ['S', 'M', 'L'][h % 3];
    var cond = ['ممتازة', 'كالجديدة', 'ممتازة', 'جيدة جدًا'][h % 4];
    var sel = sellers[h % sellers.length];
    var src = img ? img.getAttribute('src') : '', alt = img ? img.alt : name;
    function slide(tf, origin) {
      return '<div style="flex: none; width: 232px; height: 296px; border-radius: 18px; background: #F7F3F0; overflow: hidden; scroll-snap-align: start"><img src="' + src + '" alt="' + alt + '" style="width: 100%; height: 100%; object-fit: contain; transform: ' + tf + '; transform-origin: ' + origin + '; mix-blend-mode: multiply"></div>';
    }
    var price = priceEl ? priceEl.outerHTML.replace('font-size: 16px', 'font-size: 24px').replace('gap: 4px', 'gap: 5px').replace('width="12" height="13"', 'width="17" height="19"').replace(/color: #[0-9A-F]{6}/i, 'color: #1C1917') : '';
    var old = oldEl ? oldEl.outerHTML.replace('font-size: 12px', 'font-size: 14px').replace('width="9" height="10"', 'width="11" height="12"') : '';
    var off = badge ? '<span style="height: 24px; padding: 0 9px; border-radius: 999px; background: #C2410C; color: #FFFFFF; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center">' + badge.textContent.trim() + '</span>' : '';
    var on = !!favs[src];
    var wrap = document.createElement('div');
    wrap.className = 'proto-sheet-wrap';
    wrap.innerHTML =
      '<div class="proto-backdrop" data-act="close"></div>' +
      '<section class="proto-sheet" role="dialog" aria-modal="true" aria-label="إضافة سريعة: ' + name + '" style="max-height: 86%; box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; font-family: inherit; color: #1C1917">' +
        '<div class="proto-grab" style="flex: none; position: relative; height: 40px; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: grab">' +
          '<span aria-hidden="true" style="width: 40px; height: 5px; border-radius: 999px; background: #E7DED6"></span>' +
          '<button type="button" data-act="close" aria-label="إغلاق" style="position: absolute; top: 6px; left: 10px; width: 40px; height: 40px; border: 0; border-radius: 999px; background: transparent; color: #1C1917; display: flex; align-items: center; justify-content: center; padding: 0">' + ICON_CLOSE + '</button>' +
        '</div>' +
        '<div class="noscroll" style="flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-bottom: 8px">' +
          '<div class="noscroll" style="display: flex; gap: 8px; overflow-x: auto; padding: 0 18px; scroll-snap-type: x mandatory">' + slide('scale(1.05)', '50% 50%') + slide('scale(2.1)', '50% 28%') + slide('scale(2)', '50% 88%') + '</div>' +
          '<div style="display: flex; flex-direction: column; gap: 14px; padding: 0 18px">' +
            '<div style="display: flex; align-items: center; gap: 12px"><h2 style="flex: 1; min-width: 0; margin: 0; font-size: 18px; line-height: 26px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">' + name + '</h2>' +
            '<a href="#product" data-act="soon" style="flex: none; display: flex; align-items: center; gap: 2px; font-size: 13px; font-weight: 500; color: #6B635D; text-decoration: none; padding: 8px 0">التفاصيل' + ICON_CHEV + '</a></div>' +
            '<div style="display: flex; align-items: center; gap: 10px">' + price + old + off + '</div>' +
            '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">' +
              '<div style="background: #F7F3F0; border-radius: 14px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; line-height: 16px; color: #6B635D">المقاس</span><span style="font-size: 15px; line-height: 22px; font-weight: 700">' + size + '</span></div>' +
              '<div style="background: #F7F3F0; border-radius: 14px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; line-height: 16px; color: #6B635D">الحالة</span><span style="font-size: 15px; line-height: 22px; font-weight: 700">' + cond + '</span></div>' +
            '</div>' +
            '<a href="#seller" data-act="soon" style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #EFE6DE; border-bottom: 1px solid #EFE6DE; text-decoration: none; color: #1C1917">' +
              '<span aria-hidden="true" style="width: 40px; height: 40px; flex: none; border-radius: 999px; background: #FDEBDD; color: #9A3412; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center">' + sel[0].split(' ').pop().charAt(0) + '</span>' +
              '<span style="flex: 1; display: flex; flex-direction: column"><span style="font-size: 14px; line-height: 20px; font-weight: 700">' + sel[0] + '</span><span style="font-size: 12px; line-height: 16px; color: #6B635D">★ ' + sel[1] + ' · ' + sel[2] + ' · ' + sel[3] + ' قطعة مباعة</span></span>' +
              '<span style="color: #6B635D; display: flex">' + ICON_CHEV + '</span></a>' +
            '<p style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 18px; color: #6B635D">' + ICON_SHIELD + 'قطعة واحدة متاحة، والمبلغ محفوظ حتى استلامها</p>' +
          '</div>' +
        '</div>' +
        '<div style="flex: none; display: flex; align-items: center; gap: 12px; padding: 12px 18px 28px; border-top: 1px solid #EFE6DE; background: #FFFFFF">' +
          '<button type="button" data-act="fav" aria-pressed="' + on + '" aria-label="' + (on ? 'شيل من المفضلة' : 'أضف للمفضلة') + '" style="width: 52px; height: 52px; flex: none; border: 1px solid #EFE6DE; border-radius: 999px; background: #FFFFFF; color: ' + (on ? '#EA580C' : '#1C1917') + '; display: flex; align-items: center; justify-content: center; padding: 0">' + ICON_HEART + '</button>' +
          '<button type="button" data-act="add" style="flex: 1; height: 52px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px">' + ICON_BAG + 'أضف للسلة</button>' +
        '</div>' +
      '</section>';
    screen.appendChild(wrap);
    var sheet = wrap.querySelector('.proto-sheet');
    var favBtn = wrap.querySelector('[data-act="fav"]');
    if (on) favBtn.querySelector('svg').setAttribute('fill', '#EA580C');
    sheetOpen = { wrap: wrap, opener: opener };
    void wrap.offsetHeight; // commit the closed state so the slide-up transition runs
    wrap.classList.add('open');
    wrap.querySelector('[data-act="close"][aria-label]').focus({ preventScroll: true });

    wrap.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'close') closeSheet();
      else if (act === 'soon') { e.preventDefault(); toast('الشاشة دي لسه بتتصمم'); }
      else if (act === 'fav') {
        var now = !favs[src];
        if (now) favs[src] = 1; else delete favs[src];
        write('outlet-favs', favs);
        b.setAttribute('aria-pressed', now ? 'true' : 'false');
        b.setAttribute('aria-label', now ? 'شيل من المفضلة' : 'أضف للمفضلة');
        b.style.color = now ? '#EA580C' : '#1C1917';
        b.querySelector('svg').setAttribute('fill', now ? '#EA580C' : 'none');
        var cardFav = card.querySelector('button[aria-label="أضف للمفضلة"], button[aria-pressed]');
        if (cardFav) paintFav(cardFav, now);
        toast(now ? 'اتضافت للمفضلة' : 'اتشالت من المفضلة');
      } else if (act === 'add') {
        cart += 1; write('outlet-cart', cart);
        closeSheet();
        setTimeout(function () { paintCart(true); toast('اتضافت للسلة'); }, 200);
      }
    });

    // drag the handle down to close
    var grab = wrap.querySelector('.proto-grab'), startY = null, dy = 0;
    grab.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      startY = e.clientY; dy = 0; sheet.classList.add('dragging'); grab.setPointerCapture(e.pointerId);
    });
    grab.addEventListener('pointermove', function (e) {
      if (startY === null) return;
      dy = Math.max(0, e.clientY - startY); sheet.style.transform = 'translateY(' + dy + 'px)';
    });
    function endDrag() {
      if (startY === null) return;
      startY = null; sheet.classList.remove('dragging'); sheet.style.transform = '';
      if (dy > 90) closeSheet();
    }
    grab.addEventListener('pointerup', endDrag);
    grab.addEventListener('pointercancel', endDrag);
  }
  function closeSheet() {
    if (!sheetOpen) return;
    var s = sheetOpen; sheetOpen = null;
    s.wrap.classList.remove('open');
    setTimeout(function () { s.wrap.remove(); }, 320);
    if (s.opener) s.opener.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

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
      var card = add.closest('div[style*="border-radius: 18px"]');
      if (card) openSheet(card, add);
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
