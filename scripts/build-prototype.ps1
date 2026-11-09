param([string]$Scratch, [string]$Out)
$ErrorActionPreference = 'Stop'
$af = Join-Path $Scratch 'artifact-files\44f285b3-1103-4b3c-a16a-c076fa70c113\project'
$utf8 = New-Object System.Text.UTF8Encoding $false
# canvas artboard -> prototype page (links between artboards are rewritten to these names)
$pages = @(
  @('U06c-Home-Reference.dc.html', 'index.html', 'outlet · الرئيسية'),
  @('U07-Category.dc.html', 'category.html', 'outlet · فساتين'),
  @('U07a-Categories.dc.html', 'categories.html', 'outlet · التصنيفات'),
  @('U07d-Search.dc.html', 'search.html', 'outlet · البحث'),
  @('U08-Product.dc.html', 'product.html', 'outlet · تفاصيل المنتج'),
  @('U11-Cart.dc.html', 'cart.html', 'outlet · السلة'),
  @('U12-Checkout.dc.html', 'checkout.html', 'outlet · إتمام الطلب'),
  @('U13-Payment.dc.html', 'payment.html', 'outlet · الدفع'),
  @('U14-Success.dc.html', 'payment-success.html', 'outlet · تم الدفع'),
  @('U14b-Failed.dc.html', 'payment-failed.html', 'outlet · الدفع ما تمش'),
  @('U15-Orders.dc.html', 'orders.html', 'outlet · طلباتي'),
  @('U16-OrderDetails.dc.html', 'order.html', 'outlet · تفاصيل الطلب'),
  @('U17-Report.dc.html', 'report.html', 'outlet · الإبلاغ عن مشكلة'),
  @('U17b-ReportSent.dc.html', 'report-sent.html', 'outlet · وصلنا بلاغك'),
  @('U18-Dispute.dc.html', 'dispute.html', 'outlet · تفاصيل البلاغ'),
  @('U31-Chats.dc.html', 'messages.html', 'outlet · الرسائل'),
  @('U32-Chat.dc.html', 'chat.html', 'outlet · محادثة الطلب'),
  @('U36-EditProfile.dc.html', 'edit-profile.html', 'outlet · البيانات الشخصية'),
  @('U37-Addresses.dc.html', 'addresses.html', 'outlet · العناوين'),
  @('U37b-AddressForm.dc.html', 'address-form.html', 'outlet · عنوان'),
  @('U38-Bank.dc.html', 'bank.html', 'outlet · البيانات البنكية'),
  @('U39-Policies.dc.html', 'policies.html', 'outlet · الشروط والسياسات'),
  @('U39b-Policy.dc.html', 'policy.html', 'outlet · السياسة'),
  @('U40-Settings.dc.html', 'settings.html', 'outlet · الإعدادات'),
  @('U40b-DeleteAccount.dc.html', 'delete-account.html', 'outlet · حذف الحساب'),
  @('U27-Wallet.dc.html', 'wallet.html', 'outlet · المحفظة'),
  @('U28-WalletHistory.dc.html', 'wallet-history.html', 'outlet · سجل العمليات'),
  @('U29-Withdraw.dc.html', 'withdraw.html', 'outlet · طلب سحب'),
  @('U30-Withdrawals.dc.html', 'withdrawals.html', 'outlet · طلبات السحب'),
  @('U21-MyProducts.dc.html', 'my-products.html', 'outlet · منتجاتي'),
  @('U25-Incoming.dc.html', 'incoming.html', 'outlet · الطلبات الواردة'),
  @('U26-IncomingOrder.dc.html', 'incoming-order.html', 'outlet · طلب وارد'),
  @('U42-Support.dc.html', 'support.html', 'outlet · تواصل معنا'),
  @('U22-AddProduct.dc.html', 'add-product.html', 'outlet · إضافة منتج'),
  @('U22c-AddProductSent.dc.html', 'add-product-sent.html', 'outlet · اتبعت للمراجعة'),
  @('U20-SellerSetup.dc.html', 'seller-setup.html', 'outlet · قبل أول بيعة'),
  @('U33-Rate.dc.html', 'rate.html', 'outlet · التقييم'),
  @('U33b-RateSent.dc.html', 'rate-sent.html', 'outlet · شكرًا على تقييمك'),
  @('U10-Favorites.dc.html', 'favorites.html', 'outlet · المفضلة'),
  @('U34-Notifications.dc.html', 'notifications.html', 'outlet · الإشعارات'),
  @('U19-TaxInvoice.dc.html', 'invoice.html', 'outlet · الفاتورة الضريبية'),
  @('U24-EditProduct.dc.html', 'edit-product.html', 'outlet · تعديل المنتج'),
  @('U09-SellerProfile.dc.html', 'seller.html', 'outlet · صفحة البائع'),
  @('U23-ProductStatus.dc.html', 'product-status.html', 'outlet · تفاصيل المنتج'),
  @('U01-Splash.dc.html', 'splash.html', 'outlet'),
  @('O01-Onboarding.dc.html', 'onboarding.html', 'outlet · أهلًا بك'),
  @('U04i-Login-Carousel.dc.html', 'login.html', 'outlet · تسجيل الدخول'),
  @('U02-Register.dc.html', 'register.html', 'outlet · إنشاء حساب'),
  @('U03-OTP.dc.html', 'otp.html', 'outlet · رمز التحقق'),
  @('U05-Forgot.dc.html', 'forgot.html', 'outlet · استعادة كلمة المرور'),
  @('U05b-NewPassword.dc.html', 'new-password.html', 'outlet · كلمة مرور جديدة'),
  @('U03b-AccountCreated.dc.html', 'account-created.html', 'outlet · تم إنشاء الحساب'),
  @('U05c-PasswordChanged.dc.html', 'password-changed.html', 'outlet · تم تغيير كلمة المرور'),
  @('U35c-Account-Modes.dc.html', 'account.html', 'outlet · حسابي')
)
# boards with live DCLogic values ({{name}}) get their first-frame values; their handlers are dropped (app.js drives them)
$tplDefaults = @{ knobX = '0'; knobS = '1'; iconR = '0'; knobTr = 'transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1)'; fillW = '56'; fillTr = 'width 520ms ease'; fadeTr = 'opacity 300ms ease'; label = 'اسحب للبدء'; labelOp = '1'; arrowsOp = '1'; a1 = '0.25'; a2 = '0.25' }
# the filter sheet is designed on its own artboard and injected into the dresses page as a template
$filterSrc = [System.IO.File]::ReadAllText((Join-Path $af 'U07c-Filter.dc.html'), [System.Text.Encoding]::UTF8)
$filterSheet = [regex]::Match($filterSrc, '(?s)<section role="dialog"[^>]*aria-label="فلترة وترتيب".*?</section>').Value
if (-not $filterSheet) { throw 'filter sheet not found in U07c-Filter.dc.html' }

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
  'ba18cb3dd8dc3bbfa3155fd553126d1e' = @('cut\dress-green-cut.png', 'dress-green-cut.png')
  '4c277a9b9cafb6ebb47447ecabe3d521' = @('img7\4c277a9b9cafb6ebb47447ecabe3d521.jpg', 'login-still.jpg')
  'd503dfd2e80f4b7f6971c6d25de5dd9b' = @('img\onb-bag.jpg', 'card-bag-dark.jpg')
  'd76abeb6dfaa30b3771a3448578fecfe' = @('img\login-still.jpg', 'card-still-dark.jpg')
}
# transparent cut-outs for the product page (no colour taken from the platform) and on-model photos when present
Get-ChildItem (Join-Path $Scratch 'outlet-canvas\cut') -Filter '*-cut.png' | ForEach-Object { Copy-Item $_.FullName (Join-Path $Out ('assets\' + $_.Name)) -Force }
$wornDir = Join-Path $Scratch 'outlet-canvas\worn'
if (Test-Path $wornDir) { Get-ChildItem $wornDir -Filter 'worn-*.jpg' | ForEach-Object { Copy-Item $_.FullName (Join-Path $Out ('assets\' + $_.Name)) -Force } }
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
if ($src -match '\{\{') {
  $src = [regex]::Replace($src, '\s+on[A-Za-z]+="\{\{\w+\}\}"', '')
  $src = [regex]::Replace($src, '\{\{(\w+)\}\}', { param($m) if ($tplDefaults.ContainsKey($m.Groups[1].Value)) { $tplDefaults[$m.Groups[1].Value] } else { '' } })
}
foreach ($p2 in $pages) { $src = $src.Replace('href="' + $p2[0] + '"', 'href="' + $(if ($p2[1] -eq 'index.html') { './' } else { $p2[1] }) + '"') }
$src = $src.Replace('href="U35-Account.dc.html"', 'href="account.html"')  # option A link from older boards
$src = $src.Replace('href="U04-Login.dc.html"', 'href="login.html"')  # the carousel login (U04i) replaced the first login board
$title = $pg[2]
$helmet = [regex]::Match($src, '(?s)<helmet>(.*?)</helmet>').Groups[1].Value.Trim()
$body = [regex]::Match($src, '(?s)</helmet>(.*?)</x-dc>').Groups[1].Value.Trim()
$body = $body -replace '^<div style="width: 390px; height: 844px;', '<div class="screen" style="width: 390px; height: 844px;'
$tpl = if ($pg[1] -eq 'category.html') { '<template id="tpl-filter">' + $filterSheet + '</template>' } else { '' }

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
$tpl
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
.proto-spin { width: 40px; height: 40px; box-sizing: border-box; border-radius: 999px; border: 3px solid #FDEBDD; border-top-color: #C2410C; animation: proto-spin .8s linear infinite; }
@keyframes proto-spin { to { transform: rotate(360deg); } }
.proto-count { min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 999px; background: #C2410C; color: #FFFFFF; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.dual { position: relative; height: 28px; }
.dual input[type=range] { position: absolute; left: 0; right: 0; top: 0; width: 100%; height: 28px; margin: 0; background: none; pointer-events: none; -webkit-appearance: none; appearance: none; }
.dual input[type=range]::-webkit-slider-runnable-track { background: none; height: 28px; }
.dual input[type=range]::-moz-range-track { background: none; }
.dual input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 26px; height: 26px; margin-top: 1px; border-radius: 50%; background: #FFFFFF; border: 2px solid #1C1917; box-shadow: 0 2px 8px rgba(28,25,23,0.18); cursor: pointer; }
.dual input[type=range]::-moz-range-thumb { pointer-events: auto; width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; border: 2px solid #1C1917; cursor: pointer; }
@media (prefers-reduced-motion: reduce) { .proto-toast, .proto-pop { transition: none; animation: none; } }
'@

# Prototype-only behaviour (the canvas stays static): back, favourites, add to cart, toasts for screens not designed yet
$app = [System.IO.File]::ReadAllText((Join-Path $Scratch 'proto-app.js'), [System.Text.Encoding]::UTF8)

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
  './search.html',
  './product.html',
  './cart.html',
  './checkout.html',
  './payment.html',
  './payment-success.html',
  './payment-failed.html',
  './orders.html',
  './order.html',
  './account.html',
  './report.html',
  './report-sent.html',
  './dispute.html',
  './messages.html',
  './chat.html',
  './edit-profile.html',
  './addresses.html',
  './address-form.html',
  './bank.html',
  './policies.html',
  './policy.html',
  './settings.html',
  './delete-account.html',
  './wallet.html',
  './wallet-history.html',
  './withdraw.html',
  './withdrawals.html',
  './my-products.html',
  './incoming.html',
  './incoming-order.html',
  './support.html',
  './add-product.html',
  './add-product-sent.html',
  './seller-setup.html',
  './rate.html',
  './rate-sent.html',
  './favorites.html',
  './notifications.html',
  './invoice.html',
  './edit-product.html',
  './seller.html',
  './product-status.html',
  './splash.html',
  './onboarding.html',
  './login.html',
  './register.html',
  './otp.html',
  './forgot.html',
  './new-password.html',
  './account-created.html',
  './password-changed.html',
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
