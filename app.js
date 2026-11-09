// outlet prototype behaviour (prototype only; the design canvas stays static).
// Back, favourites, cart count, quick-add sheet, product page, filter + sort, search, toasts.
(function () {
  var screen = document.querySelector('.screen');
  var page = (location.pathname.split('/').pop() || 'index.html').replace(/\?.*$/, '') || 'index.html';

  // ---------- small helpers ----------
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
  // ---------- first launch + auth: splash → onboarding → login / register / guest ----------
  // the home page sends a fresh visit (one per browser tab) through the splash first
  if (page === 'index.html' && !read('outlet-intro-seen', false) && !/[?&]skip/.test(location.search)) { write('outlet-intro-seen', true); location.replace('splash.html'); return; }
  // demo build: forms come filled so a click-through never stops on an empty field
  var demoFill = function (el, v) { if (el && !el.value) el.value = v; };
  var goHome = function (as, msg) { write('outlet-intro-seen', true); write('outlet-auth', as); if (msg) write('outlet-flash-home', msg); location.href = './'; };
  if (page === 'index.html') { var fh = read('outlet-flash-home', ''); if (fh) { write('outlet-flash-home', ''); setTimeout(function () { toast(fh); }, 400); } }
  if (page === 'splash.html') {
    write('outlet-intro-seen', true);
    setTimeout(function () { location.replace('login.html'); }, 2400); // long enough for the wordmark animation to land
    screen.addEventListener('click', function () { location.replace('login.html'); });
  }
  if (page === 'onboarding.html') {
    var obKnob = screen.querySelector('button[aria-label^="السحب"]');
    if (obKnob) {
      var obTrack = obKnob.parentElement, obMax = 278, obDx = 0, obStart = 0, obDrag = false, obMoved = false;
      var obFill = [].filter.call(obTrack.children, function (c) { return /width: 56px/.test(c.getAttribute('style') || ''); })[0];
      var obLabel = [].filter.call(obTrack.querySelectorAll('span, div'), function (c) { return c.textContent.trim() === 'اسحب للبدء'; })[0];
      var obPaint = function (anim) {
        obKnob.style.transition = anim ? 'transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
        obKnob.style.transform = 'translateX(' + obDx + 'px)';
        if (obFill) { obFill.style.transition = anim ? 'width 520ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'; obFill.style.width = (56 + Math.abs(obDx)) + 'px'; }
        if (obLabel) obLabel.style.opacity = Math.max(0, 1 - Math.abs(obDx) / obMax * 1.8);
      };
      var obFinish = function () { obDx = -obMax; obPaint(true); if (obLabel) { obLabel.textContent = 'أهلًا بك في outlet'; obLabel.style.opacity = 1; } setTimeout(function () { goHome('guest'); }, 650); };
      obKnob.addEventListener('pointerdown', function (e) { obKnob.setPointerCapture(e.pointerId); obStart = e.clientX; obDrag = true; obMoved = false; });
      obKnob.addEventListener('pointermove', function (e) { if (!obDrag) return; var d = e.clientX - obStart; if (Math.abs(d) > 4) obMoved = true; obDx = Math.max(-obMax, Math.min(0, d)); obPaint(false); });
      var obUp = function () { if (!obDrag) return; obDrag = false; if (Math.abs(obDx) >= obMax * 0.8) obFinish(); else { obDx = 0; obPaint(true); } };
      obKnob.addEventListener('pointerup', obUp); obKnob.addEventListener('pointercancel', obUp);
      obKnob.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (!obMoved) obFinish(); obMoved = false; });
    }
  }
  if (page === 'login.html') {
    screen.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#home"]'); if (!a) return;
      e.preventDefault(); e.stopPropagation();
      if (/زائر/.test(a.textContent)) return goHome('guest');
      var ph = (screen.querySelector('#phone') || {}).value || '', pw = (screen.querySelector('#pass') || {}).value || '';
      if (ph.replace(/\D/g, '').length !== 9) return toast('رقم الجوال غير صحيح');
      if (pw.length < 8) return toast('كلمة المرور غير صحيحة');
      goHome('user', 'أهلًا بك من جديد');
    }, true);
  }
  if (page === 'register.html') {
    screen.addEventListener('click', function (e) {
      var lk = e.target.closest('a[href="#terms"], a[href="#privacy"]');
      if (lk) { e.preventDefault(); e.stopPropagation(); location.href = 'policies.html'; return; }
      var a = e.target.closest('a[href="otp.html"]'); if (!a) return;
      var q = function (s) { return screen.querySelector(s); };
      var err = !q('#name').value.trim() ? 'الاسم مطلوب' : q('#phone').value.replace(/\D/g, '').length !== 9 ? 'رقم الجوال غير صحيح'
        : !/^(?=.*\d)(?=.*[A-Za-z؀-ۿ]).{8,}$/.test(q('#pass').value) ? 'كلمة المرور 8 أحرف على الأقل وفيها حرف ورقم'
        : q('#pass2').value !== q('#pass').value ? 'كلمتا المرور غير متطابقتين' : !q('#terms').checked ? 'الموافقة على الشروط مطلوبة' : '';
      if (err) { e.preventDefault(); e.stopPropagation(); toast(err); return; }
      write('outlet-otp-for', 'register');
    }, true);
    // demo build: the form arrives filled in, so one tap goes through
  }
  if (page === 'otp.html') {
    var otpIns = [].slice.call(screen.querySelectorAll('input[inputmode="numeric"]')), otpBtn = screen.querySelector('button[disabled], button');
    var otpPaint = function () { var full = otpIns.every(function (i) { return /^\d$/.test(i.value); }); if (otpBtn) { otpBtn.disabled = !full; otpBtn.style.opacity = full ? '1' : ''; } };
    otpIns.forEach(function (inp, i) {
      inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && otpIns[i + 1]) otpIns[i + 1].focus(); otpPaint(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && otpIns[i - 1]) otpIns[i - 1].focus(); });
    });
    otpPaint();
    if (otpBtn) otpBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var code = otpIns.map(function (i) { return i.value; }).join('');
      if (code.length !== 4) return toast('رمز التحقق 4 أرقام');
      location.href = 'account-created.html';
    }, true);
  }
  if (page === 'new-password.html') {
    var np = screen.querySelector('#np'), np2 = screen.querySelector('#np2'), npErr = screen.querySelector('#np2-err');
    if (np2 && np) { np2.value = np.value; np2.setAttribute('aria-invalid', 'false'); }
    if (npErr) npErr.style.display = 'none';
    screen.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="password-changed.html"]'); if (!a) return;
      if (np.value.length < 8 || !/\d/.test(np.value)) { e.preventDefault(); e.stopPropagation(); toast('كلمة المرور 8 أحرف على الأقل وفيها حرف ورقم'); return; }
      if (np2.value !== np.value) { e.preventDefault(); e.stopPropagation(); if (npErr) npErr.style.display = ''; return; }
    }, true);
  }
  // success screens: the bar fills (CSS, 0.4s + 3s), then the flow carries on; the button skips the wait
  if (page === 'account-created.html' || page === 'password-changed.html') {
    var doneNext = page === 'account-created.html' ? function () { goHome('user'); } : function () { location.replace('login.html'); };
    var doneT = setTimeout(doneNext, 3400);
    screen.addEventListener('click', function (e) {
      if (!e.target.closest('[data-done-go]')) return;
      e.preventDefault(); e.stopPropagation(); clearTimeout(doneT); doneNext();
    }, true);
  }
  if (page === 'login.html') { var fl = read('outlet-flash-login', ''); if (fl) { write('outlet-flash-login', ''); setTimeout(function () { toast(fl); }, 400); } }

  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function norm(s) {
    return (s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- cart + favourites ----------
  var RIYAL_PATHS = '<path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path>';
  function riyal(w, h) { return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 1124.14 1256.39" fill="currentColor" role="img" aria-label="ريال سعودي">' + RIYAL_PATHS + '</svg>'; }
  function pieces(n) { return n === 1 ? 'قطعة واحدة' : n === 2 ? 'قطعتين' : n <= 10 ? n + ' قطع' : n + ' قطعة'; }
  var SELLERS = [['خزانة لمى', '4.9', 'الرياض', 38], ['دولاب سارة', '4.8', 'جدة', 21], ['ركن هند', '5.0', 'الدمام', 54], ['ستايل نوف', '4.7', 'الخبر', 12]];
  // The cart holds real items. One seller per cart (BRD). First visit starts with the three pieces shown in the design.
  var cart = read('outlet-cart-v2', null);
  if (!cart) {
    cart = [
      { src: 'assets/dress-pleated.jpg', alt: 'فستان شيفون وردي بليسيه بأكمام طويلة', name: 'فستان بليسيه طويل', size: 'L', cond: 'ممتازة', priceNum: 210, oldNum: 0, seller: SELLERS[0] },
      { src: 'assets/dress-green.jpg', alt: 'فستان كتان أخضر هادئ بتصميم لف وأكمام قصيرة', name: 'فستان لف أخضر', size: 'S', cond: 'ممتازة', priceNum: 145, oldNum: 220, seller: SELLERS[0] },
      { src: 'assets/sweater.jpg', alt: 'كنزة صوف كريمي بألوان كحلي وأحمر', name: 'كنزة صوف ملونة', size: 'M', cond: 'ممتازة', priceNum: 98, oldNum: 0, seller: SELLERS[0] }
    ];
  }
  var favs = read('outlet-favs', {});
  function saveCart() { write('outlet-cart-v2', cart); }
  function paintCart(pop) {
    document.querySelectorAll('a[aria-label^="سلة التسوق"] > span').forEach(function (b) {
      b.textContent = cart.length;
      b.style.display = cart.length ? '' : 'none';
      b.parentNode.setAttribute('aria-label', 'سلة التسوق، ' + pieces(cart.length));
      if (pop) { b.classList.remove('proto-pop'); void b.offsetWidth; b.classList.add('proto-pop'); }
    });
  }
  function cartItem(p) { return { src: p.src, alt: p.alt, name: p.name, size: p.size, cond: p.cond, priceNum: p.priceNum, oldNum: p.oldNum || 0, seller: p.seller }; }
  // adds p; when the cart belongs to another seller, asks first. then() runs once the piece is in the cart.
  function inCart(p) { return cart.some(function (c) { return c.src === p.src && c.name === p.name; }); }
  var ICON_TICK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9"></path></svg>';
  // the round + on a card turns into a dark tick once its piece is in the cart (label kept, so a tap still opens the piece)
  function markAddBtn(btn) { if (!btn) return; btn.innerHTML = ICON_TICK; btn.style.background = '#1C1917'; }
  // the wide «إضافة للسلة» button on the product page
  function paintAddedBtn(btn, label) {
    if (!btn) return;
    btn.innerHTML = '<span style="display: inline-flex; align-items: center; justify-content: center; gap: 8px">' + ICON_TICK + label + '</span>';
    btn.style.borderColor = '#C2410C'; btn.style.background = '#FFF4EC'; btn.style.color = '#C2410C';
  }
  // adds p; when the cart belongs to another seller, asks first. then() replaces the toast; added() runs whenever the piece ends up in the cart.
  function addToCart(p, then, added) {
    var done = function (msg) { saveCart(); paintCart(true); if (added) added(); if (then) then(); else toast(msg || 'تمت الإضافة للسلة'); };
    if (inCart(p)) { toast('هذه القطعة في السلة بالفعل'); if (added) added(); if (then) then(); return; }
    if (cart.length && cart[0].seller[0] !== p.seller[0]) {
      var html = '<section role="dialog" aria-modal="true" aria-label="تبدأ سلة جديدة؟" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
        '<div style="padding: 4px 18px 8px; display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 700">تبدأ سلة جديدة؟</h2>' +
        '<p style="margin: 0; font-size: 14px; line-height: 22px; color: #6B635D">السلة فيها قطع من «' + cart[0].seller[0] + '». كل طلب يكون من بائع واحد، لذا ستبدأ إضافة هذه القطعة سلة جديدة من «' + p.seller[0] + '».</p></div>' +
        '<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 28px">' +
        '<button type="button" data-act="replace" style="height: 52px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700">ابدأ سلة جديدة</button>' +
        '<button type="button" data-act="close" style="height: 52px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700">خليني في السلة الحالية</button></div></section>';
      setTimeout(function () {
        mountSheet(html, function (e, b) {
          if (b && b.getAttribute('data-act') === 'replace') { cart = [cartItem(p)]; closeSheet(); setTimeout(function () { done('بدأت سلة جديدة من «' + p.seller[0] + '»'); }, 200); }
        }, null);
      }, sheetOpen ? 340 : 0);
      return;
    }
    cart.push(cartItem(p)); done();
  }
  function paintFav(btn, on) {
    var svg = btn.querySelector('svg');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'إزالة من المفضلة' : 'إضافة للمفضلة');
    if (svg) { svg.setAttribute('fill', on ? '#EA580C' : 'none'); svg.setAttribute('stroke', on ? '#EA580C' : 'currentColor'); }
  }
  function toggleFav(key, info) {
    var on = !favs[key];
    if (on) favs[key] = info || 1; else delete favs[key];
    write('outlet-favs', favs);
    toast(on ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة');
    return on;
  }
  paintCart(false);
  // cards whose piece is already in the cart show the tick instead of +
  setTimeout(function () {
    [].forEach.call(document.querySelectorAll('button[aria-label$=" للسلة"]'), function (btn) {
      if (btn.hasAttribute('data-sp-add')) return;
      var cd = cardOf(btn); if (cd && cd.querySelector('img') && inCart(productInfo(cd))) markAddBtn(btn);
    });
  }, 0);

  // ---------- product data (read from a card) ----------
  var sellers = [['خزانة لمى', '4.9', 'الرياض', 38], ['دولاب سارة', '4.8', 'جدة', 21], ['ركن هند', '5.0', 'الدمام', 54], ['ستايل نوف', '4.7', 'الخبر', 12]];
  var colors = [['أخضر', '#8FA68A'], ['أسود', '#1C1917'], ['أحمر', '#C0392B'], ['أبيض', '#F4F1EA'], ['بيج', '#D8C3A5'], ['كحلي', '#233A5E'], ['أزرق', '#8DB3D9'],
                ['وردي', '#D9A3A8'], ['تراكوتا', '#B5583A'], ['الجمل', '#C19A6B'], ['جملي', '#C19A6B'], ['بني', '#A0703F'], ['كريمي', '#EFE6D2']];
  function sizeOf(name) { return /حذاء/.test(name) ? '40' : /شنط/.test(name) ? 'مقاس واحد' : ['S', 'M', 'L', 'XL', 'M', 'XS', 'L'][hash(name) % 7]; }
  function cardOf(el) { var b = el.querySelector ? el : null; return el.closest('div[style*="border-radius: 18px"]'); }
  // BRD card details: type · condition · times used (same rule on the board and here)
  function catOfName(n) { return /فستان/.test(n) ? 'فساتين' : /شنط/.test(n) ? 'شنط' : /حذاء/.test(n) ? 'أحذية' : 'ملابس'; }
  function usesOf(n) { return [2, 1, 0, 3, 2, 4][Math.floor(hash(n) / 7) % 6]; }
  function usesLabel(u) { return u === 0 ? 'لم تُستخدم' : u === 1 ? 'استُخدمت مرة' : u === 2 ? 'استُخدمت مرتين' : 'استُخدمت ' + u + ' مرات'; }
  function metaOf(n) { return catOfName(n) + ' · ' + ['ممتازة', 'كالجديدة', 'ممتازة', 'جيدة'][hash(n) % 4] + ' · ' + usesLabel(usesOf(n)); }
  function productInfo(card) {
    var img = card.querySelector('img');
    var nameEl = card.querySelector('span[style*="ellipsis"]');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var priceEl = card.querySelector('span[style*="font-size: 16px"]');
    var oldEl = card.querySelector('s');
    var badge = [].filter.call(card.querySelectorAll('span'), function (s) { return /^خصم/.test(s.textContent.trim()); })[0];
    var alt = img ? img.alt : name, h = hash(name), text = name + ' ' + alt;
    var findCol = function (s) { return colors.filter(function (c) { return s.indexOf(c[0]) !== -1; })[0]; };
    var col = findCol(name) || findCol(alt) || ['متعدد', 'conic-gradient(#C2410C, #233A5E, #EFE6D2, #C2410C)'];
    var cond = ['ممتازة', 'كالجديدة', 'ممتازة', 'جيدة'][h % 4];
    var size = sizeOf(name);
    return {
      src: img ? img.getAttribute('src') : '', alt: alt, name: name,
      price: priceEl ? priceEl.innerHTML : '', priceNum: priceEl ? parseInt(priceEl.textContent.replace(/\D/g, ''), 10) : 0,
      old: oldEl ? oldEl.innerHTML : '', oldNum: oldEl ? parseInt(oldEl.textContent.replace(/\D/g, ''), 10) : 0, off: badge ? badge.textContent.trim() : '',
      size: size, cond: cond, color: col[0], colorDot: col[1], seller: sellers[h % sellers.length], cat: catOfName(name), uses: usesOf(name),
      desc: alt + '. قطعة مستعملة بحالة ' + cond + '، نظيفة وبدون عيوب ظاهرة، والمقاس ' + size + '. الصور للقطعة نفسها، وتُشحن مطويّة ومغلّفة بعناية.'
    };
  }
  function openProduct(card) { write('outlet-product', productInfo(card)); location.href = 'product.html'; }
  // product info without a card (favourites seed, old saves)
  function infoFor(src, name, alt, priceNum, sellerIdx, st) {
    var h = hash(name), cond = ['ممتازة', 'كالجديدة', 'ممتازة', 'جيدة جدًا'][h % 4], size = sizeOf(name);
    var col = colors.filter(function (c) { return (name + ' ' + alt).indexOf(c[0]) !== -1; })[0] || ['متعدد', 'conic-gradient(#C2410C, #233A5E, #EFE6D2, #C2410C)'];
    return { src: src, alt: alt || name, name: name, price: riyal(13, 14) + priceNum, priceNum: priceNum, old: '', oldNum: 0, off: '', size: size, cond: cond, color: col[0], colorDot: col[1], seller: sellers[sellerIdx % sellers.length], st: st || '',
      desc: (alt || name) + '. قطعة مستعملة بحالة ' + cond + '، نظيفة وبدون عيوب ظاهرة، والمقاس ' + size + '.' };
  }
  if (read('outlet-favs', null) === null) {
    [infoFor('assets/dress-green.jpg', 'فستان لف أخضر', 'فستان كتان أخضر بتصميم لف', 145, 0), infoFor('assets/dress-pink.jpg', 'فستان شيفون وردي', 'فستان شيفون وردي', 160, 0), infoFor('assets/bag.jpg', 'شنطة جلد كلاسيكية', 'شنطة يد جلد بلون بني فاتح', 320, 2),
     infoFor('assets/trench.jpg', 'معطف ترنش كلاسيكي', 'معطف ترنش بيج', 520, 1, 'تم البيع'), infoFor('assets/shirt.jpg', 'قميص أزرق', 'قميص أزرق', 60, 2, 'غير متاح الآن')].forEach(function (p) { favs[p.src] = p; });
    write('outlet-favs', favs);
  }

  // ---------- bottom sheets ----------
  var sheetOpen = null;
  function mountSheet(html, onClick, opener) {
    if (!screen || sheetOpen) return null;
    var wrap = document.createElement('div');
    wrap.className = 'proto-sheet-wrap';
    wrap.innerHTML = '<div class="proto-backdrop" data-act="close"></div>' + html;
    screen.appendChild(wrap);
    var sheet = wrap.querySelector('section');
    sheet.classList.add('proto-sheet');
    sheetOpen = { wrap: wrap, opener: opener };
    void wrap.offsetHeight; // commit the closed state so the slide-up runs
    wrap.classList.add('open');
    var closeBtn = wrap.querySelector('button[data-act="close"]');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    wrap.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('[data-act], [data-sort], [data-size]');
      if (b && b.getAttribute('data-act') === 'close') { closeSheet(); return; }
      onClick(e, b, wrap);
    });
    // drag the handle down to close
    var grab = sheet.firstElementChild, startY = null, dy = 0;
    grab.style.touchAction = 'none';
    grab.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; startY = e.clientY; dy = 0; sheet.classList.add('dragging'); grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('pointermove', function (e) { if (startY === null) return; dy = Math.max(0, e.clientY - startY); sheet.style.transform = 'translateY(' + dy + 'px)'; });
    function endDrag() { if (startY === null) return; startY = null; sheet.classList.remove('dragging'); sheet.style.transform = ''; if (dy > 90) closeSheet(); }
    grab.addEventListener('pointerup', endDrag);
    grab.addEventListener('pointercancel', endDrag);
    return wrap;
  }
  function closeSheet() {
    if (!sheetOpen) return;
    var s = sheetOpen; sheetOpen = null;
    s.wrap.classList.remove('open');
    setTimeout(function () { s.wrap.remove(); }, 320);
    if (s.opener) s.opener.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  var ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>';
  var ICON_CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 19.92L8.48 13.4c-.77-.77-.77-2.03 0-2.8L15 4.08"></path></svg>';
  var ICON_HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"></path></svg>';
  var ICON_BAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 7.67V6.7c0-2.25 1.81-4.46 4.06-4.67a4.5 4.5 0 0 1 4.94 4.48v1.38M9 22h6c4.02 0 4.74-1.61 4.95-3.57l.75-6C20.97 9.99 20.27 8 16 8H8c-4.27 0-4.97 1.99-4.7 4.43l.75 6C4.26 20.39 4.98 22 9 22Z"></path></svg>';
  var ICON_SHIELD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none"><path d="M10.49 2.23 5.5 4.11c-1.15.43-2.09 1.79-2.09 3.01v7.43c0 1.18.78 2.73 1.73 3.44l4.3 3.21c1.41 1.06 3.73 1.06 5.14 0l4.3-3.21c.95-.71 1.73-2.26 1.73-3.44V7.12c0-1.23-.94-2.59-2.09-3.02l-4.99-1.87c-.85-.31-2.21-.31-3.04 0Z"></path><path d="m9.05 11.87 1.61 1.61 4.3-4.3"></path></svg>';
  var GRAB = '<div style="flex: none; position: relative; height: 40px; display: flex; align-items: center; justify-content: center; cursor: grab"><span aria-hidden="true" style="width: 40px; height: 5px; border-radius: 999px; background: #E7DED6"></span>' +
    '<button type="button" data-act="close" aria-label="إغلاق" style="position: absolute; top: 6px; left: 10px; width: 40px; height: 40px; border: 0; border-radius: 999px; background: transparent; color: #1C1917; display: flex; align-items: center; justify-content: center; padding: 0">' + ICON_CLOSE + '</button></div>';

  // quick add (the + on a card)
  function openQuickAdd(card, opener) {
    var p = productInfo(card), on = !!favs[p.src];
    var price = '<span style="direction: ltr; display: inline-flex; align-items: center; gap: 5px; font-size: 24px; font-weight: 700; color: #1C1917">' + p.price.replace('width="12" height="13"', 'width="17" height="19"') + '</span>';
    var old = p.old ? '<s style="direction: ltr; display: inline-flex; align-items: center; gap: 3px; font-size: 14px; color: #78716C">' + p.old.replace('width="9" height="10"', 'width="11" height="12"') + '</s>' : '';
    var off = p.off ? '<span style="height: 24px; padding: 0 9px; border-radius: 999px; background: #C2410C; color: #FFFFFF; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center">' + esc(p.off) + '</span>' : '';
    var html =
      '<section role="dialog" aria-modal="true" aria-label="إضافة سريعة: ' + esc(p.name) + '" style="max-height: 92%; box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
        '<div style="flex: none; display: flex; flex-direction: column; gap: 16px; padding-bottom: 4px">' +
          '<div style="display: flex; flex-direction: column; gap: 10px">' +
            '<div class="noscroll" data-gallery style="display: flex; gap: 36px; overflow-x: auto; padding: 0 18px; scroll-padding: 0 18px; scroll-snap-type: x mandatory; overscroll-behavior-x: contain">' +
              [['none', '50% 50%'], ['scale(1.9)', '50% 22%'], ['scale(1.8)', '50% 88%']].map(function (v) {
                return '<div style="flex: none; width: 100%; height: 252px; border-radius: 20px; background: #F7F3F0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 14px; box-sizing: border-box; scroll-snap-align: center"><img src="' + p.src + '" alt="' + esc(p.alt) + '" style="width: 100%; height: 100%; object-fit: contain; transform: ' + v[0] + '; transform-origin: ' + v[1] + '; mix-blend-mode: multiply"></div>';
              }).join('') +
            '</div>' +
            '<div aria-hidden="true" data-dots style="display: flex; justify-content: center; align-items: center; gap: 5px"><span></span><span></span><span></span></div>' +
          '</div>' +
          '<div style="display: flex; flex-direction: column; gap: 14px; padding: 0 18px">' +
            '<div style="display: flex; align-items: center; gap: 12px"><h2 style="flex: 1; min-width: 0; margin: 0; font-size: 18px; line-height: 26px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">' + esc(p.name) + '</h2>' +
            '<a href="product.html" data-act="details" style="flex: none; display: flex; align-items: center; gap: 2px; font-size: 13px; color: #6B635D; text-decoration: none; padding: 8px 0"><span style="font-weight: 400">التفاصيل</span>' + ICON_CHEV + '</a></div>' +
            '<div style="display: flex; align-items: center; gap: 10px">' + price + old + off + '</div>' +
            '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">' +
              '<div style="background: #F7F3F0; border-radius: 14px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; line-height: 16px; color: #6B635D">المقاس</span><span style="font-size: 15px; line-height: 22px; font-weight: 700">' + esc(p.size) + '</span></div>' +
              '<div style="background: #F7F3F0; border-radius: 14px; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; line-height: 16px; color: #6B635D">الحالة</span><span style="font-size: 15px; line-height: 22px; font-weight: 700">' + esc(p.cond) + '</span></div>' +
            '</div>' +
            '<a href="seller.html" data-act="seller" style="display: flex; align-items: center; gap: 12px; padding: 12px 0; text-decoration: none; color: #1C1917">' +
              '<span aria-hidden="true" style="width: 40px; height: 40px; flex: none; border-radius: 999px; background: #FDEBDD; color: #9A3412; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center">' + p.seller[0].split(' ').pop().charAt(0) + '</span>' +
              '<span style="flex: 1; display: flex; flex-direction: column"><span style="font-size: 14px; line-height: 20px; font-weight: 700">' + p.seller[0] + '</span><span style="font-size: 12px; line-height: 16px; color: #6B635D">★ ' + p.seller[1] + ' · ' + p.seller[2] + ' · ' + p.seller[3] + ' تقييم</span></span>' +
              '<span style="color: #6B635D; display: flex">' + ICON_CHEV + '</span></a>' +
            '<p style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 18px; color: #6B635D">' + ICON_SHIELD + 'قطعة واحدة متاحة، والمبلغ محفوظ حتى استلامها</p>' +
          '</div>' +
        '</div>' +
        '<div style="flex: none; display: flex; align-items: center; gap: 12px; padding: 12px 18px 28px; background: #FFFFFF">' +
          '<button type="button" data-act="fav" aria-pressed="' + on + '" aria-label="' + (on ? 'إزالة من المفضلة' : 'إضافة للمفضلة') + '" style="width: 52px; height: 52px; flex: none; border: 1px solid #EFE6DE; border-radius: 999px; background: #FFFFFF; color: #1C1917; display: flex; align-items: center; justify-content: center; padding: 0">' + ICON_HEART + '</button>' +
          '<button type="button" data-act="add" style="flex: 1; height: 52px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px">' + ICON_BAG + 'إضافة للسلة</button>' +
        '</div>' +
      '</section>';
    var wrap = mountSheet(html, function (e, b) {
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'soon') { e.preventDefault(); toast('هذه الشاشة ما زالت قيد التصميم'); }
      else if (act === 'seller') { e.preventDefault(); write('outlet-seller-view', p.seller[0]); location.href = 'seller.html'; }
      else if (act === 'details') { e.preventDefault(); openProduct(card); }
      else if (act === 'fav') {
        var now = toggleFav(p.src, p);
        paintFav(b, now);
        var cardFav = card.querySelector('button[aria-label="إضافة للمفضلة"], button[aria-pressed]');
        if (cardFav) paintFav(cardFav, now);
      } else if (act === 'add') { closeSheet(); setTimeout(function () { addToCart(p, null, function () { markAddBtn(card.querySelector('button[aria-label$=" للسلة"]')); }); }, 340); }
    }, opener);
    if (wrap && on) paintFav(wrap.querySelector('[data-act="fav"]'), true);
    if (wrap) {
      // dots follow the swipe (RTL scrollLeft is negative in modern browsers)
      var gal = wrap.querySelector('[data-gallery]'), dots = [].slice.call(wrap.querySelectorAll('[data-dots] span'));
      var paintDots = function () {
        var step = gal.firstElementChild.offsetWidth + 36, i = Math.round(Math.abs(gal.scrollLeft) / step);
        dots.forEach(function (d, k) { d.style.cssText = 'height: 5px; border-radius: 999px; transition: width .2s ease; width: ' + (k === i ? 16 : 5) + 'px; background: ' + (k === i ? '#1C1917' : '#E7DED6'); });
      };
      gal.addEventListener('scroll', paintDots, { passive: true });
      paintDots();
    }
  }

  // ---------- the 4 BRD categories: فساتين / ملابس / شنط / أحذية (category.html?cat=…) ----------
  var CAT_HASH = { '#dresses': 'فساتين', '#clothes': 'ملابس', '#bags': 'شنط', '#shoes': 'أحذية' };
  var CAT_ITEMS = {
    'ملابس': [['assets/sweater.jpg', 'كنزة صوف كريمي بألوان كحلي وأحمر', 'كنزة صوف ملونة', 98], ['assets/shirt.jpg', 'قميص قطن أزرق فاتح', 'قميص قطن مريح', 76], ['assets/trench.jpg', 'معطف ترنش بيج', 'معطف ترنش كلاسيكي', 520], ['assets/pants.jpg', 'بنطلون واسع بيج', 'بنطلون بيج', 85]],
    'شنط': [['assets/bag.jpg', 'شنطة يد جلد بلون بني فاتح', 'شنطة جلد كلاسيكية', 320]],
    'أحذية': [['assets/sneakers.jpg', 'حذاء رياضي جلد أبيض', 'حذاء أبيض', 150]]
  };
  if (page === 'category.html') {
    var curCat = new URLSearchParams(location.search).get('cat') || 'فساتين';
    if (!CAT_ITEMS[curCat]) curCat = 'فساتين';
    var catChips = [].slice.call(document.querySelectorAll('nav[aria-label="التصنيفات"] a'));
    var onA = catChips.filter(function (a) { return a.getAttribute('aria-current'); })[0], offA = catChips.filter(function (a) { return !a.getAttribute('aria-current'); })[0];
    var chipOn = onA ? onA.getAttribute('style') : '', chipOff = offA ? offA.getAttribute('style') : '';
    catChips.forEach(function (a) { var on = a.textContent.trim() === curCat; a.setAttribute('style', on ? chipOn : chipOff); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var CAT_THE = { 'فساتين': 'الفساتين', 'ملابس': 'الملابس', 'شنط': 'الشنط', 'أحذية': 'الأحذية' };
    var h1c = document.querySelector('.screen h1'); if (h1c) h1c.textContent = curCat;
    var sIn = document.querySelector('.screen input[type="search"]'); if (sIn) { sIn.placeholder = 'ابحث في ' + CAT_THE[curCat] + '...'; sIn.setAttribute('aria-label', 'ابحث في ' + CAT_THE[curCat]); }
    document.title = 'outlet · ' + curCat;
    var g0 = document.querySelector('.screen div[style*="grid-template-columns: repeat(2"]');
    if (g0 && curCat !== 'فساتين') {
      var ctpl = g0.children[0].cloneNode(true);
      [].forEach.call(ctpl.querySelectorAll('s'), function (x) { x.remove(); });
      [].forEach.call(ctpl.querySelectorAll('span'), function (x) { if (/^خصم/.test(x.textContent.trim())) x.remove(); });
      g0.innerHTML = '';
      CAT_ITEMS[curCat].forEach(function (c) {
        var n = ctpl.cloneNode(true), im = n.querySelector('img'); im.src = c[0]; im.alt = c[1];
        n.querySelector('span[style*="ellipsis"]').textContent = c[2];
        var mt = n.querySelector('[data-meta]'); if (mt) mt.textContent = metaOf(c[2]);
        var pr = n.querySelector('span[style*="font-size: 16px"]'); if (pr) pr.lastChild.textContent = c[3];
        var ab = n.querySelector('button[aria-label$=" للسلة"]'); if (ab) ab.setAttribute('aria-label', 'أضف ' + c[2] + ' للسلة');
        g0.appendChild(n);
      });
      var cnt = h1c && h1c.nextElementSibling; if (cnt) cnt.textContent = g0.children.length ? g0.children.length + (g0.children.length === 1 ? ' قطعة' : ' قطع') : '';
      if (!g0.children.length) g0.outerHTML = '<div style="padding: 60px 30px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center"><b style="font-size: 17px; line-height: 24px">لا توجد منتجات متاحة</b><span style="font-size: 14px; line-height: 22px; color: #6B635D">لا توجد قطع في ' + CAT_THE[curCat] + ' حاليًا. تُضاف القطع الجديدة بعد مراجعة فريق outlet.</span></div>';
    }
  }

  // ---------- filter + sort (dresses page) ----------
  var filterState = read('outlet-filter', { sort: 'new', sizes: [], cities: [], min: 0, max: 600 });
  filterState.cities = filterState.cities || [];
  if (page === 'category.html' && typeof curCat !== 'undefined' && curCat !== 'فساتين') filterState.sizes = [];
  var grid = document.querySelector('.screen div[style*="grid-template-columns: repeat(2"]');
  var gridCards = grid && page === 'category.html' ? [].slice.call(grid.children) : [];
  gridCards.forEach(function (c, i) { c._order = i; c._info = productInfo(c); });
  function matches(c, st) {
    var info = c._info;
    return info.priceNum >= st.min && (st.max >= 600 || info.priceNum <= st.max) && (!st.sizes.length || st.sizes.indexOf(info.size) !== -1) && (!(st.cities || []).length || st.cities.indexOf(info.seller[2]) !== -1);
  }
  function applyFilter(st) {
    var shown = 0;
    gridCards.slice().sort(function (a, b) {
      if (st.sort === 'asc') return a._info.priceNum - b._info.priceNum;
      if (st.sort === 'desc') return b._info.priceNum - a._info.priceNum;
      return a._order - b._order;
    }).forEach(function (c) { grid.appendChild(c); var ok = matches(c, st); c.classList.toggle('proto-hide', !ok); if (ok) shown++; });
    var active = (st.sizes.length ? 1 : 0) + ((st.cities || []).length ? 1 : 0) + (st.min > 0 || st.max < 600 ? 1 : 0);
    var fBtn = document.querySelector('button[aria-label^="الفلاتر"]');
    if (fBtn) {
      var dot = fBtn.querySelector('.proto-count');
      if (!dot) { dot = document.createElement('span'); dot.className = 'proto-count'; fBtn.appendChild(dot); }
      dot.textContent = active; dot.style.display = active ? '' : 'none';
      fBtn.setAttribute('aria-label', active ? 'الفلاتر، ' + active + ' مفعّلة' : 'الفلاتر');
    }
    var sBtn = document.querySelector('button[aria-label^="ترتيب حسب"]');
    var label = { new: 'الأحدث', asc: 'الأقل سعرًا', desc: 'الأعلى سعرًا' }[st.sort];
    if (sBtn) { var spans = sBtn.querySelectorAll('span'); if (spans[1]) spans[1].textContent = label; sBtn.setAttribute('aria-label', 'ترتيب حسب: ' + label); }
    var empty = document.querySelector('.proto-empty-filter');
    if (!empty && grid) { empty = document.createElement('div'); empty.className = 'proto-empty proto-empty-filter'; empty.innerHTML = 'لا توجد قطع بهذه الفلاتر<span>يمكن تجربة مقاس آخر أو توسيع نطاق السعر</span>'; grid.parentNode.appendChild(empty); }
    if (empty) empty.classList.toggle('proto-hide', shown > 0);
    return shown;
  }
  if (gridCards.length) applyFilter(filterState);
  function openFilter(opener) {
    var tpl = document.getElementById('tpl-filter');
    if (!tpl) return;
    var st = JSON.parse(JSON.stringify(filterState));
    var wrap = mountSheet(tpl.innerHTML, function (e, b, w) {
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (b.hasAttribute('data-sort')) { st.sort = b.getAttribute('data-sort'); }
      else if (b.hasAttribute('data-size')) { var s = b.getAttribute('data-size'), i = st.sizes.indexOf(s); if (i === -1) st.sizes.push(s); else st.sizes.splice(i, 1); }
      else if (b.hasAttribute('data-city')) { var cy = b.getAttribute('data-city'), ci = st.cities.indexOf(cy); if (ci === -1) st.cities.push(cy); else st.cities.splice(ci, 1); }
      else if (act === 'clear') { st = { sort: 'new', sizes: [], cities: [], min: 0, max: 600 }; }
      else if (act === 'apply') { filterState = st; write('outlet-filter', st); applyFilter(st); closeSheet(); grid.closest('[style*="overflow-y: auto"]').scrollTop = 0; return; }
      paint(w);
    }, opener);
    if (!wrap) return;
    st.cities = st.cities || [];
    // sizes follow the category: letters for dresses and clothes, numbers for shoes, none for bags
    var fCat = typeof curCat !== 'undefined' ? curCat : 'فساتين', sizeGroup = wrap.querySelector('[aria-label="المقاس"]');
    if (sizeGroup && fCat === 'شنط') sizeGroup.style.display = 'none';
    else if (sizeGroup && fCat === 'أحذية') {
      var sRow = sizeGroup.lastElementChild, sTpl = sRow.firstElementChild;
      sRow.innerHTML = ''; ['37', '38', '39', '40', '41', '42', '43'].forEach(function (z) { var b = sTpl.cloneNode(true); b.setAttribute('data-size', z); b.textContent = z; sRow.appendChild(b); });
    }
    function chipStyle(btn, on) {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.style.background = on ? '#1C1917' : '#F7F3F0'; btn.style.color = on ? '#FFFFFF' : '#1C1917'; btn.style.fontWeight = on ? '700' : '500';
    }
    function paint(w) {
      w.querySelectorAll('[data-sort]').forEach(function (b) { chipStyle(b, b.getAttribute('data-sort') === st.sort); });
      w.querySelectorAll('[data-size]').forEach(function (b) { chipStyle(b, st.sizes.indexOf(b.getAttribute('data-size')) !== -1); });
      w.querySelectorAll('[data-city]').forEach(function (b) { chipStyle(b, st.cities.indexOf(b.getAttribute('data-city')) !== -1); });
      var lo = w.querySelector('[data-price="min"]'), hi = w.querySelector('[data-price="max"]');
      lo.value = st.min; hi.value = st.max;
      var fill = w.querySelector('[data-price-fill]');
      fill.style.right = (st.min / 6) + '%'; fill.style.left = (100 - st.max / 6) + '%';
      var label = w.querySelector('[data-price-label]'), svg = label.querySelector('svg');
      label.textContent = ''; label.appendChild(svg);
      label.appendChild(document.createTextNode(st.min === 0 && st.max >= 600 ? 'كل الأسعار' : st.min + ' – ' + (st.max >= 600 ? '600+' : st.max)));
      var n = gridCards.filter(function (c) { return matches(c, st); }).length;
      w.querySelector('[data-act="apply"]').textContent = n ? 'عرض ' + n + (n === 1 ? ' قطعة' : n === 2 ? ' قطعتين' : ' قطع') : 'لا توجد نتائج';
    }
    ['min', 'max'].forEach(function (k) {
      wrap.querySelector('[data-price="' + k + '"]').addEventListener('input', function (e) {
        var v = parseInt(e.target.value, 10);
        if (k === 'min') st.min = Math.min(v, st.max - 10); else st.max = Math.max(v, st.min + 10);
        paint(wrap);
      });
    });
    paint(wrap);
  }

  // ---------- product page ----------
  if (page === 'product.html') {
    var p = read('outlet-product', null);
    var PAGE_DEFAULT = { src: 'assets/dress-green.jpg', alt: 'فستان كتان أخضر هادئ بتصميم لف وأكمام قصيرة', name: 'فستان لف أخضر', size: 'S', cond: 'ممتازة', priceNum: 145, oldNum: 220, seller: SELLERS[0] };
    var set = function (k, fn) { document.querySelectorAll('[data-p="' + k + '"]').forEach(fn); };
    if (p) {
      set('img', function (el) { el.src = p.src; el.alt = p.alt; });
      set('name', function (el) { el.textContent = p.name; });
      set('price', function (el) { el.innerHTML = p.price.replace('width="12" height="13"', 'width="18" height="20"'); });
      set('old', function (el) { if (p.old) el.innerHTML = p.old.replace('width="9" height="10"', 'width="11" height="12"'); else el.remove(); });
      set('off', function (el) { if (p.off) el.textContent = p.off; else el.remove(); });
      set('size', function (el) { el.textContent = p.size; });
      set('cond', function (el) { el.textContent = p.cond; });
      set('cat', function (el) { el.textContent = p.cat || catOfName(p.name); });
      set('uses', function (el) { el.textContent = usesLabel(p.uses != null ? p.uses : usesOf(p.name)); });
      set('city', function (el) { el.textContent = p.seller[2]; });
      set('color', function (el) { el.textContent = p.color; });
      set('color-dot', function (el) { el.style.background = p.colorDot; if (p.color === 'أبيض' || p.color === 'كريمي') el.style.boxShadow = 'inset 0 0 0 1px #E7DED6'; });
      set('seller', function (el) { el.textContent = p.seller[0]; });
      set('seller-initial', function (el) { el.textContent = p.seller[0].split(' ').pop().charAt(0); });
      set('rating', function (el) { el.textContent = p.seller[1]; });
      set('sold', function (el) { el.textContent = p.seller[3] + ' تقييم'; });
      set('desc', function (el) { el.textContent = p.desc; });
      document.title = 'outlet · ' + p.name;
    }
    var heroImg = document.querySelector('[data-p="img"]');
    var key = heroImg ? heroImg.getAttribute('src') : '';
    var favBtn = document.querySelector('[data-p="fav"]');
    if (favBtn) paintFav(favBtn, !!favs[key]);
    // Photos change in place with a card flip; the arrows loop round.
    // View 1: transparent cut-out on the platform. View 2: someone wearing it (when we have that photo). View 3: a gentle close-up.
    var base = key.replace(/^.*\//, '').replace(/\.(jpg|png)$/, '').replace(/-cut$/, '');
    var cut = 'assets/' + base + '-cut.png';
    var WORN = {}; // products that have an on-model photo, e.g. { 'dress-green': 1 } -> assets/worn-dress-green.jpg
    var worn = WORN[base] ? 'assets/worn-' + base + '.jpg' : null;
    var views = [{ src: cut, t: 'none', o: '50% 50%' }];
    if (worn) views.push({ src: worn, worn: true });
    views.push({ src: cut, t: 'scale(1.35)', o: '50% 22%' });
    if (views.length < 3) views.push({ src: cut, t: 'scale(1.35)', o: '50% 85%' });
    var view = 0, flipping = false, frame = null;
    if (heroImg) {
      heroImg.src = cut;
      frame = document.createElement('div');
      ['position', 'top', 'left', 'width', 'height', 'marginLeft'].forEach(function (k) { frame.style[k] = heroImg.style[k]; });
      frame.style.overflow = 'hidden';
      frame.style.transformStyle = 'preserve-3d';
      frame.style.willChange = 'transform';
      frame.style.transition = 'border-radius .2s';
      heroImg.parentNode.insertBefore(frame, heroImg);
      frame.appendChild(heroImg);
      heroImg.style.cssText = 'display: block; width: 100%; height: 100%; object-fit: contain';
      views.forEach(function (v) { var i = new Image(); i.src = v.src; }); // warm the cache so the flip never shows a blank
    }
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var setView = function () {
      var v = views[view];
      heroImg.src = v.src;
      heroImg.style.objectFit = v.worn ? 'cover' : 'contain';
      heroImg.style.objectPosition = v.worn ? '50% 30%' : '50% 50%';
      heroImg.style.transformOrigin = v.o || '50% 50%'; heroImg.style.transform = v.t || 'none';
      frame.style.borderRadius = v.worn ? '22px' : '0';
      frame.style.boxShadow = v.worn ? '0 12px 28px rgba(28,25,23,0.12)' : 'none';
      var c = document.querySelector('[data-pager-count]'); if (c) c.textContent = (view + 1) + '/' + views.length;
    };
    var flipTo = function (dir) { // dir: 1 = next, -1 = previous
      if (!frame || flipping) return;
      view = (view + (dir > 0 ? 1 : views.length - 1)) % views.length;
      if (reduceMotion) { setView(); return; }
      flipping = true;
      var out = dir > 0 ? -90 : 90; // RTL: next turns towards the left
      frame.style.transition = 'transform .2s cubic-bezier(.55,0,.75,.4)';
      frame.style.transform = 'perspective(900px) rotateY(' + out + 'deg)';
      setTimeout(function () {
        setView();
        frame.style.transition = 'none';
        frame.style.transform = 'perspective(900px) rotateY(' + (-out) + 'deg)';
        void frame.offsetWidth;
        frame.style.transition = 'transform .24s cubic-bezier(.2,.7,.3,1)';
        frame.style.transform = 'perspective(900px) rotateY(0deg)';
        setTimeout(function () { flipping = false; }, 240);
      }, 200);
    };
    if (inCart(p || PAGE_DEFAULT)) paintAddedBtn(screen.querySelector('[data-act="add"]'), 'في السلة');
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pager], [data-act], [data-p="fav"], [data-p="seller-link"]');
      if (!b || b.closest('.proto-sheet-wrap')) return; // sheets opened over the page handle their own buttons
      e.stopPropagation(); e.preventDefault();
      if (b.hasAttribute('data-pager')) { flipTo(b.getAttribute('data-pager') === 'next' ? 1 : -1); }
      else if (b.getAttribute('data-p') === 'fav') { paintFav(b, toggleFav(key, p || null)); }
      else if (b.getAttribute('data-p') === 'seller-link') { write('outlet-seller-view', p && p.seller ? p.seller[0] : 'خزانة لمى'); location.href = 'seller.html'; }
      else if (b.getAttribute('data-act') === 'more') {
        var d = document.querySelector('[data-p="desc"]'), open = d.style.webkitLineClamp === 'unset';
        d.style.webkitLineClamp = open ? '3' : 'unset'; d.style.display = open ? '-webkit-box' : 'block';
        b.textContent = open ? 'قراءة المزيد' : 'عرض أقل';
      }
      else if (b.getAttribute('data-act') === 'add') { addToCart(p || PAGE_DEFAULT, null, function () { paintAddedBtn(b, 'تمت الإضافة'); }); }
      else if (b.getAttribute('data-act') === 'buy') { addToCart(p || PAGE_DEFAULT, function () { location.href = 'cart.html'; }); }
    }, true);
  }

  // ---------- cart page ----------
  if (page === 'cart.html') {
    var list = screen.querySelector('[data-cart-list]');
    var tpl = list.querySelector('[data-cart-item]').cloneNode(true);
    var renderCart = function () {
      var full = screen.querySelector('[data-cart-full]'), empty = screen.querySelector('[data-cart-empty]'), bar = screen.querySelector('[data-cart-bar]');
      screen.querySelector('[data-cart-count]').textContent = cart.length ? pieces(cart.length) : '';
      full.style.display = cart.length ? 'flex' : 'none';
      bar.style.display = cart.length ? '' : 'none';
      empty.style.display = cart.length ? 'none' : 'flex';
      if (!cart.length) return;
      var s = cart[0].seller;
      screen.querySelector('[data-cart-seller] [data-c="seller"]').textContent = s[0];
      screen.querySelector('[data-cart-seller] [data-c="seller-initial"]').textContent = s[0].split(' ').pop().charAt(0);
      screen.querySelector('[data-cart-seller] [data-c="seller-meta"]').textContent = '★ ' + s[1] + ' · ' + s[2];
      list.innerHTML = '';
      cart.forEach(function (it, i) {
        var row = tpl.cloneNode(true);
        row.querySelector('[data-c="img"]').src = it.src; row.querySelector('[data-c="img"]').alt = it.alt;
        row.querySelector('[data-c="name"]').textContent = it.name;
        row.querySelector('[data-c="meta"]').textContent = 'المقاس ' + it.size + ' · ' + it.cond;
        row.querySelector('[data-c="price"]').innerHTML = riyal(12, 13) + it.priceNum;
        var old = row.querySelector('[data-c="old"]');
        if (it.oldNum) {
          if (!old) { old = document.createElement('s'); old.setAttribute('data-c', 'old'); old.style.cssText = 'direction: ltr; display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #78716C'; row.querySelector('[data-c="price"]').after(old); }
          old.innerHTML = riyal(9, 10) + it.oldNum;
        } else if (old) old.remove();
        var rm = row.querySelector('[data-act="remove"]'); rm.setAttribute('aria-label', 'حذف ' + it.name + ' من السلة'); rm.setAttribute('data-i', i);
        list.appendChild(row);
      });
      var sub = cart.reduce(function (a, it) { return a + it.priceNum; }, 0), fee = 9;
      var subEl = screen.querySelector('[data-sum-subtotal]');
      subEl.innerHTML = riyal(10, 11) + sub;
      subEl.previousElementSibling.textContent = 'المجموع (' + pieces(cart.length) + ')';
      screen.querySelector('[data-sum-fee]').innerHTML = riyal(10, 11) + fee;
      screen.querySelectorAll('[data-sum-total]').forEach(function (el, k) { el.innerHTML = (k === 0 ? riyal(14, 15) : riyal(12, 13)) + (sub + fee); });
    };
    renderCart();
    saveCart();
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act="remove"], [data-act="checkout"], [data-cart-seller]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.getAttribute('data-act') === 'remove') {
        cart.splice(parseInt(b.getAttribute('data-i'), 10), 1); saveCart(); paintCart(false); renderCart(); toast('تمت إزالتها من السلة');
      } else if (b.getAttribute('data-act') === 'checkout') { location.href = 'checkout.html'; }
      else { write('outlet-seller-view', cart.length ? cart[0].seller[0] : 'خزانة لمى'); location.href = 'seller.html'; }
    }, true);
  }

  // ---------- order maths shared by checkout, payment and the result ----------
  // saved addresses; delivery fee is set by region (null = courier does not cover that region)
  var ADDRS = read('outlet-addrs', null) || [
    { label: 'البيت', city: 'الرياض', detail: 'حي النرجس، شارع الأمير سعود بن عبدالله', line: 'حي النرجس، شارع الأمير سعود بن عبدالله، الرياض', fee: 25, def: true, pickup: true },
    { label: 'العمل', city: 'جدة', detail: 'حي الروضة، طريق الأمير سلطان', line: 'حي الروضة، طريق الأمير سلطان، جدة', fee: 30 },
    { label: 'بيت العائلة', city: 'القريات', detail: 'حي الخالدية', line: 'حي الخالدية، القريات', fee: null }
  ];
  var SERVICE_FEE = 9;
  function orderSums() {
    var c = read('outlet-checkout', { addr: Math.max(0, ADDRS.findIndex(function (x) { return x.def; })), method: 'courier' }), a = ADDRS[c.addr] || ADDRS[0];
    var method = a.fee === null ? 'direct' : c.method;
    var sub = cart.reduce(function (s, it) { return s + it.priceNum; }, 0);
    var delivery = method === 'courier' ? a.fee : 0;
    return { addr: a, method: method, sub: sub, fee: SERVICE_FEE, delivery: delivery, total: sub + SERVICE_FEE + delivery };
  }
  var PAY_LABEL = { apple: 'Apple Pay', mada: 'بطاقة مدى', credit: 'بطاقة ائتمانية' };

  // ---------- checkout ----------
  if (page === 'checkout.html') {
    if (!cart.length) { location.replace('cart.html'); return; }
    var co = read('outlet-checkout', { addr: 0, method: 'courier' });
    var thumbsBox = screen.querySelector('[data-co-thumbs]');
    var thumbTpl = thumbsBox.firstElementChild.cloneNode(true);
    var paintRadio = function (btn, on, disabled) {
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.disabled = !!disabled; btn.style.opacity = disabled ? '0.45' : '1';
      btn.style.background = on ? '#FFF4EC' : '#F7F3F093';
      var ring = btn.firstElementChild;
      ring.style.borderColor = on ? '#C2410C' : '#C9BFB7';
      ring.innerHTML = on ? '<span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span>' : '';
    };
    var renderCheckout = function () {
      var a = ADDRS[co.addr];
      if (a.fee === null && co.method === 'courier') co.method = 'direct';
      write('outlet-checkout', co);
      screen.querySelector('[data-addr-label]').textContent = a.label;
      screen.querySelector('[data-addr-line]').textContent = a.line;
      var courier = screen.querySelector('[data-method="courier"]'), direct = screen.querySelector('[data-method="direct"]');
      paintRadio(courier, co.method === 'courier', a.fee === null);
      paintRadio(direct, co.method === 'direct', false);
      screen.querySelector('[data-courier-fee]').innerHTML = a.fee === null ? 'غير متاح' : riyal(11, 12) + a.fee;
      screen.querySelector('[data-courier-off]').style.display = a.fee === null ? 'block' : 'none';
      thumbsBox.innerHTML = '';
      cart.forEach(function (it) { var t = thumbTpl.cloneNode(true), im = t.querySelector('img'); im.src = it.src; im.alt = it.name; var nm = t.querySelector('[data-co-name]'), pc = t.querySelector('[data-co-price]'); if (nm) nm.textContent = it.name; if (pc) pc.innerHTML = riyal(10, 11) + it.priceNum; thumbsBox.appendChild(t); });
      var countEl = screen.querySelector('[data-co-count]');
      countEl.innerHTML = pieces(cart.length) + ' من <b data-co-seller style="color: #1C1917">' + esc(cart[0].seller[0]) + '</b>';
      var sub = cart.reduce(function (s, it) { return s + it.priceNum; }, 0), fee = 9;
      var delivery = co.method === 'courier' ? a.fee : 0;
      screen.querySelector('[data-sum-subtotal]').innerHTML = riyal(10, 11) + sub;
      screen.querySelector('[data-sum-fee]').innerHTML = riyal(10, 11) + fee;
      screen.querySelector('[data-sum-delivery]').innerHTML = delivery ? riyal(10, 11) + delivery : 'مجانًا';
      screen.querySelectorAll('[data-sum-total]').forEach(function (el, k) { el.innerHTML = (k === 0 ? riyal(14, 15) : riyal(12, 13)) + (sub + fee + delivery); });
    };
    var openAddresses = function (opener) {
      var rows = ADDRS.map(function (a, i) {
        var on = i === co.addr;
        return '<button type="button" role="radio" aria-checked="' + on + '" data-addr="' + i + '" style="width: 100%; border: 0; border-radius: 18px; background: ' + (on ? '#FFF4EC' : '#F7F3F0') + '; padding: 14px; display: flex; align-items: center; gap: 12px; font-family: inherit; color: #1C1917; text-align: right">' +
          '<span aria-hidden="true" style="order: 2; width: 22px; height: 22px; flex: none; box-sizing: border-box; border-radius: 999px; border: 2px solid ' + (on ? '#C2410C' : '#C9BFB7') + '; display: flex; align-items: center; justify-content: center">' + (on ? '<span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span>' : '') + '</span>' +
          '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; line-height: 22px; font-weight: 700">' + a.label + '</span><span style="font-size: 12px; line-height: 18px; color: #6B635D">' + a.line + '</span>' +
          (a.fee === null ? '<span style="font-size: 11px; line-height: 16px; color: #9A3412">التوصيل بالمندوب غير متاح هنا، والتسليم المباشر متاح</span>' : '') + '</span></button>';
      }).join('');
      var html = '<section role="dialog" aria-modal="true" aria-label="اختيار عنوان الاستلام" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
        '<div style="padding: 0 18px 28px; display: flex; flex-direction: column; gap: 10px"><h2 style="margin: 0 0 4px; font-size: 20px; line-height: 28px; font-weight: 700">عنوان الاستلام</h2>' + rows +
        '<button type="button" data-act="new-address" style="height: 48px; border: 0; border-radius: 999px; background: transparent; font-family: inherit; font-size: 14px; font-weight: 700; color: #C2410C; display: flex; align-items: center; justify-content: center; gap: 6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 18V6"></path></svg>إضافة عنوان جديد</button></div></section>';
      mountSheet(html, function (e) {
        var r = e.target.closest('[data-addr]'), n = e.target.closest('[data-act="new-address"]');
        if (r) { co.addr = parseInt(r.getAttribute('data-addr'), 10); renderCheckout(); closeSheet(); }
        else if (n) { write('outlet-addr-edit', -1); write('outlet-addr-return', 'checkout.html'); location.href = 'address-form.html'; }
      }, opener);
    };
    renderCheckout();
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-method], [data-act="change-address"], [data-act="pay"]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.hasAttribute('data-method')) { if (!b.disabled) { co.method = b.getAttribute('data-method'); renderCheckout(); } }
      else if (b.getAttribute('data-act') === 'change-address') openAddresses(b);
      else location.href = 'payment.html';
    }, true);
  }

  // ---------- payment ----------
  if (page === 'payment.html') {
    if (!cart.length) { location.replace('cart.html'); return; }
    var sums = orderSums();
    var payMethod = read('outlet-pay-method', 'mada');
    screen.querySelectorAll('[data-pay-amount]').forEach(function (el, k) { el.innerHTML = (k === 0 ? riyal(22, 24) : riyal(12, 13)) + sums.total; });
    screen.querySelector('[data-pay-summary]').textContent = pieces(cart.length) + ' من ' + cart[0].seller[0] + ' · ' + (sums.method === 'courier' ? 'توصيل بالمندوب' : 'تسليم مباشر مع البائع');
    var form = screen.querySelector('[data-card-form]');
    var paintPay = function () {
      screen.querySelectorAll('[data-pay]').forEach(function (b) {
        var on = b.getAttribute('data-pay') === payMethod;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.style.background = on ? '#FFF4EC' : '#F7F3F093';
        var ring = b.firstElementChild;
        ring.style.borderColor = on ? '#C2410C' : '#C9BFB7';
        ring.innerHTML = on ? '<span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span>' : '';
      });
      form.style.display = payMethod === 'apple' ? 'none' : 'flex';
      write('outlet-pay-method', payMethod);
    };
    paintPay();
    // light formatting for the card fields (nothing is stored or sent anywhere)
    var num = screen.querySelector('[data-card="number"]'), exp = screen.querySelector('[data-card="exp"]'), cvv = screen.querySelector('[data-card="cvv"]');
    // demo build: card fields come filled with a test card
    demoFill(num, '4847 8300 1234 5678'); demoFill(exp, '08 / 28'); demoFill(cvv, '123'); demoFill(screen.querySelector('[data-card="name"]'), 'SARA ALOTAIBI');
    num.addEventListener('input', function () { num.value = num.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
    exp.addEventListener('input', function () { var d = exp.value.replace(/\D/g, '').slice(0, 4); exp.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; });
    cvv.addEventListener('input', function () { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4); });
    var processing = function (then) {
      var o = document.createElement('div');
      o.setAttribute('role', 'status');
      o.style.cssText = 'position: absolute; inset: 0; z-index: 50; background: rgba(255,255,255,0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; font: 700 16px/24px "Thmanyah Sans", system-ui, sans-serif; color: #1C1917';
      o.innerHTML = '<span class="proto-spin" aria-hidden="true"></span>جاري تأكيد الدفع…<span style="font-weight: 400; font-size: 13px; color: #6B635D">لحظات وهنكمّل</span>';
      screen.appendChild(o);
      setTimeout(then, 1500);
    };
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pay], [data-act="confirm-pay"]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.hasAttribute('data-pay')) { payMethod = b.getAttribute('data-pay'); paintPay(); return; }
      var digits = num.value.replace(/\D/g, '');
      if (payMethod !== 'apple' && digits.length < 12) { toast('رقم البطاقة ناقص'); num.focus(); return; }
      processing(function () {
        // demo rule for showing the failure screen: a card number ending in 0002 is declined
        if (payMethod !== 'apple' && /0002$/.test(digits)) { location.href = 'payment-failed.html'; return; }
        var s = orderSums();
        var now = new Date();
        var order = { no: 'OUT-' + (24818 + Math.floor(Math.random() * 180)), date: fmtDate(now), status: s.method === 'direct' ? 'handover' : 'preparing',
          items: cart.slice(), seller: cart[0].seller, method: s.method, addr: s.addr.label, addrLine: s.addr.line,
          sub: s.sub, fee: s.fee, delivery: s.delivery, total: s.total, pay: PAY_LABEL[payMethod], times: { paid: fmtDate(now, true) }, paidAt: now.getTime() };
        write('outlet-last-order', order);
        var orders = read('outlet-orders', []); orders.unshift(order); write('outlet-orders', orders);
        cart = []; saveCart();
        location.href = 'payment-success.html';
      });
    }, true);
  }

  // ---------- payment result ----------
  if (page === 'payment-success.html') {
    var ord = read('outlet-last-order', null);
    if (ord) {
      screen.querySelector('[data-order-no]').textContent = ord.no;
      screen.querySelector('[data-order-seller]').innerHTML = 'من <b style="color: #1C1917">' + esc(ord.seller[0]) + '</b>';
      var tb = screen.querySelector('[data-order-thumbs]'), tt = tb.firstElementChild.cloneNode(true);
      tb.innerHTML = '';
      ord.items.slice(0, 4).forEach(function (it) { var t = tt.cloneNode(true), im = t.querySelector('img'); im.src = it.src; im.alt = it.name; tb.appendChild(t); });
      screen.querySelector('[data-order-method]').textContent = ord.method === 'courier' ? 'توصيل بالمندوب · ' + ord.addr : 'تسليم مباشر مع البائع';
      screen.querySelector('[data-order-total]').innerHTML = riyal(11, 12) + ord.total;
      screen.querySelector('[data-order-pay]').textContent = ord.pay;
      screen.querySelector('[data-order-next]').textContent = ord.method === 'courier'
        ? 'البائع يجهّز القطع، وسيستلمها المندوب منه ويوصلها لعنوانك. تم فتح محادثة الطلب مع البائع، وسنرسل إشعارًا مع كل تحديث.'
        : 'تم فتح محادثة الطلب مع البائع الآن، ويمكن الاتفاق فيها على مكان ووقت التسليم. وبعد أن يسجّل البائع التسليم، يكون تأكيد الاستلام من صفحة الطلب.';
    }
    paintCart(false);
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act="track"], [data-act="invoice"]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.getAttribute('data-act') === 'track' && ord) { write('outlet-order-view', ord.no); location.href = 'order.html'; }
      else if (ord) { write('outlet-invoice-view', ord.no); location.href = 'invoice.html'; }
    }, true);
  }

  // ---------- orders (طلباتي + تفاصيل الطلب) ----------
  function fmtDate(d, withTime) {
    var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    var s = d.getDate() + ' ' + months[d.getMonth()] + (withTime ? '' : ' ' + d.getFullYear());
    if (withTime) { var h = d.getHours(), m = ('0' + d.getMinutes()).slice(-2); s += ' · ' + ((h % 12) || 12) + ':' + m + (h < 12 ? ' ص' : ' م'); }
    return s;
  }
  var STATUS = {
    preparing: { label: 'قيد التجهيز', bg: '#F7F3F0', fg: '#6B635D', card: '#F7F3F093', title: 'البائع يجهّز طلبك', sub: 'سنرسل إشعارًا فور استلام المندوب للقطع. الإلغاء متاح حتى بدء الشحن.' },
    shipping: { label: 'قيد التوصيل', bg: '#FFF4EC', fg: '#C2410C', card: '#FFF4EC', title: 'طلبك في الطريق', sub: 'استلم المندوب القطع من البائع وهو في الطريق إلى عنوانك.' },
    arrived: { label: 'وصل المندوب', bg: '#FEF6E7', fg: '#9A5800', card: '#FEF6E7', title: 'المندوب سلّم الطلب', sub: 'بعد مراجعة القطع، يكتمل الطلب بتأكيد الاستلام. وإذا كان هناك شيء غير سليم، الإبلاغ متاح من هنا.' },
    handover: { label: 'بانتظار التسليم', bg: '#FEF6E7', fg: '#9A5800', card: '#FEF6E7', title: 'الاتفاق على التسليم', sub: 'يُحدَّد المكان والوقت في محادثة الطلب. بعد أن يسجّل البائع تسليم القطعة، سيظهر تأكيد الاستلام هنا.' },
    handed: { label: 'بانتظار تأكيد الاستلام', bg: '#FEF6E7', fg: '#9A5800', card: '#FEF6E7', title: 'سجّل البائع تسليم القطعة', sub: 'إذا وصلت القطعة مطابقة للوصف، يكتمل الطلب بتأكيد الاستلام. وإذا كانت هناك مشكلة، الإبلاغ متاح من هنا.' },
    completed: { label: 'مكتمل', bg: '#ECF6EF', fg: '#1F7A4D', card: '#ECF6EF', title: 'الطلب اكتمل', sub: 'أصبحت مستحقات البائع متاحة في محفظته، وتقييم البائع متاح الآن.' },
    refunded: { label: 'مسترد', bg: '#F2F2F2', fg: '#6B635D', card: '#ECF6EF', title: 'المبلغ رجع لمحفظتك', sub: 'كان القرار لصالحك، فتم إلغاء الطلب وتسجيل المبلغ في محفظتك.' },
    disputed: { label: 'محل نزاع', bg: '#FDEBDD', fg: '#9A3412', card: '#FFF4EC', title: 'بلاغك قيد المراجعة', sub: 'يراجع فريق outlet البلاغ. لن يكتمل الطلب تلقائيًا والمبلغ محجوز حتى صدور القرار.' },
    cancelled: { label: 'ملغى', bg: '#F2F2F2', fg: '#6B635D', card: '#F7F3F093', title: 'تم إلغاء الطلب', sub: 'المبلغ المدفوع رجع للمحفظة.' }
  };
  var CURRENT = { preparing: 1, shipping: 1, arrived: 1, handover: 1, handed: 1, disputed: 1 };
  // the status the user sees: direct handover splits in two, and a dispute decision ends the order
  function effSt(o) {
    var s = o.status || 'preparing', d = o.dispute;
    if (s === 'handover' && o.sellerDelivered) return 'handed';
    if (s === 'disputed' && d && d.decision === 'seller') return 'completed';
    if (s === 'disputed' && d && d.decision === 'buyer' && d.stage === 'refunded') return 'refunded';
    return s;
  }
  var REASONS = { mismatch: 'غير مطابقة للوصف', defect: 'فيها عيب غير مذكور', fake: 'القطعة مقلّدة', missing: 'لم تصل أو وصلت تالفة' };
  function demoOrders() {
    var d = read('outlet-demo-orders-v2', null);
    if (d) return d;
    d = [
      { no: 'OUT-24790', date: '6 نوفمبر 2026', status: 'arrived', hoursLeft: 18,
        items: [{ src: 'assets/sneakers.jpg', alt: 'حذاء رياضي جلد أبيض', name: 'حذاء أبيض', size: '40', cond: 'ممتازة', priceNum: 150 }],
        seller: SELLERS[0], method: 'courier', addr: 'البيت', addrLine: ADDRS[0].line, sub: 150, fee: 9, delivery: 25, total: 184, pay: 'بطاقة مدى',
        times: { paid: '6 نوفمبر · 3:20 م', preparing: '6 نوفمبر · 6:05 م', shipping: '7 نوفمبر · 11:40 ص', arrived: '8 نوفمبر · 1:15 م' } },
      { no: 'OUT-24655', date: '30 أكتوبر 2026', status: 'disputed', prevStatus: 'arrived',
        items: [{ src: 'assets/trench.jpg', alt: 'معطف ترنش بيج', name: 'معطف ترنش بيج', size: 'M', cond: 'ممتازة', priceNum: 264 }],
        seller: SELLERS[1], method: 'courier', addr: 'البيت', addrLine: ADDRS[0].line, sub: 264, fee: 9, delivery: 25, total: 298, pay: 'بطاقة مدى',
        times: { paid: '30 أكتوبر · 2:10 م', preparing: '30 أكتوبر · 5:45 م', shipping: '31 أكتوبر · 10:20 ص', arrived: '1 نوفمبر · 6:20 م', disputed: '1 نوفمبر · 8:40 م' },
        dispute: { ref: 'DSP-0981', reason: 'defect', text: 'فيه قطع صغير بجانب الكم لم يكن ظاهرًا في الصور', shots: ['assets/trench.jpg'], date: '1 نوفمبر · 8:40 م',
          reviewed: '2 نوفمبر · 12:15 م', decision: 'buyer', decided: '3 نوفمبر · 4:30 م', stage: 'return',
          verdict: 'راجعنا الصور والمحادثة، والقطع الموجود في الكم لم يكن مذكورًا في الإعلان، لذلك تم قبول البلاغ.' } },
      { no: 'OUT-24611', date: '28 أكتوبر 2026', status: 'completed',
        items: [{ src: 'assets/pants.jpg', alt: 'بنطلون واسع بيج', name: 'بنطلون بيج', size: 'M', cond: 'كالجديدة', priceNum: 85 }],
        seller: SELLERS[3], method: 'direct', addr: '', addrLine: '', sub: 85, fee: 9, delivery: 0, total: 94, pay: 'Apple Pay',
        times: { paid: '28 أكتوبر · 9:10 م', handover: '29 أكتوبر · 5:30 م', completed: '29 أكتوبر · 7:02 م' } },
      { no: 'OUT-24502', date: '20 أكتوبر 2026', status: 'cancelled',
        items: [{ src: 'assets/bag.jpg', alt: 'شنطة يد جلد بلون بني فاتح', name: 'شنطة جلد كلاسيكية', size: 'مقاس واحد', cond: 'ممتازة', priceNum: 320 }],
        seller: SELLERS[2], method: 'courier', addr: 'البيت', addrLine: ADDRS[0].line, sub: 320, fee: 9, delivery: 25, total: 354, pay: 'بطاقة ائتمانية',
        times: { paid: '20 أكتوبر · 2:45 م', cancelled: '20 أكتوبر · 4:10 م' } }
    ];
    write('outlet-demo-orders-v2', d);
    return d;
  }
  var SELL_ORDERS = read('outlet-sell-orders', null) || [
    { no: 'OUT-24833', date: '8 نوفمبر 2026', status: 'preparing', role: 'sell', buyer: 'مها', method: 'courier', net: 102, times: { paid: '8 نوفمبر · 12:02 م' },
      items: [{ src: 'assets/sweater.jpg', alt: 'سويتر مخطط', name: 'سويتر مخطط', size: 'M', cond: 'ممتازة', priceNum: 120 }] },
    { no: 'OUT-24810', date: '7 نوفمبر 2026', status: 'handover', role: 'sell', buyer: 'ريم', method: 'direct', net: 108, times: { paid: '7 نوفمبر · 6:30 م' },
      items: [{ src: 'assets/pants.jpg', alt: 'بنطلون واسع بيج', name: 'بنطلون واسع بيج', size: 'M', cond: 'كالجديدة', priceNum: 127 }] },
    { no: 'OUT-24588', date: '29 أكتوبر 2026', status: 'completed', role: 'sell', buyer: 'جود', method: 'courier', net: 331, times: { paid: '29 أكتوبر · 1:10 م', preparing: '29 أكتوبر · 1:10 م', shipping: '30 أكتوبر · 11:00 ص', arrived: '1 نوفمبر · 2:40 م', completed: '2 نوفمبر · 9:15 ص' },
      items: [{ src: 'assets/dress-pink.jpg', alt: 'فستان وردي', name: 'فستان سهرة وردي', size: 'S', cond: 'ممتازة', priceNum: 390 }] },
    { no: 'OUT-24420', date: '21 أكتوبر 2026', status: 'completed', role: 'sell', buyer: 'سلمى', method: 'direct', net: 255, times: { paid: '21 أكتوبر · 7:00 م', delivered: '24 أكتوبر · 5:10 م', completed: '25 أكتوبر · 10:30 ص' },
      items: [{ src: 'assets/dress-polka.jpg', alt: 'فستان منقط', name: 'فستان منقط', size: 'M', cond: 'ممتازة', priceNum: 300 }] }
  ];
  function allOrders() {
    // demo: on a direct-handover order the seller records the handover a minute after payment
    var mine = read('outlet-orders', []), ch = false;
    mine.forEach(function (o) { if (o.status === 'handover' && !o.sellerDelivered && o.paidAt && Date.now() - o.paidAt > 60000) { o.sellerDelivered = true; o.times = o.times || {}; o.times.delivered = fmtDate(new Date(o.paidAt + 60000), true); ch = true; } });
    if (ch) write('outlet-orders', mine);
    return mine.concat(demoOrders());
  }
  function saveOrder(o) {
    ['outlet-orders', 'outlet-demo-orders-v2'].forEach(function (k) {
      var list = read(k, []), i = list.findIndex(function (x) { return x.no === o.no; });
      if (i !== -1) { list[i] = o; write(k, list); }
    });
  }
  function statusPill(st) { var s = STATUS[st] || STATUS.preparing; return '<span style="height: 26px; padding: 0 10px; border-radius: 999px; background: ' + s.bg + '; color: ' + s.fg + '; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; flex: none">' + s.label + '</span>'; }
  function askSheet(title, text, yes, no, onYes) {
    mountSheet('<section role="dialog" aria-modal="true" aria-label="' + title + '" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
    '<div style="padding: 4px 18px 8px; display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 700">' + title + '</h2><p style="margin: 0; font-size: 14px; line-height: 22px; color: #6B635D">' + text + '</p></div>' +
    '<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 28px"><button type="button" data-act="yes" style="height: 52px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700">' + yes + '</button>' +
    '<button type="button" data-act="close" style="height: 52px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700">' + no + '</button></div></section>',
    function (e, b) { if (b && b.getAttribute('data-act') === 'yes') { closeSheet(); setTimeout(onYes, 250); } }, null);
  }

  var TICK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  var stepHTML = function (title, time, state, last) {
    var dot = state === 'done' ? '<span style="width: 22px; height: 22px; border-radius: 999px; background: #C2410C; display: flex; align-items: center; justify-content: center">' + TICK + '</span>'
      : state === 'now' ? '<span style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; border: 2px solid #C2410C; background: #FFFFFF; display: flex; align-items: center; justify-content: center"><span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span></span>'
      : '<span style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; border: 2px solid #E7DED6; background: #FFFFFF"></span>';
    var conn = last ? '' : '<span aria-hidden="true" style="width: 2px; flex: 1; min-height: 14px; margin: 2px 0; border-radius: 2px; background: ' + (state === 'done' ? '#F3C9A9' : '#EFE6DE') + '"></span>';
    var todo = state === 'todo';
    return '<li style="display: flex; gap: 12px"><span style="display: flex; flex-direction: column; align-items: center; flex: none">' + dot + conn + '</span><span style="display: flex; flex-direction: column; padding-bottom: 10px"><span style="font-size: 14px; line-height: 22px; font-weight: ' + (todo ? 500 : 700) + '; color: ' + (todo ? '#8E857F' : '#1C1917') + '">' + title + '</span><span style="font-size: 12px; line-height: 16px; color: #8E857F">' + (time || '') + '</span></span></li>';
  };

  if (page === 'orders.html') {
    var listEl = screen.querySelector('[data-orders-list]');
    var cardTpl = listEl.querySelector('[data-order-card]').cloneNode(true);
    var emptyEl = screen.querySelector('[data-orders-empty]');
    var filter = 'all';
    var renderOrders = function () {
      listEl.querySelectorAll('[data-order-card]').forEach(function (c) { c.remove(); });
      var shown = 0;
      allOrders().forEach(function (o) {
        var st = effSt(o), group = CURRENT[st] ? 'current' : 'past';
        if (filter !== 'all' && filter !== group) return;
        var c = cardTpl.cloneNode(true);
        c.setAttribute('data-no', o.no);
        c.querySelector('b').textContent = o.no;
        c.querySelector('b').nextElementSibling.textContent = o.date;
        var pillEl = c.firstElementChild.lastElementChild; pillEl.outerHTML = statusPill(st);
        var row = c.children[1], thumbs = row.firstElementChild, t0 = thumbs.firstElementChild.cloneNode(true);
        thumbs.innerHTML = '';
        o.items.slice(0, 3).forEach(function (it) { var t = t0.cloneNode(true), im = t.querySelector('img'); im.src = it.src; im.alt = it.name; thumbs.appendChild(t); });
        var note = st === 'arrived' || st === 'handed' ? ' · بانتظار تأكيدك' : st === 'cancelled' || st === 'refunded' ? ' · المبلغ رجع للمحفظة' : '';
        row.lastElementChild.textContent = pieces(o.items.length) + ' من ' + o.seller[0] + note;
        c.children[2].firstElementChild.innerHTML = riyal(12, 13) + o.total;
        listEl.insertBefore(c, emptyEl);
        shown++;
      });
      emptyEl.style.display = shown ? 'none' : 'flex';
      screen.querySelectorAll('[data-filter]').forEach(function (b) {
        var on = b.getAttribute('data-filter') === filter;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500';
      });
    };
    renderOrders();
    screen.addEventListener('click', function (e) {
      var f = e.target.closest('[data-filter]'), card = e.target.closest('[data-order-card]');
      if (f) { e.preventDefault(); e.stopPropagation(); filter = f.getAttribute('data-filter'); renderOrders(); return; }
      if (card) { e.preventDefault(); e.stopPropagation(); write('outlet-order-view', card.getAttribute('data-no')); location.href = 'order.html'; }
    }, true);
  }

  if (page === 'account.html') {
    var mode = read('outlet-acc-mode', 'buy');
    var setMode = function (m) {
      mode = m; write('outlet-acc-mode', m);
      screen.querySelectorAll('[data-mode]').forEach(function (t) {
        var on = t.getAttribute('data-mode') === m;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.style.background = on ? '#FFFFFF' : 'transparent'; t.style.boxShadow = on ? '0 2px 8px rgba(28,25,23,0.08)' : 'none';
        t.style.fontWeight = on ? '700' : '500'; t.style.color = on ? '#1C1917' : '#6B635D';
      });
      screen.querySelectorAll('[data-panel]').forEach(function (p) { p.style.display = p.getAttribute('data-panel') === m ? 'flex' : 'none'; });
    };
    var note = screen.querySelector('[data-acc-note]'); if (note) note.remove();
    var apf = read('outlet-profile', { name: 'لمى الحربي' });
    var hello = screen.querySelector('a[href="edit-profile.html"]');
    if (hello) {
      hello.previousElementSibling.textContent = 'أهلًا، ' + apf.name.trim().split(' ')[0]; hello.closest('div').querySelector('span[aria-hidden]').textContent = apf.name.trim().charAt(0);
      var aph = (apf.phone || '+966 55 123 4567').replace(/\D/g, '').replace(/^966/, '');
      hello.innerHTML = '<bdi dir="ltr" style="unicode-bidi: isolate">+966 ' + aph.charAt(0) + '•• ••• ' + aph.slice(-4) + '</bdi> · ' + esc(apf.city || 'الرياض') + ' · تعديل';
    }
    var renderAcc = function () {
      var orders = allOrders();
      var current = orders.filter(function (x) { return CURRENT[x.status || 'preparing']; }).length;
      var wsum = walletSums(), walletBal = wsum.free;
      var sellAmt = screen.querySelectorAll('[data-panel="sell"] span[style*="direction: ltr"]');
      if (sellAmt[0]) sellAmt[0].innerHTML = riyal(18, 20) + wsum.free;
      if (sellAmt[1]) sellAmt[1].innerHTML = riyal(10, 11) + wsum.held;
      var lv = screen.querySelector('[data-row="listings"] [data-row-value]'); if (lv) lv.textContent = products().length + ' قطعة';
      var newIn = SELL_ORDERS.filter(function (x) { return x.status === 'preparing' || x.status === 'handover'; }).length, iv = screen.querySelector('[data-row="incoming"] [data-row-value]'); if (iv) iv.textContent = newIn ? newIn + ' نشطة' : '';
      var val = function (k) { return screen.querySelector('[data-row="' + k + '"] [data-row-value]'); };
      val('orders').textContent = current ? current + ' حالية' : orders.length + ' طلبات';
      val('favorites').textContent = Object.keys(favs).length || '';
      val('wallet').innerHTML = riyal(10, 11) + walletBal;
      var pend = orders.filter(function (x) { return effSt(x) === 'arrived' || effSt(x) === 'handed'; })[0];
      var card = screen.querySelector('[data-acc-pending]');
      card.style.display = pend ? 'flex' : 'none';
      if (!pend) return;
      card.setAttribute('data-no', pend.no);
      screen.querySelector('[data-acc-no]').textContent = pend.no;
      var im = screen.querySelector('[data-acc-thumb] img'); im.src = pend.items[0].src; im.alt = pend.items[0].alt || pend.items[0].name;
      screen.querySelector('[data-acc-title]').textContent = STATUS[effSt(pend)].title;
      screen.querySelector('[data-acc-sub]').textContent = pend.status === 'arrived' ? 'باقي ' + (pend.hoursLeft || 24) + ' ساعة، وبعدها يكتمل تلقائيًا' : 'يكتمل التسليم المباشر بتأكيد الاستلام فقط';
    };
    setMode(mode); renderAcc();
    var SOON = { favorites: 'شاشة المفضلة ما زالت قيد التصميم', addresses: 'شاشة العناوين ما زالت قيد التصميم', wallet: 'شاشة المحفظة ما زالت قيد التصميم', language: 'تغيير اللغة ما زال قيد التصميم', policies: 'الشروط والسياسات ما زالت قيد التصميم',
      withdraw: 'شاشة سحب الأرباح ما زالت قيد التصميم', incoming: 'شاشة الطلبات الواردة ما زالت قيد التصميم', listings: 'شاشة منتجاتي ما زالت قيد التصميم', pickup: 'عنوان الاستلام ما زال قيد التصميم', bank: 'البيانات البنكية ما زالت قيد التصميم',
      logout: 'تسجيل الخروج متاح في النسخة النهائية' };
    screen.addEventListener('click', function (e) {
      var t = e.target.closest('[data-mode], [data-pending], [data-row], a[href="#edit-profile"], a[href="#notifications"]');
      if (!t || !screen.contains(t) || t.closest('.proto-sheet-wrap')) return;
      e.preventDefault(); e.stopPropagation();
      if (t.hasAttribute('data-mode')) return setMode(t.getAttribute('data-mode'));
      var pa = t.getAttribute('data-pending'), no = screen.querySelector('[data-acc-pending]').getAttribute('data-no');
      if (pa === 'report') { write('outlet-order-view', no); location.href = 'report.html'; return; }
      if (pa === 'confirm') return askSheet('تأكيد الاستلام؟', 'بعد التأكيد يكتمل الطلب وتصبح مستحقات البائع متاحة في محفظته، ولا يمكن فتح نزاع بعدها.', 'نعم، استلمت القطع', 'ليس بعد', function () {
        var o = allOrders().filter(function (x) { return x.no === no; })[0]; if (!o) return;
        o.status = 'completed'; o.times = o.times || {}; o.times.completed = fmtDate(new Date(), true); saveOrder(o); renderAcc(); toast('تم تأكيد الاستلام، شكرًا!'); });
      var key = t.getAttribute('data-row');
      if (key === 'orders') { location.href = 'orders.html'; return; }
      var NAV = { favorites: 'favorites.html', listings: 'my-products.html', incoming: 'incoming.html', wallet: 'wallet.html', withdraw: 'withdraw.html', addresses: 'addresses.html', pickup: 'addresses.html', bank: 'bank.html', settings: 'settings.html' };
      if (NAV[key]) { location.href = NAV[key]; return; }
      if (key === 'logout') return askSheet('تسجيل الخروج؟', 'سيلزم تسجيل الدخول برقم الجوال وكلمة المرور مرة أخرى للشراء أو البيع.', 'تسجيل الخروج', 'رجوع', function () { write('outlet-auth', ''); location.href = 'login.html'; });
      if (!key) { if (t.getAttribute('href') === '#notifications') location.href = 'notifications.html'; else toast('تعديل الملف ما زال قيد التصميم'); return; }
      toast(SOON[key] || 'هذه الشاشة ما زالت قيد التصميم');
    }, true);
    // tapping the pending card body opens the order
    screen.querySelector('[data-acc-pending]').addEventListener('click', function (e) {
      if (e.target.closest('[data-pending]')) return;
      write('outlet-order-view', this.getAttribute('data-no')); location.href = 'order.html';
    });
    window.addEventListener('pageshow', renderAcc);
  }

  if (page === 'order.html') {
    var viewNo = read('outlet-order-view', 'OUT-24790');
    var o = allOrders().filter(function (x) { return x.no === viewNo; })[0] || demoOrders()[0];
    var itemsBox = screen.querySelector('[data-od-items]'), itemTpl = itemsBox.firstElementChild.cloneNode(true);
    var CLOCK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none"><path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Z"></path><path d="m15.71 15.18-3.1-1.85c-.54-.32-.98-1.09-.98-1.72v-4.1"></path></svg>';
    var renderOrder = function () {
      var st = effSt(o), S = STATUS[st];
      if (st === 'disputed' && o.dispute && o.dispute.decision === 'buyer') S = Object.assign({}, S, { card: '#ECF6EF', title: 'القرار لصالحك', sub: 'ستعود القطعة للبائع على حسابه، ويعود المبلغ لمحفظتك فور استلام البائع لها.' });
      if (st === 'completed' && o.dispute && o.dispute.decision === 'seller') S = Object.assign({}, S, { title: 'القرار لصالح البائع', sub: 'راجع فريق outlet البلاغ وقرر إكمال الطلب، وأصبحت مستحقات البائع متاحة.' });
      screen.querySelector('[data-od-no]').textContent = o.no;
      screen.querySelector('[data-od-date]').textContent = o.date;
      var extra = st === 'arrived' ? '<span style="margin-top: 4px; display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 18px; font-weight: 700; color: #9A5800">' + CLOCK + 'باقي ' + (o.hoursLeft || 24) + ' ساعة، وبعدها يكتمل الطلب تلقائيًا</span>'
        : st === 'handover' ? '<span style="margin-top: 4px; font-size: 12px; line-height: 18px; font-weight: 700; color: #9A5800">التسليم المباشر لا يكتمل تلقائيًا، ويلزم تأكيد الاستلام.</span>' : '';
      if (st === 'disputed' && o.dispute) extra = '<span style="margin-top: 4px; font-size: 12px; line-height: 18px; font-weight: 700; color: #9A3412">رقم البلاغ ' + o.dispute.ref + ' · ' + REASONS[o.dispute.reason] + '</span>';
      var box = screen.querySelector('[data-od-status]');
      box.style.background = S.card;
      box.innerHTML = statusPill(st).replace('background: ' + S.bg, 'background: #FFFFFF; align-self: flex-start') +
        '<span style="font-size: 18px; line-height: 26px; font-weight: 700">' + S.title + '</span><span style="font-size: 13px; line-height: 20px; color: #6B635D">' + S.sub + '</span>' + extra;
      var steps = o.method === 'courier' ? [['paid', 'تم الدفع'], ['preparing', 'قيد التجهيز'], ['shipping', 'قيد التوصيل'], ['arrived', 'وصل المندوب'], ['completed', 'مكتمل']]
        : [['paid', 'تم الدفع'], ['handover', 'بانتظار التسليم'], ['handed', 'البائع سجّل التسليم'], ['completed', 'مكتمل']];
      if (st === 'cancelled') steps = [['paid', 'تم الدفع'], ['cancelled', 'ملغى']];
      var buyerWin = o.dispute && o.dispute.decision === 'buyer';
      if (st === 'disputed' || st === 'refunded') steps = steps.filter(function (s) { return s[0] !== 'completed' && (s[0] !== 'arrived' || (o.times || {}).arrived); }).concat([['disputed', buyerWin ? 'القرار لصالحك · الإرجاع' : 'البلاغ قيد المراجعة'], buyerWin ? ['refunded', 'مسترد · المبلغ في محفظتك'] : ['completed', 'مكتمل']]);
      var cur = steps.findIndex(function (s) { return s[0] === st; });
      if (st === 'handed') (o.times || {}).handed = (o.times || {}).delivered;
      if (st === 'preparing' && o.method !== 'courier') cur = 1;
      var t = o.times || {};
      screen.querySelector('[data-od-timeline]').innerHTML = steps.map(function (s, i) {
        var state = i < cur || (st === 'completed' || st === 'cancelled' || st === 'refunded') && i === cur ? 'done' : i === cur ? 'now' : 'todo';
        var time = t[s[0]] || (s[0] === 'completed' && state === 'todo' ? (st === 'disputed' ? 'بعد القرار' : 'بعد تأكيد الاستلام') : s[0] === 'refunded' && state === 'todo' ? 'أول ما البائع يستلم القطعة' : '');
        return stepHTML(s[1], time, state, i === steps.length - 1);
      }).join('');
      screen.querySelector('[data-od-seller]').innerHTML = 'من <b style="color: #1C1917">' + esc(o.seller[0]) + '</b>';
      itemsBox.innerHTML = '';
      o.items.forEach(function (it) {
        var r = itemTpl.cloneNode(true), im = r.querySelector('img'); im.src = it.src; im.alt = it.alt || it.name;
        var info = r.children[1]; info.firstElementChild.textContent = it.name; info.lastElementChild.textContent = 'المقاس ' + it.size + ' · ' + it.cond;
        r.lastElementChild.innerHTML = riyal(11, 12) + it.priceNum;
        itemsBox.appendChild(r);
      });
      screen.querySelector('[data-od-method]').textContent = o.method === 'courier' ? 'توصيل بالمندوب' : 'تسليم مباشر مع البائع';
      screen.querySelector('[data-od-address]').textContent = o.method === 'courier' ? o.addr + ' · ' + o.addrLine : 'يُحدَّد المكان والوقت في محادثة الطلب';
      screen.querySelector('[data-od-sub]').innerHTML = riyal(10, 11) + (o.sub || o.total);
      screen.querySelector('[data-od-fee]').innerHTML = riyal(10, 11) + (o.fee || 0);
      screen.querySelector('[data-od-delivery]').innerHTML = o.delivery ? riyal(10, 11) + o.delivery : 'مجانًا';
      screen.querySelector('[data-od-total]').innerHTML = riyal(14, 15) + o.total;
      screen.querySelector('[data-act="chat"]').style.visibility = 'visible';
      var light = 'flex: 1; height: 54px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700';
      var dark = 'flex: 1.3; height: 54px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 15px; font-weight: 700';
      var bar = screen.querySelector('[data-od-bar]'), btn = function (act, label, style) { return '<button type="button" data-act="' + act + '" style="' + style + '">' + label + '</button>'; };
      bar.style.display = 'flex';
      bar.innerHTML = st === 'preparing' ? btn('cancel', 'إلغاء الطلب', light) + btn('chat', 'تواصل مع البائع', dark)
        : st === 'shipping' ? btn('report', 'الإبلاغ عن مشكلة', light) + btn('chat', 'تواصل مع البائع', dark)
        : st === 'disputed' ? btn('dispute', 'تفاصيل البلاغ', light) + btn('chat', 'تواصل مع البائع', dark)
        : st === 'handover' ? btn('chat', 'تواصل مع البائع', dark.replace('flex: 1.3', 'flex: 1'))
        : st === 'arrived' || st === 'handed' ? btn('report', 'الإبلاغ عن مشكلة', light) + btn('confirm', 'تأكيد الاستلام', dark)
        : st === 'completed' ? (ratings()[o.no + '|buy'] ? btn('rated', 'قيّمت البائع · ' + ratings()[o.no + '|buy'].stars + ' من 5', light) : btn('rate', 'تقييم البائع', dark.replace('flex: 1.3', 'flex: 1')))
        : '';
      if (!bar.innerHTML) bar.style.display = 'none';
    };
    var ask = askSheet;
    renderOrder();
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || !screen.contains(b) || b.closest('.proto-sheet-wrap')) return;
      var act = b.getAttribute('data-act');
      e.preventDefault(); e.stopPropagation();
      var stamp = fmtDate(new Date(), true);
      if (act === 'confirm') ask('تأكيد الاستلام؟', 'بعد التأكيد يكتمل الطلب وتصبح مستحقات البائع متاحة في محفظته، ولا يمكن فتح نزاع بعدها.', 'نعم، استلمت القطع', 'ليس بعد', function () {
        o.status = 'completed'; o.times = o.times || {}; o.times.completed = stamp; saveOrder(o); renderOrder(); toast('تم تأكيد الاستلام، شكرًا!'); });
      else if (act === 'cancel') ask('إلغاء الطلب؟', 'سيتم إلغاء الطلب وإرجاع المبلغ المدفوع للمحفظة.', 'إلغاء الطلب', 'رجوع', function () {
        o.status = 'cancelled'; o.times = o.times || {}; o.times.cancelled = stamp; saveOrder(o);
        var wl = wallet(); wl.tx.unshift({ type: 'refund', amt: o.total, ref: o.no, date: stamp.split(' · ')[0], month: 'نوفمبر 2026', reason: 'إلغاء الطلب قبل الشحن', status: 'قيد التسوية', settleAt: Date.now() + 60000 }); write('outlet-wallet-v1', wl); renderOrder(); toast('تم إلغاء الطلب، وسُجّل المبلغ في المحفظة وسيصبح متاحًا بعد التسوية'); });
      else if (act === 'chat') { write('outlet-chat-view', o.no); location.href = 'chat.html'; }
      else if (act === 'report') { write('outlet-order-view', o.no); location.href = 'report.html'; }
      else if (act === 'dispute') { write('outlet-order-view', o.no); location.href = 'dispute.html'; }
      else if (act === 'rate') { write('outlet-rate-view', { no: o.no, role: 'buy' }); location.href = 'rate.html'; }
      else if (act === 'rated') toast('تم تقييم هذا الطلب، ولا يمكن تعديل التقييم');
      else if (act === 'invoice') { write('outlet-invoice-view', o.no); location.href = 'invoice.html'; }
    }, true);
  }

  // ---------- U-17 report a problem ----------
  if (page === 'report.html') {
    var rno = read('outlet-order-view', 'OUT-24790');
    var ro = allOrders().filter(function (x) { return x.no === rno; })[0] || demoOrders()[0];
    if (ro.status === 'disputed') { location.replace('report-sent.html'); return; } // one open dispute per order
    var rIt = ro.items[0];
    screen.querySelector('[data-rp-no]').textContent = ro.no;
    var rImg = screen.querySelector('[data-rp-thumb] img'); rImg.src = rIt.src; rImg.alt = rIt.alt || rIt.name;
    screen.querySelector('[data-rp-name]').textContent = rIt.name + (ro.items.length > 1 ? ' + ' + (ro.items.length - 1) + ' قطع' : '');
    screen.querySelector('[data-rp-meta]').textContent = 'من ' + ro.seller[0] + ' · المقاس ' + rIt.size;
    var pillBox = document.createElement('span'); pillBox.innerHTML = statusPill(effSt(ro));
    screen.querySelector('[data-rp-status]').replaceWith(pillBox.firstChild);
    var notYet = !(effSt(ro) === 'arrived' || effSt(ro) === 'handed');
    var reasonBtns = [].slice.call(screen.querySelectorAll('[data-reason]')), reason = 'mismatch'; // demo build: the first reason comes picked, as on the board
    var sendBtn = screen.querySelector('[data-rp-send]');
    var paintReasons = function () {
      reasonBtns.forEach(function (b) {
        var on = b.getAttribute('data-reason') === reason, ring = b.firstElementChild;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.style.background = on ? '#FFF4EC' : '#F7F3F093';
        ring.style.borderColor = on ? '#C2410C' : '#C9BFB7';
        ring.innerHTML = on ? '<span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span>' : '';
      });
      sendBtn.style.opacity = reason ? '1' : '0.35';
    };
    if (notYet) {
      // before the courier arrives, only "didn't arrive" can be reported
      reason = 'missing';
      reasonBtns.forEach(function (b) { if (b.getAttribute('data-reason') !== 'missing') { b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.style.opacity = '0.45'; } });
      var hint = document.createElement('p');
      hint.style.cssText = 'margin: 0; font-size: 12px; line-height: 18px; color: #6B635D';
      hint.textContent = 'قبل أن يسلّم المندوب الطلب، يمكن الإبلاغ فقط عن عدم وصول الطلب.';
      screen.querySelector('[role="radiogroup"]').after(hint);
    }
    paintReasons();
    reasonBtns.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); if (b.disabled) return; reason = b.getAttribute('data-reason'); paintReasons(); }); });
    var txt = screen.querySelector('[data-rp-text]'), cnt = screen.querySelector('[data-rp-count]');
    txt.addEventListener('input', function () { cnt.textContent = txt.value.length + ' / 500'; });
    demoFill(txt, 'المقاس المكتوب في الإعلان 40، والحذاء اللي وصلني مقاسه 38.'); cnt.textContent = txt.value.length + ' / 500';
    // photos: real file picker, previews only (nothing is uploaded in the prototype)
    var photosBox = screen.querySelector('[data-rp-photos]'), addTile = screen.querySelector('[data-rp-add]'), photoTpl = screen.querySelector('[data-rp-photo]');
    photoTpl = photoTpl.cloneNode(true); // demo build: the board's sample photo stays attached
    var picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/*'; picker.multiple = true; picker.hidden = true; screen.appendChild(picker);
    var photoCount = function () { return photosBox.querySelectorAll('[data-rp-photo]').length; };
    addTile.addEventListener('click', function (e) { e.stopPropagation(); picker.click(); });
    picker.addEventListener('change', function () {
      [].slice.call(picker.files).forEach(function (f) {
        if (photoCount() >= 4) return;
        var tile = photoTpl.cloneNode(true), im = tile.querySelector('img');
        im.src = URL.createObjectURL(f); im.alt = 'صورة مرفقة'; im.style.objectFit = 'cover'; im.style.mixBlendMode = 'normal';
        tile.style.padding = '0';
        var shrink = new Image(); shrink.onload = function () { var k = Math.min(1, 240 / Math.max(shrink.width, shrink.height)), cv = document.createElement('canvas'); cv.width = Math.round(shrink.width * k); cv.height = Math.round(shrink.height * k); cv.getContext('2d').drawImage(shrink, 0, 0, cv.width, cv.height); tile.setAttribute('data-shot', cv.toDataURL('image/jpeg', 0.7)); }; shrink.src = im.src;
        photosBox.appendChild(tile);
      });
      picker.value = '';
      if (photoCount() >= 4) { addTile.style.display = 'none'; toast('وصلت للحد: 4 صور'); }
    });
    photosBox.addEventListener('click', function (e) {
      e.stopPropagation();
      var rm = e.target.closest('[data-rp-remove]'); if (!rm) return;
      rm.closest('[data-rp-photo]').remove(); addTile.style.display = 'flex';
    });
    sendBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (!reason) { toast('سبب المشكلة مطلوب'); return; }
      var stamp = fmtDate(new Date(), true);
      ro.prevStatus = ro.status; ro.status = 'disputed';
      ro.dispute = { ref: 'DSP-' + (1040 + Math.floor(Math.random() * 900)), reason: reason, text: txt.value.trim(), photos: photoCount(), shots: [].map.call(photosBox.querySelectorAll('[data-shot]'), function (t) { return t.getAttribute('data-shot'); }), date: stamp };
      ro.times = ro.times || {}; ro.times.disputed = stamp;
      saveOrder(ro);
      location.replace('report-sent.html');
    }, true);
  }

  if (page === 'report-sent.html') {
    var sno = read('outlet-order-view', 'OUT-24790');
    var so = allOrders().filter(function (x) { return x.no === sno; })[0];
    if (so && so.dispute) {
      screen.querySelector('[data-rs-ref]').textContent = so.dispute.ref;
      screen.querySelector('[data-rs-no]').textContent = so.no;
      screen.querySelector('[data-rs-reason]').textContent = REASONS[so.dispute.reason];
      if (so.dispute.reason === 'missing') screen.querySelector('[data-rs-outcome]').textContent = 'إذا تأكدنا أن الطلب لم يصل أو وصل تالفًا، يعود المبلغ لمحفظتك. وإن لم يكن كذلك، يكتمل الطلب.';
    }
    screen.querySelector('[data-rs-chat]').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); write('outlet-chat-view', sno); location.href = 'chat.html'; }, true);
  }

  // ---------- U-18 dispute details ----------
  if (page === 'dispute.html') {
    var dno = read('outlet-order-view', 'OUT-24790');
    var dor = allOrders().filter(function (x) { return x.no === dno; })[0];
    if (!dor || !dor.dispute) { location.replace('order.html'); return; }
    var D = dor.dispute, dec = D.decision, $ = function (s) { return screen.querySelector(s); };
    $('[data-ds-ref]').textContent = D.ref;
    $('[data-ds-date]').textContent = String(D.date).split(' · ')[0];
    var C = !dec ? { card: '#FFF4EC', fg: '#9A3412', pill: 'قيد المراجعة', title: 'فريق outlet يراجع بلاغك', sub: 'الطلب متوقف والمبلغ محجوز حتى صدور القرار. سيصلك إشعار فور صدوره.' }
      : dec === 'buyer' && D.stage === 'refunded' ? { card: '#ECF6EF', fg: '#1F7A4D', pill: 'تم الاسترداد', title: 'المبلغ رجع لمحفظتك', sub: 'استلم البائع القطعة وتم إلغاء الطلب.' }
      : dec === 'buyer' ? { card: '#ECF6EF', fg: '#1F7A4D', pill: 'تم قبول البلاغ', title: 'القرار لصالحك', sub: 'ستعود القطعة للبائع على حسابه، ويعود المبلغ لمحفظتك فور استلام البائع لها.' }
      : { card: '#F7F3F093', fg: '#6B635D', pill: 'تم رفض البلاغ', title: 'القرار لصالح البائع', sub: 'اكتمل الطلب وأصبحت مستحقات البائع متاحة.' };
    var box = $('[data-ds-status]');
    box.style.background = C.card;
    box.innerHTML = '<span style="height: 26px; padding: 0 10px; border-radius: 999px; background: #FFFFFF; color: ' + C.fg + '; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; flex: none; align-self: flex-start">' + C.pill + '</span>' +
      '<span style="font-size: 18px; line-height: 26px; font-weight: 700">' + C.title + '</span><span style="font-size: 13px; line-height: 20px; color: #6B635D">' + C.sub + '</span>';
    var dsteps = !dec ? [['تم إرسال البلاغ', D.date, 'done'], ['قيد المراجعة', 'نراجع البلاغ والصور والمحادثة وسجل التوصيل', 'now'], ['القرار', '', 'todo']]
      : dec === 'buyer' ? [['تم إرسال البلاغ', D.date, 'done'], ['المراجعة', D.reviewed || '', 'done'], ['القرار لصالحك', D.decided || '', 'done'],
          ['شحنة الإرجاع', D.stage === 'refunded' ? (D.returned || '') : 'سيستلم المندوب القطعة من عنوانك', D.stage === 'refunded' ? 'done' : 'now'],
          ['المبلغ يرجع للمحفظة', D.stage === 'refunded' ? (D.refunded || '') : 'بعد استلام البائع للقطعة', D.stage === 'refunded' ? 'done' : 'todo']]
      : [['تم إرسال البلاغ', D.date, 'done'], ['المراجعة', D.reviewed || '', 'done'], ['القرار لصالح البائع', D.decided || '', 'done']];
    $('[data-ds-timeline]').innerHTML = dsteps.map(function (s, i) { return stepHTML(s[0], s[1], s[2], i === dsteps.length - 1); }).join('');
    var decBox = $('[data-ds-decision]');
    if (dec) {
      var sec = document.createElement('section');
      sec.style.cssText = 'display: flex; flex-direction: column; gap: 10px';
      sec.innerHTML = '<h2 style="margin: 0; font-size: 16px; line-height: 24px; font-weight: 700">قرار الإدارة</h2><div style="padding: 14px; border-radius: 18px; background: #F7F3F093; display: flex; flex-direction: column; gap: 12px"><p style="margin: 0; font-size: 14px; line-height: 22px">' + esc(D.verdict || '') + '</p>' +
        (dec === 'buyer' ? '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px"><span style="font-size: 13px; line-height: 20px; color: #6B635D">' + (D.stage === 'refunded' ? 'رجع لمحفظتك' : 'سيعود لمحفظتك') + '</span><span style="direction: ltr; display: inline-flex; align-items: center; gap: 5px; font-size: 18px; font-weight: 700">' + riyal(11, 12) + dor.total + '</span></div>' : '') + '</div>';
      decBox.replaceWith(sec);
    } else if (decBox) decBox.remove();
    $('[data-ds-reason]').textContent = REASONS[D.reason];
    if (D.text) $('[data-ds-text]').textContent = D.text; else $('[data-ds-text-row]').remove();
    var shots = D.shots || [];
    if (shots.length) {
      $('[data-ds-photos]').innerHTML = shots.map(function (src) { return '<span style="width: 64px; height: 64px; flex: none; border-radius: 14px; background: #FFFFFF; overflow: hidden; display: flex; align-items: center; justify-content: center"><img src="' + src + '" alt="صورة مرفقة بالبلاغ" style="width: 100%; height: 100%; object-fit: cover"></span>'; }).join('');
    } else $('[data-ds-photos-row]').remove();
    var dIt = dor.items[0], dImg = $('[data-ds-thumb]'); dImg.src = dIt.src; dImg.alt = dIt.alt || dIt.name;
    $('[data-ds-name]').textContent = dIt.name + (dor.items.length > 1 ? ' + ' + (dor.items.length - 1) + ' قطع' : '');
    $('[data-ds-meta]').textContent = dor.no + ' · من ' + dor.seller[0];
    $('[data-ds-total]').innerHTML = riyal(11, 12) + dor.total;
    $('[data-ds-note]').textContent = !dec ? 'محادثة الطلب مع البائع متاحة طوال فترة المراجعة.' : 'صدر القرار، وأصبحت محادثة الطلب للقراءة فقط. يتابع فريق outlet الإرجاع مع البائع.';
    screen.addEventListener('click', function (e) {
      var c = e.target.closest('[data-ds-chat]'), od = e.target.closest('[data-ds-order]');
      if (c) { e.preventDefault(); e.stopPropagation(); write('outlet-chat-view', dor.no); location.href = 'chat.html'; }
      else if (od) { e.preventDefault(); e.stopPropagation(); location.href = 'order.html'; }
    }, true);
  }

  // ---------- U-31 / U-32 chats (one chat per paid order) ----------
  var LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none"><path d="M6 10V8c0-3.31 1-6 6-6s6 2.69 6 6v2M12 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path><path d="M17 22H7c-4 0-5-1-5-5v-2c0-4 1-5 5-5h10c4 0 5 1 5 5v2c0 4-1 5-5 5Z"></path></svg>';
  function chatStore() {
    var c = read('outlet-chats-v1', null);
    if (c) return c;
    c = {
      'OUT-24790': { unread: 1, msgs: [['day', '6 نوفمبر'], ['sys', 'تم الدفع وفُتحت المحادثة'], ['safe'],
        ['them', 'أهلًا! شكرًا على الطلب، سأجهّز الحذاء اليوم.', '3:25 م'], ['me', 'تمام، هل هو نظيف من الداخل؟', '3:31 م'],
        ['them', 'نعم، مغسول ومُلمّع. هذه صورته قبل التغليف.', '3:40 م', 'assets/sneakers.jpg'],
        ['day', 'اليوم'], ['sys', 'المندوب سلّم الطلب'], ['them', 'هل سلّمه المندوب؟ لو فيه أي شيء أرجو إبلاغي هنا.', '1:20 م']] },
      'OUT-24833': { unread: 2, msgs: [['day', 'اليوم'], ['sys', 'تم الدفع وفُتحت المحادثة'], ['safe'],
        ['them', 'أهلًا، اشتريت السويتر.', '12:04 م'], ['them', 'متى سيمر المندوب للاستلام؟', '12:05 م']] },
      'OUT-24655': { unread: 0, msgs: [['day', '30 أكتوبر'], ['sys', 'تم الدفع وفُتحت المحادثة'], ['safe'],
        ['them', 'شكرًا على الطلب! سأشحنه غدًا صباحًا.', '2:30 م'], ['day', '1 نوفمبر'], ['sys', 'المندوب سلّم الطلب'],
        ['me', 'فيه قطع صغير بجانب الكم لم يكن ظاهرًا في الصور.', '8:32 م'], ['sys', 'تم فتح بلاغ على الطلب'],
        ['day', 'أمس'], ['them', 'تمام، سأنتظر قرار outlet وأستلم القطعة.', '6:10 م']] },
      'OUT-24611': { unread: 0, msgs: [['day', '28 أكتوبر'], ['sys', 'تم الدفع وفُتحت المحادثة'], ['safe'],
        ['them', 'أهلًا! التسليم مباشر، يناسبك نتقابل بكرة الساعة 5 العصر؟', '9:20 م'], ['me', 'تمام، 5 مناسب. نتقابل عند المدخل الرئيسي للمول.', '9:26 م'],
        ['day', '29 أكتوبر'], ['them', 'أنا وصلت عند المدخل.', '4:58 م'], ['me', 'استلمت، شكرًا!', '5:30 م'],
        ['sys', 'تم تأكيد الاستلام واكتمل الطلب'], ['them', 'شكرًا، أتمنى البنطلون يعجبك.', '7:05 م']] },
      'OUT-24502': { unread: 0, msgs: [['day', '20 أكتوبر'], ['sys', 'تم الدفع وفُتحت المحادثة'], ['safe'],
        ['me', 'أهلًا، هل الشنطة ما زالت متاحة؟', '2:50 م'], ['sys', 'تم إلغاء الطلب، ورجع المبلغ للمحفظة'], ['them', 'عذرًا، تم إلغاء الطلب.', '4:15 م']] }
    };
    write('outlet-chats-v1', c);
    return c;
  }
  function chatFor(store, o) {
    if (!store[o.no]) store[o.no] = { unread: 0, msgs: [['day', String(o.date).split(' ').slice(0, 2).join(' ')], ['sys', 'تم الدفع وفُتحت المحادثة'], ['safe']] };
    return store[o.no];
  }
  function chatOrders() { return allOrders().map(function (o) { return Object.assign({ role: 'buy' }, o); }).concat(SELL_ORDERS); }
  function chatClosed(o) { var s = effSt(o); return s === 'completed' || s === 'cancelled' || s === 'refunded' || !!(o.dispute && o.dispute.decision); }
  function chatOther(o) { return o.role === 'sell' ? o.buyer : o.seller[0]; }
  function lastOf(ch) {
    for (var i = ch.msgs.length - 1; i >= 0; i--) { var m = ch.msgs[i]; if (m[0] === 'me' || m[0] === 'them') return m; }
    return ['sys', 'تم الدفع وفُتحت المحادثة', ''];
  }
  function lastDay(ch) { for (var i = ch.msgs.length - 1; i >= 0; i--) if (ch.msgs[i][0] === 'day') return ch.msgs[i][1]; return ''; }
  function chatUnreadTotal() { var s = chatStore(); return Object.keys(s).reduce(function (n, k) { return n + (s[k].unread || 0); }, 0); }
  // unread dot on the "الرسائل" tab of every bottom bar
  (function () {
    var tab = document.querySelector('nav a[href="#messages"], nav a[href="messages.html"]');
    if (!tab || !chatUnreadTotal()) return;
    var ic = tab.querySelector('svg'); if (!ic) return;
    var wrap = document.createElement('span'); wrap.style.cssText = 'position: relative; display: flex';
    ic.parentNode.insertBefore(wrap, ic); wrap.appendChild(ic);
    wrap.insertAdjacentHTML('beforeend', '<span aria-label="رسائل جديدة" style="position: absolute; top: -2px; left: -3px; width: 9px; height: 9px; border-radius: 999px; background: #EA580C; box-shadow: 0 0 0 2px #FFFFFF"></span>');
  })();
  var miniPill = function (t, bg, fg) { return '<span style="height: 22px; padding: 0 8px; border-radius: 999px; background: ' + bg + '; color: ' + fg + '; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; flex: none">' + t + '</span>'; };

  if (page === 'messages.html') {
    var cStore = chatStore(), cFilter = 'all';
    var cList = screen.querySelector('[data-chat-list]'), cEmpty = screen.querySelector('[data-chat-empty]');
    cList.querySelectorAll('[data-chat-row]').forEach(function (r) { r.remove(); });
    var renderChats = function () {
      cList.querySelectorAll('[data-chat-row]').forEach(function (r) { r.remove(); });
      var shown = 0;
      var mins = function (t) { var m = /(d+):(d+)s*([صم])/.exec(t || ''); if (!m) return 0; return (+m[1] % 12 + (m[3] === 'م' ? 12 : 0)) * 60 + +m[2]; };
      var rank = function (o) { var ch = chatFor(cStore, o), d = lastDay(ch); return d === 'اليوم' ? 3000 - mins(lastOf(ch)[2]) : d === 'أمس' ? 5000 : 9000; };
      chatOrders().map(function (o, i) { return [rank(o), i, o]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }).map(function (x) { return x[2]; }).forEach(function (o) {
        if (cFilter !== 'all' && o.role !== cFilter) return;
        var ch = chatFor(cStore, o), last = lastOf(ch), it = o.items[0], closed = chatClosed(o);
        var day = lastDay(ch), when = day === 'اليوم' ? last[2] : day;
        var html = '<a href="chat.html" data-chat-row data-no="' + o.no + '" style="padding: 12px; border-radius: 18px; background: #F7F3F093; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #1C1917">' +
          '<span style="width: 52px; height: 60px; flex: none; border-radius: 12px; background: #FFFFFF; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box"><img src="' + it.src + '" alt="' + esc(it.alt || it.name) + '" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply"></span>' +
          '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px">' +
          '<span style="display: flex; align-items: center; gap: 8px"><span style="flex: 1; min-width: 0; font-size: 15px; line-height: 22px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">' + esc(chatOther(o)) + '</span><span style="font-size: 12px; color: #8E857F; flex: none">' + (when || '') + '</span></span>' +
          '<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16px; color: #6B635D">' + (o.role === 'sell' ? miniPill('بيع', '#FDEBDD', '#9A3412') : miniPill('شراء', '#FFFFFF', '#6B635D')) + '<span style="direction: ltr">' + o.no + '</span>' +
          (closed ? '<span style="display: inline-flex; align-items: center; gap: 3px; color: #8E857F">' + LOCK_SVG + 'للقراءة فقط</span>' : '') + '</span>' +
          '<span style="display: flex; align-items: center; gap: 8px"><span style="flex: 1; min-width: 0; font-size: 13px; line-height: 20px; ' + (ch.unread ? 'color: #1C1917; font-weight: 700' : 'color: #6B635D; font-weight: 400') + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">' + (last[3] && !last[1] ? 'صورة' : esc(last[1])) + '</span>' +
          (ch.unread ? '<span style="min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: #EA580C; color: #FFFFFF; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex: none">' + ch.unread + '</span>' : '') +
          '</span></span></a>';
        cEmpty.insertAdjacentHTML('beforebegin', html); shown++;
      });
      write('outlet-chats-v1', cStore);
      cEmpty.style.display = shown ? 'none' : 'block';
      screen.querySelectorAll('[data-chat-filter]').forEach(function (b) {
        var on = b.getAttribute('data-chat-filter') === cFilter;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500';
      });
    };
    renderChats();
    screen.addEventListener('click', function (e) {
      var f = e.target.closest('[data-chat-filter]'), r = e.target.closest('[data-chat-row]');
      if (f) { e.preventDefault(); e.stopPropagation(); cFilter = f.getAttribute('data-chat-filter'); renderChats(); }
      else if (r) { e.preventDefault(); e.stopPropagation(); write('outlet-chat-view', r.getAttribute('data-no')); location.href = 'chat.html'; }
    }, true);
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) { cStore = chatStore(); renderChats(); } });
  }

  if (page === 'chat.html') {
    var kStore = chatStore(), kNo = read('outlet-chat-view', 'OUT-24790');
    var ko = chatOrders().filter(function (x) { return x.no === kNo; })[0] || chatOrders()[0];
    var kc = chatFor(kStore, ko); kc.unread = 0; write('outlet-chats-v1', kStore);
    var q = function (s) { return screen.querySelector(s); };
    var other = chatOther(ko), kClosed = chatClosed(ko);
    q('[data-chat-initial]').textContent = other.charAt(0);
    q('[data-chat-name]').textContent = other;
    q('[data-chat-sub]').textContent = (ko.role === 'sell' ? 'المشتري' : 'البائع') + ' · ' + (kClosed ? 'للقراءة فقط' : 'محادثة نشطة');
    var kIt = ko.items[0], kImg = q('[data-chat-order] img'); kImg.src = kIt.src; kImg.alt = kIt.alt || kIt.name;
    q('[data-chat-item]').textContent = kIt.name; q('[data-chat-no]').textContent = ko.no;
    q('[data-chat-status]').innerHTML = statusPill(effSt(ko)).replace('height: 26px; padding: 0 10px', 'height: 22px; padding: 0 8px').replace('font-size: 12px', 'font-size: 11px');
    var box = q('[data-chat-msgs]');
    var SAFE_TXT = 'للأمان، لا تتم مشاركة أرقام الجوال أو البيانات البنكية. الدفع والتواصل داخل outlet فقط.';
    var msgHTML = function (m) {
      if (m[0] === 'day') return '<span style="align-self: center; height: 24px; padding: 0 10px; border-radius: 999px; background: #F7F3F0; color: #6B635D; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; margin: 8px 0 2px">' + m[1] + '</span>';
      if (m[0] === 'sys') return '<span style="align-self: center; max-width: 86%; text-align: center; padding: 6px 12px; border-radius: 12px; background: #FEF6E7; color: #9A5800; font-size: 12px; line-height: 18px; font-weight: 700">' + m[1] + '</span>';
      if (m[0] === 'safe') return '<span style="align-self: center; max-width: 90%; text-align: center; font-size: 11px; line-height: 16px; color: #8E857F">' + SAFE_TXT + '</span>';
      var me = m[0] === 'me', side = me ? 'flex-end' : 'flex-start';
      var bub = me ? 'background: #1C1917; color: #FFFFFF; border-radius: 18px 18px 18px 6px' : 'background: #F7F3F0; color: #1C1917; border-radius: 18px 18px 6px 18px';
      var body = m[3] ? '<span style="display: flex; flex-direction: column; gap: 6px; padding: 6px; ' + bub + '"><span style="width: 190px; height: 190px; border-radius: 14px; background: #FFFFFF; overflow: hidden; display: flex; align-items: center; justify-content: center"><img src="' + m[3] + '" alt="' + (me ? 'صورة مرسلة' : 'صورة من ' + esc(other)) + '" style="width: 100%; height: 100%; object-fit: ' + (m[3].indexOf('assets/') === 0 ? 'contain; padding: 10px; box-sizing: border-box; mix-blend-mode: multiply' : 'cover') + '"></span>' + (m[1] ? '<span style="padding: 0 6px 4px; font-size: 14px; line-height: 22px">' + esc(m[1]) + '</span>' : '') + '</span>'
        : '<span style="padding: 10px 14px; font-size: 14px; line-height: 22px; white-space: pre-wrap; word-break: break-word; ' + bub + '">' + esc(m[1]) + '</span>';
      return '<div style="align-self: ' + side + '; max-width: 78%; display: flex; flex-direction: column; align-items: ' + side + '; gap: 3px">' + body + '<span style="font-size: 11px; line-height: 14px; color: #8E857F; padding: 0 4px">' + (m[2] || '') + '</span></div>';
    };
    var renderMsgs = function () { box.innerHTML = kc.msgs.map(msgHTML).join(''); box.scrollTop = box.scrollHeight; };
    renderMsgs();
    var form = q('[data-chat-form]');
    if (kClosed) {
      form.outerHTML = '<div style="flex: none; padding: 14px 18px 30px; background: #FFFFFF; box-shadow: 0 -8px 24px rgba(28,25,23,0.06); display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; line-height: 20px; color: #6B635D">' + LOCK_SVG + '<span>' + (ko.status === 'cancelled' ? 'تم إلغاء الطلب، فالمحادثة للقراءة فقط.' : 'اكتمل الطلب، لذا المحادثة للقراءة فقط.') + '</span></div>';
    } else {
      var inp = q('[data-chat-input]'), replied = false;
      var now = function () { return fmtDate(new Date(), true).split(' · ')[1]; };
      var ensureToday = function () { if (lastDay(kc) !== 'اليوم') kc.msgs.push(['day', 'اليوم']); };
      var push = function (m) { ensureToday(); kc.msgs.push(m); write('outlet-chats-v1', kStore); renderMsgs(); };
      var autoReply = function () {
        if (replied) return; replied = true;
        setTimeout(function () { push(['them', 'وصلت رسالتك، سأرد عليك بعد قليل.', now()]); }, 1600);
      };
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var t = inp.value.trim(); if (!t) return;
        push(['me', t, now()]); inp.value = ''; autoReply();
      });
      var kPick = document.createElement('input'); kPick.type = 'file'; kPick.accept = 'image/*'; kPick.hidden = true; screen.appendChild(kPick);
      q('[data-chat-attach]').addEventListener('click', function (e) { e.stopPropagation(); kPick.click(); });
      kPick.addEventListener('change', function () {
        var f = kPick.files[0]; kPick.value = ''; if (!f) return;
        var im = new Image(); im.onload = function () {
          var k = Math.min(1, 480 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
          cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(im.src); push(['me', '', now(), cv.toDataURL('image/jpeg', 0.75)]); autoReply();
        };
        im.src = URL.createObjectURL(f);
      });
      q('[data-chat-send]').addEventListener('click', function (e) { e.stopPropagation(); });
    }
    q('[data-chat-order]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (ko.role === 'sell') { write('outlet-inc-view', ko.no); location.href = 'incoming-order.html'; return; }
      write('outlet-order-view', ko.no); location.href = 'order.html';
    }, true);
  }

  // ---------- U-27..U-30 wallet: one ledger, balances are computed from it ----------
  var WD_FEE = 5; // placeholder bank-transfer fee (the client sets the real one)
  var WBANKS = { '05': 'مصرف الإنماء', '10': 'البنك الأهلي السعودي', '15': 'بنك البلاد', '20': 'بنك الرياض', '30': 'البنك العربي الوطني', '45': 'البنك السعودي الأول', '55': 'البنك السعودي الفرنسي', '60': 'بنك الجزيرة', '65': 'البنك السعودي للاستثمار', '80': 'مصرف الراجحي' };
  var TXT = {
    pend: ['أرباح بيع معلقة', '#FEF6E7', '#9A5800', 'coin'], earn: ['أرباح بيع متاحة', '#ECF6EF', '#1F7A4D', 'coin'], refund: ['استرداد مبلغ', '#ECF6EF', '#1F7A4D', 'refund'],
    wd: ['طلب سحب', '#F7F3F0', '#1C1917', 'bank'], release: ['إعادة مبلغ محجوز', '#ECF6EF', '#1F7A4D', 'back']
  };
  var TXI = {
    coin: '<path d="M8.67 14.33c0 1.29.99 2.33 2.22 2.33h2.51c1.07 0 1.94-.91 1.94-2.03 0-1.22-.53-1.65-1.32-1.93l-4.03-1.4c-.79-.28-1.32-.71-1.32-1.93 0-1.12.87-2.03 1.94-2.03h2.51c1.23 0 2.22 1.04 2.22 2.33M12 6v12"></path><path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10Z"></path>',
    refund: '<path d="M9.57 5.93 3.5 12l6.07 6.07M20.5 12H3.67"></path>',
    bank: '<path d="M12.37 2.15l9 3.6c.35.14.63.56.63.93V10c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1V6.68c0-.37.28-.79.63-.93l9-3.6c.2-.08.54-.08.74 0ZM22 22H2v-3c0-.55.45-1 1-1h18c.55 0 1 .45 1 1v3ZM4 18v-7M8 18v-7M12 18v-7M16 18v-7M20 18v-7M1 22h22"></path><path d="M12 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>',
    back: '<path d="M14.99 19.5 9 13.51 14.99 7.52M9 13.51h7.84c3.36 0 6.16-2.75 6.16-6.11"></path>'
  };
  var WST = { 'معلّق': ['#FEF6E7', '#9A5800'], 'قيد التنفيذ': ['#FEF6E7', '#9A5800'], 'قيد التسوية': ['#FEF6E7', '#9A5800'], 'مكتمل': ['#ECF6EF', '#1F7A4D'], 'تمت': ['#ECF6EF', '#1F7A4D'], 'مرفوض': ['#FEF3F2', '#B42318'] };
  var wpill = function (s) { var c = WST[s]; return c ? '<span style="height: 22px; padding: 0 8px; border-radius: 999px; background: ' + c[0] + '; color: ' + c[1] + '; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; flex: none">' + s + '</span>' : ''; };
  var money = function (n, size, color) { return '<span style="direction: ltr; display: inline-flex; align-items: center; gap: 4px; font-size: ' + size + 'px; font-weight: 700; color: ' + (color || '#1C1917') + '">' + riyal(Math.round(size * 0.68), Math.round(size * 0.75)) + n + '</span>'; };
  function wallet() {
    var w = read('outlet-wallet-v1', null);
    if (w) {
      var settled = false;
      w.tx.forEach(function (t) { if (t.settleAt && Date.now() >= t.settleAt) { delete t.status; delete t.settleAt; settled = true; } });
      if (settled) write('outlet-wallet-v1', w);
      return w;
    }
    w = {
      tx: [
        { type: 'pend', amt: 102, ref: 'OUT-24833', date: '8 نوفمبر', month: 'نوفمبر 2026', status: 'معلّق' },
        { type: 'pend', amt: 108, ref: 'OUT-24810', date: '7 نوفمبر', month: 'نوفمبر 2026', status: 'معلّق' },
        { type: 'release', amt: 150, ref: 'WD-0201', date: '5 نوفمبر', month: 'نوفمبر 2026' },
        { type: 'wd', amt: -150, ref: 'WD-0201', date: '4 نوفمبر', month: 'نوفمبر 2026', status: 'مرفوض' },
        { type: 'earn', amt: 331, ref: 'OUT-24588', date: '2 نوفمبر', month: 'نوفمبر 2026' },
        { type: 'wd', amt: -300, ref: 'WD-0198', date: '27 أكتوبر', month: 'أكتوبر 2026', status: 'مكتمل' },
        { type: 'earn', amt: 255, ref: 'OUT-24420', date: '25 أكتوبر', month: 'أكتوبر 2026' },
        { type: 'refund', amt: 354, ref: 'OUT-24502', date: '20 أكتوبر', month: 'أكتوبر 2026', reason: 'إلغاء الطلب قبل الشحن' }
      ],
      wd: [
        { ref: 'WD-0201', date: '4 نوفمبر · 11:15 ص', amount: 150, fee: 5, status: 'مرفوض', reason: 'اسم صاحب الحساب غير مطابق لاسم الآيبان في البنك' },
        { ref: 'WD-0198', date: '27 أكتوبر · 9:30 م', amount: 300, fee: 5, status: 'مكتمل', done: '29 أكتوبر' }
      ]
    };
    write('outlet-wallet-v1', w);
    return w;
  }
  function walletSums(w) {
    w = w || wallet();
    var s = { free: 0, held: 0, reserved: 0 };
    w.tx.forEach(function (t) {
      // a refund is available only after the financial settlement (demo: a minute after it is recorded)
      if (t.type === 'refund' && t.settleAt) { if (Date.now() >= t.settleAt) { t.status = undefined; delete t.settleAt; } else t.status = 'قيد التسوية'; }
      if (t.type === 'pend' || t.status === 'قيد التسوية') s.held += t.amt; else s.free += t.amt; if (t.type === 'wd' && t.status === 'قيد التنفيذ') s.reserved -= t.amt;
    });
    return s;
  }
  function bankInfo() {
    var b = read('outlet-bank', { name: 'لمى الحربي', iban: '0380000000608010167519' });
    return { name: b.name, bank: WBANKS[b.iban.slice(2, 4)] || 'البنك', masked: 'SA' + b.iban.slice(0, 2) + ' •••• •••• ' + b.iban.slice(-4), last4: b.iban.slice(-4) };
  }
  function txHTML(t, i) {
    var T = TXT[t.type], plus = t.amt > 0;
    return '<button type="button" data-tx="' + i + '" style="width: 100%; border: 0; background: transparent; padding: 8px 0; display: flex; align-items: center; gap: 12px; font-family: inherit; color: #1C1917; text-align: right"><span aria-hidden="true" style="width: 40px; height: 40px; flex: none; border-radius: 999px; background: ' + T[1] + '; color: ' + T[2] + '; display: flex; align-items: center; justify-content: center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TXI[T[3]] + '</svg></span>' +
      '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; line-height: 20px; font-weight: 700">' + T[0] + '</span><span style="font-size: 12px; line-height: 16px; color: #8E857F"><span style="direction: ltr; display: inline-block">' + t.ref + '</span> · ' + t.date + (t.reason ? ' · ' + t.reason : '') + '</span></span>' +
      '<span style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px">' + money((plus ? '+' : '−') + Math.abs(t.amt), 15, t.type === 'pend' ? '#9A5800' : plus ? '#1F7A4D' : '#1C1917') + (wpill(t.status) || wpill('تمت')) + '</span></button>';
  }
  function txSheet(t) {
    var T = TXT[t.type];
    var NOTE = { pend: 'صافي أرباحك بعد عمولة المنصة. يُحرَّر للرصيد المتاح عند اكتمال الطلب.', earn: 'صافي أرباحك بعد عمولة المنصة، والطلب اكتمل.', refund: (t.reason ? 'السبب: ' + t.reason + '. ' : '') + (t.status === 'قيد التسوية' ? 'يصبح المبلغ متاحًا للسحب بعد انتهاء التسوية المالية.' : 'تم تسجيل المبلغ في رصيدك المتاح.'),
      wd: t.status === 'مرفوض' ? 'تم رفض الطلب، ورجع المبلغ لرصيدك في عملية «إعادة مبلغ محجوز».' : t.status === 'مكتمل' ? 'تم تحويله إلى حسابك البنكي.' : 'المبلغ محجوز حتى ينفّذ فريق outlet التحويل.', release: 'رجع لرصيدك المتاح بعد رفض طلب السحب.' };
    var r = function (l, v) { return '<div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; line-height: 22px"><span style="color: #6B635D">' + l + '</span>' + v + '</div>'; };
    mountSheet('<section role="dialog" aria-modal="true" aria-label="تفاصيل العملية" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
      '<div style="padding: 0 18px 28px; display: flex; flex-direction: column; gap: 14px"><div style="display: flex; flex-direction: column; align-items: center; gap: 4px"><span style="font-size: 14px; font-weight: 700; color: #6B635D">' + T[0] + '</span>' + money((t.amt > 0 ? '+' : '−') + Math.abs(t.amt), 30) + '</div>' +
      '<div style="padding: 12px 14px; border-radius: 16px; background: #F7F3F093; display: flex; flex-direction: column; gap: 6px">' + r('الحالة', wpill(t.status) || '<b>تمت</b>') + r('التاريخ', '<b>' + t.date + '</b>') + r(t.ref.indexOf('WD') === 0 ? 'طلب السحب' : 'الطلب', '<b style="direction: ltr">' + t.ref + '</b>') + '</div>' +
      '<p style="margin: 0; font-size: 13px; line-height: 20px; color: #6B635D">' + NOTE[t.type] + '</p>' +
      '<button type="button" data-act="close" style="height: 52px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700">تمام</button></div></section>', function () {}, null);
  }

  if (page === 'wallet.html') {
    var ws = walletSums(), ww = wallet();
    screen.querySelector('[data-w-free]').innerHTML = money(ws.free, 34);
    screen.querySelector('[data-w-held]').innerHTML = money(ws.held, 16);
    screen.querySelector('[data-w-reserved]').innerHTML = money(ws.reserved, 16);
    var wv = function (k) { return screen.querySelector('[data-row="' + k + '"] [data-row-value]'); };
    var pendingWd = ww.wd.filter(function (x) { return x.status === 'قيد التنفيذ'; }).length;
    wv('withdrawals').textContent = pendingWd ? pendingWd + ' قيد التنفيذ' : ww.wd.length;
    wv('bank').innerHTML = '<span style="direction: ltr; display: inline-block">•••• ' + bankInfo().last4 + '</span>';
    screen.querySelector('[data-w-recent]').innerHTML = ww.tx.slice(0, 4).map(txHTML).join('');
    var wbtn = screen.querySelector('[data-w-withdraw]');
    if (ws.free <= WD_FEE) { wbtn.style.opacity = '0.4'; }
    screen.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tx]');
      if (t) { e.preventDefault(); e.stopPropagation(); txSheet(ww.tx[+t.getAttribute('data-tx')]); return; }
      if (e.target.closest('[data-w-withdraw]') && ws.free <= WD_FEE) { e.preventDefault(); e.stopPropagation(); toast(ws.held ? 'لا يوجد رصيد متاح بعد، وتُحرَّر أرباحك المعلقة عند اكتمال الطلبات' : 'لا يوجد رصيد متاح للسحب'); }
    }, true);
  }

  if (page === 'wallet-history.html') {
    var hw = wallet(), hf = 'all', hl = screen.querySelector('[data-h-list]');
    var GROUP = { all: null, earn: ['pend', 'earn'], refund: ['refund'], wd: ['wd', 'release'] };
    var renderH = function () {
      var html = '', lastM = '';
      hw.tx.forEach(function (t, i) {
        if (GROUP[hf] && GROUP[hf].indexOf(t.type) === -1) return;
        if (t.month !== lastM) { lastM = t.month; html += '<h2 style="margin: 10px 0 2px; font-size: 13px; line-height: 20px; font-weight: 700; color: #6B635D">' + t.month + '</h2>'; }
        html += txHTML(t, i);
      });
      hl.innerHTML = html || '<p style="margin: 30px 0; text-align: center; font-size: 14px; color: #6B635D">لا توجد عمليات من هذا النوع.</p>';
      screen.querySelectorAll('[data-h-filter]').forEach(function (b) {
        var on = b.getAttribute('data-h-filter') === hf;
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500';
      });
    };
    renderH();
    screen.addEventListener('click', function (e) {
      var f = e.target.closest('[data-h-filter]'), t = e.target.closest('[data-tx]');
      if (f) { e.preventDefault(); e.stopPropagation(); hf = f.getAttribute('data-h-filter'); renderH(); }
      else if (t) { e.preventDefault(); e.stopPropagation(); txSheet(hw.tx[+t.getAttribute('data-tx')]); }
    }, true);
  }

  if (page === 'withdraw.html') {
    var dw = wallet(), dsum = walletSums(dw), bi = bankInfo();
    var amIn = screen.querySelector('[data-wd-amount]');
    screen.querySelector('[data-wd-avail]').innerHTML = 'المتاح للسحب: <b style="color: #1C1917">' + dsum.free + ' ريال</b>';
    screen.querySelector('[data-wd-bank]').textContent = bi.bank;
    screen.querySelector('[data-wd-iban]').textContent = bi.masked + ' · ' + bi.name;
    amIn.value = dsum.free > 0 ? dsum.free : 0;
    var quick = [].slice.call(screen.querySelectorAll('[data-wd-quick]'));
    var paintQ = function (k) { quick.forEach(function (b) { var on = b.getAttribute('data-wd-quick') === k; b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500'; }); };
    var recalc = function () {
      var v = parseInt(amIn.value.replace(/\D/g, ''), 10) || 0;
      screen.querySelector('[data-wd-sum]').innerHTML = money(v, 13);
      screen.querySelector('[data-wd-fee]').innerHTML = money(WD_FEE, 13);
      screen.querySelector('[data-wd-net]').innerHTML = money(Math.max(0, v - WD_FEE), 18);
      paintQ(v === dsum.free ? 'all' : v === Math.floor(dsum.free / 2) ? 'half' : '');
      return v;
    };
    recalc();
    amIn.addEventListener('input', function () { amIn.value = amIn.value.replace(/\D/g, '').slice(0, 6); recalc(); });
    quick.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); amIn.value = b.getAttribute('data-wd-quick') === 'all' ? dsum.free : Math.floor(dsum.free / 2); recalc(); }); });
    screen.querySelector('[data-wd-submit]').addEventListener('click', function (e) {
      e.stopPropagation();
      var v = recalc();
      if (!dsum.free) { toast('لا يوجد رصيد متاح للسحب'); return; }
      if (v <= 0) { toast('يجب أن يكون المبلغ أكبر من صفر'); return; }
      if (v > dsum.free) { toast('المبلغ أكبر من رصيدك المتاح (' + dsum.free + ' ريال)'); return; }
      if (v <= WD_FEE) { toast('يجب أن يكون المبلغ أكبر من رسوم التحويل'); return; }
      askSheet('تأكيد طلب السحب؟', 'سنحجز ' + v + ' ريال من رصيدك، وسيصل ' + (v - WD_FEE) + ' ريال على ' + bi.bank + ' •••• ' + bi.last4 + ' بعد أن ينفّذ فريق outlet التحويل.', 'تأكيد', 'رجوع', function () {
        var fresh = wallet(); if (v > walletSums(fresh).free) { toast('تغيّر رصيدك، يُرجى مراجعة المبلغ'); return; }
        var n = 207 + fresh.wd.filter(function (x) { return x.mine; }).length, ref = 'WD-0' + n, stamp = fmtDate(new Date(), true);
        fresh.wd.unshift({ ref: ref, date: 'اليوم · ' + stamp.split(' · ')[1], amount: v, fee: WD_FEE, status: 'قيد التنفيذ', mine: true, bank: bankInfo().bank, last4: bankInfo().last4 });
        fresh.tx.unshift({ type: 'wd', amt: -v, ref: ref, date: stamp.split(' · ')[0], month: 'نوفمبر 2026', status: 'قيد التنفيذ' });
        write('outlet-wallet-v1', fresh);
        write('outlet-wd-new', ref);
        location.replace('withdrawals.html');
      });
    });
  }

  if (page === 'withdrawals.html') {
    var lw = wallet(), lbi = bankInfo(), fresh = read('outlet-wd-new', '');
    var cardH = function (w) {
      var rej = w.status === 'مرفوض';
      var extra = w.status === 'مكتمل' ? '<span style="font-size: 12px; line-height: 18px; color: #6B635D">اتحوّل ' + w.done + ' · وصلك ' + (w.amount - w.fee) + ' ريال</span>'
        : w.status === 'قيد التنفيذ' ? '<span style="font-size: 12px; line-height: 18px; color: #6B635D">المبلغ محجوز حتى ينفّذ فريق outlet التحويل. سيصلك ' + (w.amount - w.fee) + ' ريال بعد خصم رسوم التحويل.</span>' : '';
      return '<div data-wd="' + w.ref + '" style="padding: 14px; border-radius: 18px; background: ' + (rej ? '#FEF3F2' : w.ref === fresh ? '#FFF4EC' : '#F7F3F093') + '; display: flex; flex-direction: column; gap: 10px">' +
        '<div style="display: flex; align-items: center; gap: 10px"><span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><b style="font-size: 15px; line-height: 22px; direction: ltr; text-align: right">' + w.ref + '</b><span style="font-size: 12px; line-height: 16px; color: #8E857F">' + w.date + '</span></span>' + money(w.amount, 18) + '</div>' +
        '<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 16px; color: #6B635D">' + wpill(w.status) + '<span style="direction: ltr">' + (w.bank || lbi.bank) + ' •••• ' + (w.last4 || lbi.last4) + '</span></div>' + extra +
        (rej ? '<div style="padding: 10px 12px; border-radius: 12px; background: #FFFFFF; font-size: 12px; line-height: 18px; color: #B42318"><b>سبب الرفض:</b> ' + esc(w.reason) + '. المبلغ رجع لرصيدك المتاح.' + (/بنك|آيبان|حساب/.test(w.reason || '') ? ' <a href="bank.html" style="color: #B42318; font-weight: 700">تعديل البيانات البنكية</a>' : '') + '</div>' : '') + '</div>';
    };
    screen.querySelector('[data-wd-list]').innerHTML = lw.wd.length ? lw.wd.map(cardH).join('') : '<p style="margin: 30px 0; text-align: center; font-size: 14px; color: #6B635D">لا توجد طلبات سحب سابقة.</p>';
    if (fresh) { toast('تم إرسال طلب السحب ' + fresh + '، وتم حجز المبلغ'); write('outlet-wd-new', ''); }
  }

  // ---------- U-36..U-40 profile, addresses, bank, policies, settings ----------
  var CITIES = [['الرياض', 25], ['جدة', 30], ['الدمام', 30], ['الخبر', 30], ['مكة', 30], ['المدينة المنورة', 30], ['القريات', null]];
  var cityFee = function (c) { var f = CITIES.filter(function (x) { return x[0] === c; })[0]; return f ? f[1] : null; };
  function profile() { return read('outlet-profile', { name: 'لمى الحربي', phone: '+966 55 123 4567', city: 'الرياض' }); }
  function saveAddrs() { write('outlet-addrs', ADDRS); }
  // pick-one sheet (cities, language)
  function pickSheet(title, options, current, onPick) {
    mountSheet('<section role="dialog" aria-modal="true" aria-label="' + title + '" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
      '<h2 style="margin: 0; padding: 0 18px 8px; font-size: 20px; line-height: 28px; font-weight: 700">' + title + '</h2><div style="display: flex; flex-direction: column; gap: 8px; padding: 0 18px 28px">' +
      options.map(function (o) { var on = o === current; return '<button type="button" data-act="pick" data-val="' + o + '" style="min-height: 52px; border: 0; border-radius: 16px; background: ' + (on ? '#FFF4EC' : '#F7F3F093') + '; padding: 0 14px; display: flex; align-items: center; gap: 12px; font-family: inherit; font-size: 15px; font-weight: ' + (on ? 700 : 500) + '; color: #1C1917; text-align: right"><span aria-hidden="true" style="order: 2; margin-right: auto; width: 22px; height: 22px; flex: none; box-sizing: border-box; border-radius: 999px; border: 2px solid ' + (on ? '#C2410C' : '#C9BFB7') + '; display: flex; align-items: center; justify-content: center">' + (on ? '<span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span>' : '') + '</span>' + o + '</button>'; }).join('') +
      '</div></section>', function (e, b) { if (b && b.getAttribute('data-act') === 'pick') { var v = b.getAttribute('data-val'); closeSheet(); setTimeout(function () { onPick(v); }, 200); } }, null);
  }
  var fieldBox = 'min-height: 52px; border-radius: 16px; background: #F7F3F0; display: flex; align-items: center; gap: 10px; padding: 0 16px; box-sizing: border-box';

  if (page === 'edit-profile.html') {
    var pf = profile();
    var nameIn = screen.querySelector('[data-ep-name]'), cityV = screen.querySelector('[data-ep-city-value]'), phoneV = screen.querySelector('[data-ep-phone]');
    nameIn.value = pf.name; cityV.textContent = pf.city; phoneV.textContent = pf.phone;
    screen.querySelector('[data-ep-initial]').textContent = pf.name.trim().charAt(0);
    nameIn.addEventListener('input', function () { screen.querySelector('[data-ep-initial]').textContent = (nameIn.value.trim().charAt(0) || '؟'); });
    screen.querySelector('[data-ep-city]').addEventListener('click', function (e) { e.stopPropagation(); pickSheet('المدينة', CITIES.map(function (c) { return c[0]; }), cityV.textContent, function (v) { cityV.textContent = v; }); });
    screen.querySelector('[data-ep-change-phone]').addEventListener('click', function (e) {
      e.stopPropagation();
      var step = 1, num = '';
      var paint = function () {
        return '<section role="dialog" aria-modal="true" aria-label="تغيير رقم الجوال" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
          '<div style="padding: 0 18px 28px; display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 700">' + (step === 1 ? 'رقم الجوال الجديد' : 'رمز التحقق مطلوب') + '</h2>' +
          '<p style="margin: 0; font-size: 13px; line-height: 20px; color: #6B635D">' + (step === 1 ? 'سنرسل رمز تحقق من 4 أرقام إلى الرقم الجديد.' : 'بعتنا الرمز على <b style="direction: ltr; display: inline-block">+966 ' + esc(num) + '</b>. (في البروتوتايب يمكن إدخال أي 4 أرقام)') + '</p>' +
          '<label style="' + fieldBox + '; direction: ltr">' + (step === 1 ? '<span style="font-weight: 700; color: #6B635D">+966</span>' : '') + '<input data-ph-in type="tel" inputmode="numeric" value="' + (step === 1 ? '55 987 6543' : '4719') + '" maxlength="' + (step === 1 ? 11 : 4) + '" placeholder="' + (step === 1 ? '5X XXX XXXX' : '• • • •') + '" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 17px; letter-spacing: ' + (step === 1 ? '0.5px' : '8px') + '; color: #1C1917; text-align: left"></label>' +
          '<button type="button" data-act="next" style="height: 54px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700">' + (step === 1 ? 'إرسال رمز التحقق' : 'تأكيد') + '</button></div></section>';
      };
      var handler = function (ev, b) {
        if (!b || b.getAttribute('data-act') !== 'next') return;
        var v = (document.querySelector('[data-ph-in]').value || '').replace(/\D/g, '');
        if (step === 1) {
          if (!/^5\d{8}$/.test(v)) { toast('يجب أن يكون رقم الجوال سعوديًا ويبدأ بـ 5'); return; }
          if (v === profile().phone.replace(/\D/g, '').replace(/^966/, '')) { toast('هذا رقمك الحالي'); return; }
          if (v === '500000000') { toast('هذا الرقم مسجل على حساب آخر'); return; }
          num = v.slice(0, 2) + ' ' + v.slice(2, 5) + ' ' + v.slice(5); step = 2; closeSheet(); setTimeout(function () { mountSheet(paint(), handler, null); }, 220);
        } else {
          if (v.length !== 4) { toast('الرمز 4 أرقام'); return; }
          phoneV.textContent = '+966 ' + num; closeSheet(); toast('تم تأكيد الرقم الجديد، ويلزم الضغط على «حفظ التغييرات»');
        }
      };
      mountSheet(paint(), handler, null);
    });
    screen.querySelector('[data-ep-save]').addEventListener('click', function (e) {
      e.stopPropagation();
      var n = nameIn.value.trim();
      if (n.length < 2) { toast('الاسم مطلوب (حرفان على الأقل)'); nameIn.focus(); return; }
      write('outlet-profile', { name: n, phone: phoneV.textContent, city: cityV.textContent });
      toast('تم حفظ التغييرات'); setTimeout(function () { history.length > 1 ? history.back() : (location.href = 'settings.html'); }, 700);
    });
    screen.querySelector('[data-ep-cancel]').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); history.length > 1 ? history.back() : (location.href = 'settings.html'); }, true);
  }

  if (page === 'addresses.html') {
    var list = screen.querySelector('[data-addr-list]'), tpl = list.querySelector('[data-addr]').cloneNode(true);
    var pillH = function (t, fg) { return '<span style="height: 22px; padding: 0 8px; border-radius: 999px; background: #FFFFFF; color: ' + fg + '; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; flex: none">' + t + '</span>'; };
    var renderAddrs = function () {
      list.innerHTML = '';
      ADDRS.forEach(function (a, i) {
        var c = tpl.cloneNode(true); c.setAttribute('data-addr', i);
        c.style.background = a.def ? '#FFF4EC' : '#F7F3F093';
        var info = c.children[1], head = info.children[0];
        head.innerHTML = '<b style="font-size: 15px; line-height: 22px">' + esc(a.label) + '</b>' + (a.def ? pillH('الافتراضي', '#9A3412') : '') + (a.pickup ? pillH('استلام المبيعات', '#6B635D') : '');
        info.children[1].textContent = a.line;
        var acts = info.lastElementChild, warn = info.children.length > 3 ? info.children[2] : null;
        if (warn) warn.remove();
        if (a.fee == null) acts.insertAdjacentHTML('beforebegin', '<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 18px; color: #9A5800">التوصيل بالمندوب غير متاح بعد في هذه المدينة</span>');
        acts.innerHTML = '<a href="address-form.html" data-addr-edit style="font-size: 13px; font-weight: 700; color: #1C1917; text-decoration: none">تعديل</a>' +
          (a.def ? '' : '<button type="button" data-addr-default style="border: 0; background: transparent; padding: 0; font-family: inherit; font-size: 13px; font-weight: 700; color: #C2410C">تعيين كافتراضي</button>') +
          '<button type="button" data-addr-delete style="border: 0; background: transparent; padding: 0; font-family: inherit; font-size: 13px; font-weight: 700; color: #B42318">حذف</button>';
        list.appendChild(c);
      });
      if (!ADDRS.length) list.innerHTML = '<p style="margin: 30px 0; text-align: center; font-size: 14px; line-height: 22px; color: #6B635D">لا توجد عناوين مضافة بعد.</p>';
    };
    renderAddrs();
    screen.addEventListener('click', function (e) {
      var card = e.target.closest('[data-addr]'), i = card ? +card.getAttribute('data-addr') : -1;
      if (e.target.closest('[data-addr-add]')) { e.preventDefault(); e.stopPropagation(); write('outlet-addr-edit', -1); location.href = 'address-form.html'; return; }
      if (!card) return;
      if (e.target.closest('[data-addr-edit]')) { e.preventDefault(); e.stopPropagation(); write('outlet-addr-edit', i); location.href = 'address-form.html'; return; }
      if (e.target.closest('[data-addr-default]')) {
        e.stopPropagation(); var a = ADDRS.splice(i, 1)[0]; ADDRS.forEach(function (x) { x.def = false; }); a.def = true; ADDRS.unshift(a); saveAddrs(); renderAddrs(); toast('أصبح العنوان الافتراضي'); return;
      }
      if (e.target.closest('[data-addr-delete]')) {
        e.stopPropagation();
        var t = ADDRS[i];
        if (t.pickup) { toast('هذا عنوان استلام مبيعاتك، يلزم اختيار عنوان آخر للاستلام أولًا'); return; }
        if (ADDRS.length === 1) { toast('يجب أن يبقى عنوان واحد على الأقل'); return; }
        askSheet('حذف العنوان؟', 'سنحذف «' + esc(t.label) + '» من عناوينك. لن تتأثر الطلبات المدفوعة.', 'حذف', 'رجوع', function () {
          ADDRS.splice(i, 1); if (t.def && ADDRS[0]) ADDRS[0].def = true; saveAddrs(); renderAddrs(); toast('تم حذف العنوان');
        });
      }
    }, true);
  }

  if (page === 'address-form.html') {
    var ei = read('outlet-addr-edit', -1), ea = ADDRS[ei] || null;
    var cur = ea ? { label: ea.label, city: ea.city || 'الرياض', detail: ea.detail || ea.line, def: !!ea.def, pickup: !!ea.pickup } : { label: 'البيت', city: 'الرياض', detail: '', def: !ADDRS.length, pickup: false };
    screen.querySelector('h1').textContent = ea ? 'تعديل العنوان' : 'عنوان جديد';
    if (!cur.detail) cur.detail = 'حي النرجس، شارع الأمير سعود، مبنى 12، شقة 4'; // demo build: a new address comes filled
    var line = screen.querySelector('[data-af-line]'); line.value = cur.detail;
    var cityVal = screen.querySelector('[data-af-city-value]'); cityVal.textContent = cur.city;
    var labels = [].slice.call(screen.querySelectorAll('[data-af-label]'));
    var other = null;
    var paintLabels = function () {
      var known = ['البيت', 'العمل'].indexOf(cur.label) !== -1;
      labels.forEach(function (b) {
        var k = b.getAttribute('data-af-label'), on = known ? k === cur.label : k === 'آخر';
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500';
      });
      if (!known && !other) {
        other = document.createElement('span'); other.style.cssText = fieldBox + '; margin-top: 8px';
        other.innerHTML = '<input data-af-other type="text" maxlength="20" placeholder="مثلًا: بيت العيلة" aria-label="اسم العنوان" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 15px; color: #1C1917">';
        labels[0].parentNode.after(other); other.querySelector('input').value = cur.label === 'آخر' ? '' : cur.label;
      } else if (known && other) { other.remove(); other = null; }
    };
    paintLabels();
    labels.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); cur.label = b.getAttribute('data-af-label'); paintLabels(); if (other) other.querySelector('input').focus(); }); });
    screen.querySelector('[data-af-city]').addEventListener('click', function (e) { e.stopPropagation(); pickSheet('المدينة', CITIES.map(function (c) { return c[0]; }), cityVal.textContent, function (v) { cityVal.textContent = v; }); });
    var checks = [].slice.call(screen.querySelectorAll('[data-af-check]'));
    var paintChecks = function () {
      checks.forEach(function (b) {
        var on = !!cur[b.getAttribute('data-af-check')], box = b.firstElementChild;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        box.style.background = on ? '#C2410C' : '#FFFFFF'; box.style.border = on ? '0' : '2px solid #C9BFB7';
        box.innerHTML = on ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>' : '';
      });
    };
    paintChecks();
    checks.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); var k = b.getAttribute('data-af-check'); cur[k] = !cur[k]; paintChecks(); }); });
    screen.querySelector('[data-af-save]').addEventListener('click', function (e) {
      e.stopPropagation();
      var label = other ? other.querySelector('input').value.trim() : cur.label;
      var detail = line.value.trim();
      if (!label) { toast('اسم العنوان مطلوب'); return; }
      if (detail.length < 8) { toast('العنوان التفصيلي مطلوب: الحي والشارع'); line.focus(); return; }
      var city = cityVal.textContent;
      if (ea && ea.pickup && !cur.pickup) { toast('هذا عنوان استلام مبيعاتك. يجب تحديد عنوان آخر للاستلام أولًا'); return; }
      if (cur.pickup && cityFee(city) == null) { toast('المندوب لا يستلم من ' + city + ' بعد، يلزم اختيار عنوان آخر للاستلام'); return; }
      var a = { label: label, city: city, detail: detail, line: detail.indexOf(city) === -1 ? detail + '، ' + city : detail, fee: cityFee(city), def: cur.def, pickup: cur.pickup };
      if (ea) ADDRS[ei] = a; else ADDRS.push(a);
      var idx = ea ? ei : ADDRS.length - 1;
      if (a.pickup) ADDRS.forEach(function (x, j) { if (j !== idx) x.pickup = false; });
      if (a.def) { ADDRS.forEach(function (x, j) { if (j !== idx) x.def = false; }); ADDRS.splice(idx, 1); ADDRS.unshift(a); }
      if (!ADDRS.some(function (x) { return x.def; })) ADDRS[0].def = true;
      saveAddrs(); toast(ea ? 'تم حفظ التعديل' : 'تمت إضافة العنوان');
      var back = read('outlet-addr-return', ''); write('outlet-addr-return', '');
      setTimeout(function () { location.replace(back || 'addresses.html'); }, 600);
    });
  }

  if (page === 'bank.html') {
    var BANKS = { '05': 'مصرف الإنماء', '10': 'البنك الأهلي السعودي', '15': 'بنك البلاد', '20': 'بنك الرياض', '30': 'البنك العربي الوطني', '45': 'البنك السعودي الأول', '55': 'البنك السعودي الفرنسي', '60': 'بنك الجزيرة', '65': 'البنك السعودي للاستثمار', '80': 'مصرف الراجحي' };
    var bk = read('outlet-bank', { name: 'لمى الحربي', iban: '03800000006080101675 19'.replace(/\s/g, '') });
    var bName = screen.querySelector('[data-bk-name]'), bIban = screen.querySelector('[data-bk-iban]'), bBank = screen.querySelector('[data-bk-bank]');
    var fmt = function (d) { return d.replace(/(.{2})(.{0,4})(.{0,4})(.{0,4})(.{0,4})(.{0,4})/, function () { return [].slice.call(arguments, 1, 7).filter(Boolean).join(' '); }); };
    bName.value = bk.name; bIban.value = fmt(bk.iban);
    var showBank = function () {
      var d = bIban.value.replace(/\D/g, ''), b = BANKS[d.slice(2, 4)];
      bBank.style.display = d.length >= 4 ? 'flex' : 'none';
      bBank.lastElementChild.textContent = b || 'غير معروف، يُرجى مراجعة الرقم';
      bBank.lastElementChild.style.color = b ? '#1C1917' : '#B42318';
    };
    showBank();
    bIban.addEventListener('input', function () { var d = bIban.value.replace(/\D/g, '').slice(0, 22); bIban.value = fmt(d); showBank(); });
    screen.querySelector('[data-bk-save]').addEventListener('click', function (e) {
      e.stopPropagation();
      var d = bIban.value.replace(/\D/g, '');
      if (bName.value.trim().length < 3) { toast('اسم صاحب الحساب مطلوب'); return; }
      if (d.length !== 22) { toast('يجب أن يكون الآيبان SA و22 رقمًا'); bIban.focus(); return; }
      write('outlet-bank', { name: bName.value.trim(), iban: d }); toast('تم حفظ الآيبان');
    });
  }

  var POLICIES = {
    terms: 'الشروط والأحكام', privacy: 'سياسة الخصوصية', returns: 'الإرجاع والنزاعات', prohibited: 'المنتجات الممنوعة', fees: 'الرسوم والعمولات'
  };
  if (page === 'policies.html') {
    screen.addEventListener('click', function (e) {
      var r = e.target.closest('[data-row]'); if (!r) return;
      e.preventDefault(); e.stopPropagation(); write('outlet-policy', r.getAttribute('data-row')); location.href = 'policy.html';
    }, true);
  }
  if (page === 'policy.html') {
    var pid = read('outlet-policy', 'returns');
    screen.querySelector('h1').textContent = POLICIES[pid] || POLICIES.returns;
    if (pid !== 'returns' && POLICIES[pid]) {
      screen.querySelector('[data-policy-body]').innerHTML = '<p style="margin: 0; font-size: 12px; line-height: 18px; color: #8E857F">آخر تحديث: 1 نوفمبر 2026</p>' +
        '<div style="padding: 16px; border-radius: 18px; background: #F7F3F093; font-size: 14px; line-height: 24px; color: #3D3833">النص النهائي لـ«' + POLICIES[pid] + '» سيُكتب مع المراجعة القانونية ويُعرض هنا بالشكل نفسه: عناوين قصيرة وفقرات بسيطة.</div>';
    }
  }

  if (page === 'settings.html') {
    var spf = profile(), sbk = read('outlet-bank', { iban: '0380000000608010167519' });
    var sv = function (k) { return screen.querySelector('[data-row="' + k + '"] [data-row-value]'); };
    sv('phone').innerHTML = '<span style="direction: ltr; display: inline-block">•••• ' + spf.phone.replace(/\D/g, '').slice(-4) + '</span>';
    sv('addresses').textContent = ADDRS.length;
    sv('bank').innerHTML = '<span style="direction: ltr; display: inline-block">•••• ' + sbk.iban.slice(-4) + '</span>';
    var lang = read('outlet-lang', 'العربية'); sv('language').textContent = lang;
    var sw = screen.querySelector('[data-set-notify]'), notifOn = read('outlet-notify', true);
    var paintSw = function () { sw.setAttribute('aria-checked', notifOn ? 'true' : 'false'); sw.style.background = notifOn ? '#C2410C' : '#D6CEC7'; sw.style.justifyContent = notifOn ? 'flex-end' : 'flex-start'; };
    paintSw();
    screen.addEventListener('click', function (e) {
      if (e.target.closest('[data-set-notify]')) { e.preventDefault(); e.stopPropagation(); notifOn = !notifOn; write('outlet-notify', notifOn); paintSw(); toast(notifOn ? 'تم تفعيل إشعارات الجوال' : 'تم إيقاف إشعارات الجوال. ستبقى الإشعارات ظاهرة داخل التطبيق، ولتأكيد الاستلام مهلة 24 ساعة'); return; }
      var r = e.target.closest('[data-row]'); if (!r) return;
      var k = r.getAttribute('data-row');
      if (k === 'password') { e.preventDefault(); e.stopPropagation(); toast('يستخدم تغيير كلمة المرور نفس شاشة «كلمة مرور جديدة» بعد رمز التحقق'); }
      else if (k === 'language') { e.preventDefault(); e.stopPropagation(); pickSheet('اللغة', ['العربية', 'English'], lang, function (v) { lang = v; write('outlet-lang', v); sv('language').textContent = v; if (v === 'English') toast('النسخة الإنجليزية جاية بعد اعتماد العربي'); }); }
      else if (k === 'support') { e.preventDefault(); e.stopPropagation(); location.href = 'support.html'; }
    }, true);
  }

  if (page === 'delete-account.html') {
    demoFill(screen.querySelector('[data-del-pass]'), 'outlet2026');
    var dOrders = allOrders(), act = dOrders.filter(function (x) { return CURRENT[effSt(x)] && effSt(x) !== 'disputed'; }).length
      + SELL_ORDERS.filter(function (x) { return CURRENT[x.status] && x.status !== 'disputed'; }).length;
    var disp = dOrders.filter(function (x) { return effSt(x) === 'disputed'; }).length;
    var dws = walletSums(), bal = dws.free + dws.held + dws.reserved;
    var reqs = [].slice.call(screen.querySelectorAll('[data-del-req]'));
    var OK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z"></path><path d="M7.75 12l2.83 2.83 5.67-5.66"></path></svg>';
    var setReq = function (li, ok, sub) {
      var icon = li.firstElementChild; icon.style.color = ok ? '#1F7A4D' : '#B42318'; if (ok) icon.innerHTML = OK;
      var txt = li.lastElementChild; txt.children[1].textContent = sub; if (ok && txt.children[2]) txt.children[2].remove();
    };
    setReq(reqs[0], !act, act ? 'عندك ' + act + (act === 1 ? ' طلب لم يكتمل بعد.' : ' طلبات لم تكتمل بعد.') : 'لا توجد طلبات نشطة.');
    setReq(reqs[1], !disp, disp ? 'يوجد بلاغ ما زال قيد المراجعة.' : 'لا توجد بلاغات مفتوحة.');
    setReq(reqs[2], !bal, bal ? 'فيه ' + bal + ' ريال في المحفظة (متاح أو معلّق أو محجوز في سحب). يجب سحبه أولًا.' : 'المحفظة فارغة.');
    var blocked = act || disp || bal, pass = screen.querySelector('[data-del-pass]'), btn = screen.querySelector('[data-del-confirm]');
    var paintBtn = function () { var can = !blocked && pass.value.length >= 4; btn.disabled = !can; btn.style.opacity = can ? '1' : '0.4'; };
    pass.addEventListener('input', paintBtn); paintBtn();
    screen.addEventListener('click', function (e) {
      var l = e.target.closest('[data-del-link]');
      if (l) { e.preventDefault(); e.stopPropagation(); if (l.getAttribute('data-del-link') === 'orders') location.href = 'orders.html'; else location.href = 'withdraw.html'; return; }
      if (e.target.closest('[data-del-confirm]')) {
        e.stopPropagation();
        if (blocked) { toast('يلزم إكمال الخطوات أعلاه أولًا'); return; }
        askSheet('حذف الحساب نهائيًا؟', 'لا يمكن التراجع عن هذه الخطوة.', 'حذف الحساب', 'رجوع', function () { toast('تم حذف الحساب (تجريبي)'); });
      }
    }, true);
  }

  // ---------- U-21 my products, U-25/26 incoming orders (seller), U-42 contact us ----------
  var PST = { 'منشور': ['#ECF6EF', '#1F7A4D'], 'قيد المراجعة': ['#FEF6E7', '#9A5800'], 'مرفوض': ['#FEF3F2', '#B42318'], 'مخفي': ['#F2F2F2', '#6B635D'], 'مباع': ['#FDEBDD', '#9A3412'] };
  var ppill = function (s, bg) { var c = PST[s] || ['#F7F3F0', '#6B635D']; return '<span style="height: 22px; padding: 0 8px; border-radius: 999px; background: ' + (bg || c[0]) + '; color: ' + c[1] + '; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; flex: none">' + s + '</span>'; };
  function products() {
    return read('outlet-products', null) || [
      { id: 1, src: 'assets/dress-terracotta.jpg', alt: 'فستان تيراكوتا', name: 'فستان تيراكوتا ميدي', price: 190, st: 'منشور', sub: 'ظاهر للمشترين من 3 نوفمبر' },
      { id: 2, src: 'assets/shirt.jpg', alt: 'قميص كتان سماوي', name: 'قميص كتان سماوي', price: 95, st: 'قيد المراجعة', sub: 'فريق outlet يراجعه، ولم يظهر للمشترين بعد' },
      { id: 3, src: 'assets/dress-ivory.jpg', alt: 'فستان عاجي طويل', name: 'فستان عاجي طويل', price: 220, st: 'مرفوض', sub: 'سبب الرفض: الصور غير واضحة، يُفضّل تصوير القطعة في ضوء النهار' },
      { id: 4, src: 'assets/dress-black.jpg', alt: 'فستان أسود', name: 'فستان أسود كلاسيك', price: 210, st: 'مخفي', sub: 'غير ظاهر للمشترين، ويمكن إعادة إظهاره بدون مراجعة' },
      { id: 5, src: 'assets/sweater.jpg', alt: 'سويتر مخطط', name: 'سويتر مخطط', price: 120, st: 'مباع', sub: 'الطلب OUT-24833 قيد التجهيز', order: 'OUT-24833' },
      { id: 6, src: 'assets/pants.jpg', alt: 'بنطلون واسع بيج', name: 'بنطلون واسع بيج', price: 127, st: 'مباع', sub: 'الطلب OUT-24810 بانتظار التسليم', order: 'OUT-24810' },
      { id: 7, src: 'assets/dress-pink.jpg', alt: 'فستان وردي', name: 'فستان سهرة وردي', price: 390, st: 'مباع', sub: 'اكتمل · OUT-24588' },
      { id: 8, src: 'assets/dress-polka.jpg', alt: 'فستان منقط', name: 'فستان منقط', price: 300, st: 'مباع', sub: 'اكتمل · OUT-24420' }
    ];
  }
  function saveSell() { write('outlet-sell-orders', SELL_ORDERS); }
  var linkBtn = 'border: 0; background: transparent; padding: 0; font-family: inherit; font-size: 13px; font-weight: 700';

  if (page === 'my-products.html') {
    var PR = products(), pf = 'all', pl = screen.querySelector('[data-p-list]');
    var renderP = function () {
      write('outlet-products', PR);
      pl.innerHTML = PR.filter(function (p) { return pf === 'all' || p.st === pf; }).map(function (p) {
        var acts = p.st === 'منشور' ? '<button type="button" data-p-act="hide" style="' + linkBtn + '; color: #1C1917">إخفاء</button><button type="button" data-p-act="edit" style="' + linkBtn + '; color: #C2410C">تعديل</button>'
          : p.st === 'مخفي' ? '<button type="button" data-p-act="show" style="' + linkBtn + '; color: #1C1917">إعادة إظهار</button><button type="button" data-p-act="edit" style="' + linkBtn + '; color: #C2410C">تعديل</button>'
          : p.st === 'مرفوض' ? '<button type="button" data-p-act="resubmit" style="' + linkBtn + '; color: #C2410C">تعديل وإعادة إرسال</button>'
          : p.order ? '<button type="button" data-p-act="order" style="' + linkBtn + '; color: #C2410C">عرض الطلب</button>' : '';
        return '<div data-prod="' + p.id + '" style="cursor: pointer; padding: 12px; border-radius: 18px; background: #F7F3F093; display: flex; gap: 12px"><span style="width: 64px; height: 76px; flex: none; border-radius: 12px; background: #FFFFFF; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box"><img src="' + p.src + '" alt="' + esc(p.alt) + '" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply"></span>' +
          '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="display: flex; align-items: flex-start; gap: 8px"><span style="flex: 1; min-width: 0; font-size: 14px; line-height: 20px; font-weight: 700">' + esc(p.name) + '</span>' + ppill(p.st) + '</span>' +
          '<span style="direction: ltr; align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700">' + riyal(10, 11) + p.price + '</span>' +
          (p.sub ? '<span style="font-size: 12px; line-height: 18px; color: ' + (p.st === 'مرفوض' ? '#B42318' : '#6B635D') + '">' + esc(p.sub) + '</span>' : '') +
          (acts ? '<span style="display: flex; gap: 18px; padding-top: 2px">' + acts + '</span>' : '') + '</span></div>';
      }).join('') || (PR.length ? '<p style="margin: 30px 0; text-align: center; font-size: 14px; color: #6B635D">لا توجد منتجات بهذه الحالة.</p>'
        : '<div style="margin: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center"><b style="font-size: 17px; line-height: 24px">لا توجد منتجات معروضة بعد</b><span style="font-size: 14px; line-height: 22px; color: #6B635D">تُراجَع أول قطعة من فريق outlet قبل ظهورها للمشترين.</span><a href="add-product.html" style="margin-top: 6px; height: 50px; padding: 0 26px; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; display: flex; align-items: center">إضافة منتج</a></div>');
      screen.querySelectorAll('[data-p-filter]').forEach(function (b) {
        var k = b.getAttribute('data-p-filter'), on = k === pf, n = PR.filter(function (p) { return k === 'all' || p.st === k; }).length;
        b.innerHTML = b.firstChild.textContent.trim() + ' <span style="opacity: 0.7">' + n + '</span>';
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500';
      });
    };
    renderP();
    var flash = read('outlet-flash', ''); if (flash) { write('outlet-flash', ''); setTimeout(function () { toast(flash); }, 300); }
    screen.addEventListener('click', function (e) {
      var f = e.target.closest('[data-p-filter]');
      if (f) { e.preventDefault(); e.stopPropagation(); pf = f.getAttribute('data-p-filter'); renderP(); return; }
      if (e.target.closest('[data-p-add]')) { e.preventDefault(); e.stopPropagation(); location.href = 'add-product.html'; return; }
      var a = e.target.closest('[data-p-act]'); if (!a) { var pc = e.target.closest('[data-prod]'); if (pc) { e.preventDefault(); e.stopPropagation(); write('outlet-pd-id', +pc.getAttribute('data-prod')); location.href = 'product-status.html'; } return; }
      e.preventDefault(); e.stopPropagation();
      var p = PR.filter(function (x) { return x.id === +a.closest('[data-prod]').getAttribute('data-prod'); })[0], act = a.getAttribute('data-p-act');
      if (act === 'hide') askSheet('إخفاء المنتج؟', 'لن يظهر للمشترين حتى تتم إعادته. لن تُحذف بياناته، والإعادة لا تحتاج مراجعة.', 'إخفاء', 'رجوع', function () { p.st = 'مخفي'; p.sub = 'غير ظاهر للمشترين، ويمكن إعادة إظهاره بدون مراجعة'; renderP(); toast('تم إخفاء المنتج'); });
      else if (act === 'show') { p.st = 'منشور'; p.sub = 'عاد ظاهرًا للمشترين'; renderP(); toast('عاد المنتج ظاهرًا للمشترين'); }
      else if (act === 'edit' || act === 'resubmit') { write('outlet-edit-id', p.id); location.href = 'edit-product.html'; }
      else if (act === 'resubmit') askSheet('إعادة إرسال للمراجعة؟', 'في النسخة النهائية سيتم تعديل الصور أو البيانات أولًا. سيكون المنتج «قيد المراجعة» ولن يظهر حتى يوافق فريق outlet.', 'إرسال للمراجعة', 'رجوع', function () { p.st = 'قيد المراجعة'; p.sub = 'أُعيد إرساله للمراجعة'; renderP(); toast('أُرسل للمراجعة'); });
      else if (act === 'order') { write('outlet-inc-view', p.order); location.href = 'incoming-order.html'; }
    }, true);
  }

  var INC_CUR = { preparing: 1, shipping: 1, arrived: 1, handover: 1, disputed: 1 };
  if (page === 'incoming.html') {
    var ifl = 'current', il = screen.querySelector('[data-inc-list]');
    var MLAB = { courier: 'توصيل بالمندوب', direct: 'تسليم مباشر' };
    var nextTxt = function (o) {
      if (o.cancelReq) return 'طلب الإلغاء قيد مراجعة فريق outlet';
      if (o.status === 'preparing') return 'يلزم تجهيز القطعة، وسيستلمها المندوب من عنوان الاستلام';
      if (o.status === 'handover') return o.sellerDelivered ? 'بانتظار تأكيد المشتري للاستلام' : 'يتم الاتفاق على التسليم في المحادثة، ثم الضغط على «تم التسليم»';
      return '';
    };
    var renderI = function () {
      il.innerHTML = SELL_ORDERS.filter(function (o) { return (ifl === 'current') === !!INC_CUR[o.status]; }).map(function (o) {
        var it = o.items[0], nx = nextTxt(o), more = o.items.length - 1, itemsSum = o.items.reduce(function (a, x) { return a + x.priceNum; }, 0);
        return '<a href="incoming-order.html" data-inc="' + o.no + '" style="padding: 14px; border-radius: 18px; background: #F7F3F093; display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: #1C1917">' +
          '<span style="display: flex; align-items: center; gap: 10px"><span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><b style="font-size: 15px; line-height: 22px; direction: ltr; text-align: right">' + o.no + '</b><span style="font-size: 12px; line-height: 16px; color: #8E857F">' + o.date + ' · المشتري: ' + esc(o.buyer) + '</span></span>' + (o.cancelReq ? ppill('طلب إلغاء', '#FEF3F2') : statusPill(effSt(o))) + '</span>' +
          '<span style="display: flex; align-items: center; gap: 10px"><span style="width: 44px; height: 52px; flex: none; border-radius: 12px; background: #FFFFFF; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box"><img src="' + it.src + '" alt="' + esc(it.alt) + '" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply"></span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-size: 14px; line-height: 20px; font-weight: 700">' + esc(it.name) + (more ? ' + ' + (more === 1 ? 'قطعة' : more + ' قطع') : '') + '</span><span style="font-size: 12px; line-height: 18px; color: #6B635D">' + MLAB[o.method] + '</span></span><span style="direction: ltr; display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 700">' + riyal(10, 11) + itemsSum + '</span></span>' +
          (nx ? '<span style="padding: 8px 10px; border-radius: 12px; background: #FFFFFF; font-size: 12px; line-height: 18px; font-weight: 700; color: ' + (o.cancelReq ? '#B42318' : '#9A5800') + '">' + nx + '</span>' : '') +
          '<span style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700"><span style="color: #6B635D; font-weight: 500">صافي أرباحك ' + o.net + ' ريال</span><span style="color: #C2410C">عرض التفاصيل</span></span></a>';
      }).join('') || '<p style="margin: 30px 0; text-align: center; font-size: 14px; color: #6B635D">' + (ifl === 'current' ? 'لا توجد طلبات واردة حاليًا.' : 'لا توجد طلبات سابقة.') + '</p>';
      screen.querySelectorAll('[data-inc-filter]').forEach(function (b) {
        var on = b.getAttribute('data-inc-filter') === ifl;
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500';
      });
    };
    renderI();
    screen.addEventListener('click', function (e) {
      var f = e.target.closest('[data-inc-filter]'), c = e.target.closest('[data-inc]');
      if (f) { e.preventDefault(); e.stopPropagation(); ifl = f.getAttribute('data-inc-filter'); renderI(); }
      else if (c) { e.preventDefault(); e.stopPropagation(); write('outlet-inc-view', c.getAttribute('data-inc')); location.href = 'incoming-order.html'; }
    }, true);
  }

  if (page === 'incoming-order.html') {
    var ino = read('outlet-inc-view', 'OUT-24833'), io = SELL_ORDERS.filter(function (x) { return x.no === ino; })[0] || SELL_ORDERS[0];
    var q2 = function (s) { return screen.querySelector(s); };
    var dark = 'height: 54px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center';
    var light = 'height: 54px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center';
    var renderIO = function () {
      saveSell();
      q2('h1').textContent = io.no;
      // demo: the admin turns the cancel request down a minute after it is sent (the approved case is on the S-02 board)
      if (io.cancelReq && io.cancelAt && Date.now() - io.cancelAt > 60000) { io.cancelReq = false; io.cancelDecision = 'rejected'; }
      var it = io.items[0], st = io.status;
      var C = io.cancelReq ? ['#FEF3F2', ppill('طلب إلغاء', '#FFFFFF'), 'طلب الإلغاء قيد المراجعة', (io.cancelReason ? 'السبب: ' + io.cancelReason + '. ' : '') + 'الإجراءات متوقفة حتى يقرر فريق outlet. في حال الموافقة، يعود المبلغ للمشتري؛ وفي حال الرفض يكتمل الطلب كالمعتاد.']
        : st === 'preparing' ? ['#FFF4EC', statusPill(st), 'تجهيز القطعة للمندوب', 'سيستلمها المندوب من عنوان الاستلام، وسيبلغك فريق outlet بموعد الاستلام.']
        : st === 'handover' && io.sellerDelivered ? ['#FEF6E7', statusPill('handed'), 'مستني تأكيد المشتري', 'تم تسجيل تسليم القطعة. يكتمل الطلب وتُتاح أرباحك عند تأكيد المشتري للاستلام، وإذا لم يؤكد يراجع فريق outlet الطلب والمحادثة ويقرر.']
        : st === 'handover' ? ['#FEF6E7', statusPill(st), 'الاتفاق على التسليم', 'يتم الاتفاق في المحادثة على المكان والوقت. بعد تسليم القطعة يلزم الضغط على «تم التسليم»، ويكتمل الطلب عند تأكيد المشتري للاستلام.']
        : st === 'shipping' ? ['#FFF4EC', statusPill(st), 'المندوب استلم القطعة', 'القطعة في الطريق إلى المشتري، وأرباحك معلّقة حتى اكتمال الطلب.']
        : st === 'arrived' ? ['#FEF6E7', statusPill(st), 'القطعة وصلت للمشتري', 'يكتمل الطلب عند تأكيد المشتري للاستلام، أو بعد 24 ساعة من وصول المندوب إذا لم يوجد بلاغ.']
        : st === 'disputed' ? ['#FFF4EC', statusPill(st), 'فيه بلاغ على الطلب', 'يراجع فريق outlet البلاغ، وأرباحك معلّقة حتى القرار. المحادثة مفتوحة حتى صدور القرار.']
        : st === 'cancelled' ? ['#F7F3F093', statusPill(st), 'تم إلغاء الطلب', 'المبلغ رجع للمشتري.']
        : st === 'completed' ? ['#ECF6EF', statusPill(st), 'الطلب اكتمل', 'أرباحك نزلت في رصيدك المتاح.']
        : ['#F7F3F093', statusPill(st), STATUS[st] ? STATUS[st].label : 'الطلب', ''];
      var box = q2('[data-io-status]'); box.style.background = C[0];
      box.innerHTML = C[1].replace(/background: [^;]+;/, 'background: #FFFFFF;').replace('flex: none', 'flex: none; align-self: flex-start') + '<span style="font-size: 18px; line-height: 26px; font-weight: 700">' + C[2] + '</span><span style="font-size: 13px; line-height: 20px; color: #6B635D">' + C[3] + '</span>' + (io.cancelDecision === 'rejected' && !io.cancelReq ? '<span style="margin-top: 4px; padding: 8px 10px; border-radius: 12px; background: #FFFFFF; font-size: 12px; line-height: 18px; font-weight: 700; color: #B42318">فريق outlet رفض طلب الإلغاء، فالطلب مكمّل عادي.</span>' : '');
      var t = io.times || {};
      var steps = io.method === 'courier'
        ? [['تم الدفع', t.paid, 'done'], ['قيد التجهيز', st === 'preparing' ? 'الآن' : t.preparing, st === 'preparing' ? 'now' : 'done'], ['المندوب استلم القطعة', t.shipping, st === 'completed' ? 'done' : 'todo'], ['وصلت للمشتري', t.arrived, st === 'completed' ? 'done' : 'todo'], ['مكتمل · الأرباح متاحة', st === 'completed' ? t.completed : 'بعد تأكيد المشتري، أو بعد 24 ساعة من وصول المندوب إذا لم يوجد بلاغ', st === 'completed' ? 'done' : 'todo']]
        : [['تم الدفع', t.paid, 'done'], ['بانتظار التسليم', 'المحادثة مفتوحة مع المشتري', st === 'handover' && !io.sellerDelivered ? 'now' : 'done'], ['تم تسليم القطعة', t.delivered || '', io.sellerDelivered || st === 'completed' ? (st === 'completed' ? 'done' : 'now') : 'todo'], ['مكتمل · الأرباح متاحة', st === 'completed' ? t.completed : 'بعد تأكيد المشتري', st === 'completed' ? 'done' : 'todo']];
      if (st === 'cancelled') steps = [['تم الدفع', t.paid, 'done'], ['ملغى', t.cancelled, 'done']];
      q2('[data-io-timeline]').innerHTML = steps.map(function (s, i) { return stepHTML(s[0], s[1] || '', s[2], i === steps.length - 1); }).join('');
      var sec = q2('[data-io-timeline]').closest('section').nextElementSibling;
      var img = sec.querySelector('img'); img.src = it.src; img.alt = it.alt;
      var info = img.parentNode.nextElementSibling; info.children[0].textContent = it.name; info.children[1].textContent = 'المقاس ' + it.size + ' · المشتري: ' + io.buyer;
      info.nextElementSibling.innerHTML = riyal(11, 12) + it.priceNum;
      var iRow = img.parentNode.parentNode;
      [].forEach.call(iRow.parentNode.querySelectorAll('[data-io-extra]'), function (x) { x.remove(); });
      io.items.slice(1).forEach(function (x) { var r = iRow.cloneNode(true); r.setAttribute('data-io-extra', ''); var im2 = r.querySelector('img'); im2.src = x.src; im2.alt = x.alt || x.name; var in2 = im2.parentNode.nextElementSibling; in2.children[0].textContent = x.name; in2.children[1].textContent = 'المقاس ' + x.size + ' · ' + x.cond; in2.nextElementSibling.innerHTML = riyal(11, 12) + x.priceNum; iRow.parentNode.appendChild(r); });
      var ioSum = io.items.reduce(function (a, x) { return a + x.priceNum; }, 0);
      var del = sec.nextElementSibling.querySelector('div');
      del.children[0].textContent = io.method === 'courier' ? 'توصيل بالمندوب' : 'تسليم مباشر';
      var pick = ADDRS.filter(function (a) { return a.pickup; })[0] || ADDRS[0];
      del.children[1].textContent = io.method === 'courier' ? 'الاستلام من: ' + pick.label + ' · ' + pick.line : 'يُحدَّد المكان والوقت في محادثة الطلب';
      var earn = sec.nextElementSibling.nextElementSibling, vals = earn.querySelectorAll('div > span[style*="direction: ltr"]');
      vals[0].innerHTML = riyal(10, 11) + ioSum; vals[1].innerHTML = riyal(10, 11) + '−' + (ioSum - io.net); vals[2].innerHTML = riyal(12, 13) + io.net;
      earn.lastElementChild.textContent = st === 'completed' ? 'أُضيفت إلى رصيدك المتاح.' : st === 'cancelled' ? 'تم إلغاء الطلب، فلا توجد أرباح.' : 'معلّقة حتى يكتمل الطلب، ثم تُضاف إلى رصيدك المتاح.';
      var canCancel = (st === 'preparing' || st === 'handover') && !io.cancelReq && !io.cancelDecision && !io.sellerDelivered;
      q2('[data-io-cancel]').style.display = canCancel ? 'block' : 'none';
      var bar = q2('[data-io-chat]').parentNode;
      bar.innerHTML = (st === 'handover' && !io.sellerDelivered && !io.cancelReq)
        ? '<a href="#chat" data-io-chat style="flex: 1; ' + light + '">محادثة المشتري</a><button type="button" data-io-delivered style="flex: 1.3; ' + dark + '">تم التسليم</button>'
        : st === 'completed' ? '<a href="#chat" data-io-chat style="flex: 1; ' + light + '">محادثة المشتري</a>' + (ratings()[io.no + '|sell'] ? '<button type="button" data-io-rated style="flex: 1.3; ' + light + '">قيّمت المشتري · ' + ratings()[io.no + '|sell'].stars + ' من 5</button>' : '<button type="button" data-io-rate style="flex: 1.3; ' + dark + '">قيّم المشتري</button>')
        : '<a href="#chat" data-io-chat style="flex: 1; ' + dark + '">محادثة المشتري</a>';
    };
    renderIO();
    screen.addEventListener('click', function (e) {
      if (e.target.closest('[data-io-rate]')) { e.preventDefault(); e.stopPropagation(); write('outlet-rate-view', { no: io.no, role: 'sell' }); location.href = 'rate.html'; return; }
      if (e.target.closest('[data-io-rated]')) { e.preventDefault(); e.stopPropagation(); toast('تم تقييم المشتري، ولا يمكن تعديل التقييم'); return; }
      if (e.target.closest('[data-io-chat]')) { e.preventDefault(); e.stopPropagation(); write('outlet-chat-view', io.no); location.href = 'chat.html'; return; }
      if (e.target.closest('[data-io-delivered]')) {
        e.preventDefault(); e.stopPropagation();
        askSheet('سلّمت القطعة للمشتري؟', 'لن يكتمل الطلب إلا بعد أن يؤكد المشتري الاستلام من جهته.', 'نعم، سلّمتها', 'ليس بعد', function () { io.sellerDelivered = true; io.times = io.times || {}; io.times.delivered = fmtDate(new Date(), true); renderIO(); toast('تم تسجيل التسليم، بانتظار تأكيد المشتري'); });
        return;
      }
      if (e.target.closest('[data-io-cancel]')) {
        e.preventDefault(); e.stopPropagation();
        pickSheet('سبب طلب الإلغاء', ['القطعة لم تعد متاحة', 'تضررت القطعة أو ظهر فيها عيب', 'لن أتمكن من تسليمها في الوقت المطلوب', 'سبب آخر'], null, function (r) {
          askSheet('طلب إلغاء الطلب؟', 'السبب: ' + r + '. لن يُلغى الطلب فورًا. سيراجع فريق outlet الطلب ويقرر، وسيتوقف الشحن حتى صدور القرار.', 'إرسال طلب الإلغاء', 'رجوع', function () { io.cancelReq = true; io.cancelReason = r; io.cancelAt = Date.now(); renderIO(); toast('تم إرسال طلب الإلغاء لفريق outlet'); });
        });
      }
    }, true);
  }

  if (page === 'support.html') {
    demoFill(screen.querySelector('[data-sup-msg]'), 'طلبت فستان من أسبوع وما وصلني أي تحديث عن موعد التوصيل، ممكن تساعدوني؟');
    var topic = 'طلب', supOrder = 'OUT-24790';
    var tps = [].slice.call(screen.querySelectorAll('[data-sup-topic]'));
    var paintT = function () { tps.forEach(function (b) { var on = b.getAttribute('data-sup-topic') === topic; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500'; }); };
    tps.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); topic = b.getAttribute('data-sup-topic'); paintT(); }); });
    var ordVal = screen.querySelector('[data-sup-order-value]');
    var allNos = allOrders().map(function (o) { return o.no + ' · ' + o.items[0].name; }).concat(SELL_ORDERS.map(function (o) { return o.no + ' · ' + o.items[0].name + ' (بيع)'; }));
    screen.querySelector('[data-sup-order]').addEventListener('click', function (e) { e.stopPropagation(); pickSheet('الطلب', ['غير متعلقة بطلب'].concat(allNos), ordVal.textContent, function (v) { ordVal.textContent = v; supOrder = v; }); });
    screen.querySelectorAll('[data-faq] summary').forEach(function (s) { s.addEventListener('click', function (e) { e.stopPropagation(); }); });
    screen.querySelector('[data-sup-send]').addEventListener('click', function (e) {
      e.stopPropagation();
      var m = screen.querySelector('[data-sup-msg]');
      if (m.value.trim().length < 10) { toast('يُرجى كتابة تفاصيل أكثر قليلًا حتى نتمكن من المساعدة'); m.focus(); return; }
      var ref = 'TCK-' + (3000 + Math.floor(Math.random() * 900));
      m.value = ''; toast('وصلت رسالتك (' + ref + ')، وسيصلك الرد في الإشعارات');
    });
  }

  // ---------- U-22 add product, U-20 seller setup ----------
  var SIZES = { 'فساتين': ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'ملابس': ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'أحذية': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], 'شنط': ['مقاس واحد'] };
  var chipPaint = function (b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.background = on ? '#1C1917' : '#F7F3F0'; b.style.color = on ? '#FFFFFF' : '#1C1917'; b.style.fontWeight = on ? '700' : '500'; };
  var chipH = function (attr, v) { return '<button type="button" ' + attr + '="' + v + '" aria-pressed="false" style="height: 38px; padding: 0 14px; flex: none; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-weight: 500; font-family: inherit; font-size: 13px; display: inline-flex; align-items: center; gap: 6px">' + v + '</button>'; };

  if (page === 'add-product.html' || page === 'edit-product.html') {
    if (!read('outlet-seller-ok', true)) { location.replace('seller-setup.html'); return; }
    var EDIT = page === 'edit-product.html', editId = read('outlet-edit-id', 0), editP = EDIT ? products().filter(function (x) { return x.id === editId; })[0] : null;
    if (EDIT && !editP) { location.replace('my-products.html'); return; }
    var $a = function (s) { return screen.querySelector(s); }, $$a = function (s) { return [].slice.call(screen.querySelectorAll(s)); };
    var st = { cat: '', size: '', color: '', cond: '', auth: 'أصلية', nobrand: false };
    // demo build: a new product starts from the board's filled example; edit mode fills from the product below
    var phBox = $a('[data-ap-photos]'), phTpl = $a('[data-ap-photo]').cloneNode(true), addBtn = $a('[data-ap-add]');
    if (EDIT) $a('[data-ap-photo]').remove();
    var nameIn = $a('[data-ap-name]'), brandIn = $a('[data-ap-brand]'), priceIn = $a('[data-ap-price]'), usesIn = $a('[data-ap-uses]'), descIn = $a('[data-ap-desc]');
    if (EDIT) { nameIn.value = ''; brandIn.value = ''; priceIn.value = ''; usesIn.value = '0'; descIn.value = ''; }
    else { ['cat', 'size', 'color', 'cond'].forEach(function (k) { var b = $a('[data-ap-' + k + '][aria-pressed="true"]'); if (b) st[k] = b.getAttribute('data-ap-' + k); }); }
    $a('[data-ap-desc-count]').textContent = descIn.value.length + ' / 500';
    $a('[data-ap-city-value]').textContent = profile().city;
    var colorOther = null;
    var paintAll = function () {
      $$a('[data-ap-cat]').forEach(function (b) { chipPaint(b, b.getAttribute('data-ap-cat') === st.cat); });
      $$a('[data-ap-size]').forEach(function (b) { chipPaint(b, b.getAttribute('data-ap-size') === st.size); });
      $$a('[data-ap-color]').forEach(function (b) { chipPaint(b, b.getAttribute('data-ap-color') === st.color); });
      $$a('[data-ap-cond]').forEach(function (b) { chipPaint(b, b.getAttribute('data-ap-cond') === st.cond); });
      $$a('[data-ap-auth]').forEach(function (b) { var on = b.getAttribute('data-ap-auth') === st.auth; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.style.background = on ? '#FFFFFF' : 'transparent'; b.style.boxShadow = on ? '0 2px 8px rgba(28,25,23,0.08)' : 'none'; b.style.fontWeight = on ? '700' : '500'; b.style.color = on ? '#1C1917' : '#6B635D'; });
      var nb = $a('[data-ap-nobrand]'), box = nb.firstElementChild;
      nb.setAttribute('aria-checked', st.nobrand ? 'true' : 'false');
      box.style.background = st.nobrand ? '#C2410C' : '#FFFFFF'; box.style.border = st.nobrand ? '0' : '2px solid #C9BFB7';
      box.innerHTML = st.nobrand ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display: block; margin: 4px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>' : '';
      brandIn.disabled = st.nobrand; brandIn.parentNode.style.opacity = st.nobrand ? '0.45' : '1';
      var sizeField = $a('[data-ap-field="size"]');
      sizeField.style.display = st.cat ? 'flex' : 'none';
      sizeField.firstElementChild.innerHTML = 'المقاس ' + (st.cat === 'شنط' ? '<span style="font-weight: 500; color: #8E857F">(اختياري)</span>' : '<span style="color: #C2410C">*</span>');
      if (st.cond === 'جديدة بالتيكت') { usesIn.value = '0'; usesIn.disabled = true; } else usesIn.disabled = false;
      var p = parseInt(priceIn.value.replace(/\D/g, ''), 10) || 0;
      $a('[data-ap-net]').textContent = p ? 'سيصلك ' + (Math.round(p * 0.85 * 10) / 10) + ' ريال بعد عمولة المنصة (15%)' : 'تُخصم عمولة المنصة 15% من السعر عند بيع القطعة.';
    };
    var renderSizes = function () {
      $a('[data-ap-sizes]').innerHTML = '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + (SIZES[st.cat] || []).map(function (s) { return chipH('data-ap-size', s); }).join('') + '</div>';
    };
    if (editP) {
      var guessCat = editP.cat || (/فستان/.test(editP.name) ? 'فساتين' : /حذاء|كوتشي/.test(editP.name) ? 'أحذية' : /شنط/.test(editP.name) ? 'شنط' : 'ملابس');
      st.cat = guessCat; st.size = editP.size || (guessCat === 'شنط' ? 'مقاس واحد' : guessCat === 'أحذية' ? '40' : 'M');
      var guessCol = ['أسود', 'أبيض', 'بيج', 'بني', 'تيراكوتا', 'وردي', 'أخضر', 'أزرق'].filter(function (c) { return (editP.color || editP.name).indexOf(c) !== -1; })[0];
      st.color = editP.color && !guessCol ? 'آخر' : (guessCol || (/عاجي|أبيض/.test(editP.name) ? 'أبيض' : 'أسود'));
      st.cond = editP.cond || 'ممتازة'; st.auth = editP.auth || 'أصلية';
      nameIn.value = editP.name; priceIn.value = editP.price; usesIn.value = editP.uses != null ? editP.uses : 2; descIn.value = editP.desc || '';
      if (editP.brand === 'بدون ماركة' || !editP.brand) st.nobrand = !editP.brand ? false : true; brandIn.value = editP.brand && editP.brand !== 'بدون ماركة' ? editP.brand : '';
      if (!editP.brand) { st.nobrand = true; }
      $a('[data-ap-desc-count]').textContent = descIn.value.length + ' / 500';
      if (editP.city) $a('[data-ap-city-value]').textContent = editP.city;
      var bn = $a('[data-ap-banner]');
      if (bn) {
        if (editP.st === 'مرفوض') bn.lastElementChild.textContent = (editP.sub || '').replace(/^سبب الرفض: /, 'السبب: ') + '. يمكن تعديل ما يلزم وإعادة الإرسال.';
        else { bn.style.background = '#FEF6E7'; bn.firstElementChild.style.color = '#9A5800'; bn.firstElementChild.textContent = editP.st === 'مخفي' ? 'المنتج مخفي الآن' : 'المنتج منشور الآن'; bn.lastElementChild.textContent = editP.st === 'مخفي' ? 'أي تعديل يعيد المنتج للمراجعة، ولن يظهر إلا بعد موافقة فريق outlet.' : 'أي تعديل يخفي المنتج عن المشترين ويعيده للمراجعة حتى يوافق فريق outlet.'; }
      }
    }
    renderSizes(); paintAll();
    var clearErr = function (k) { var f = $a('[data-ap-field="' + k + '"]'), e = f && f.querySelector('[data-ap-err]'); if (e) e.remove(); };
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ap-cat], [data-ap-size], [data-ap-color], [data-ap-cond], [data-ap-auth], [data-ap-nobrand], [data-ap-dec], [data-ap-inc], [data-ap-city], [data-ap-add], [data-ap-remove], [data-ap-submit], [data-ap-rules]');
      if (!b || b.closest('.proto-sheet-wrap')) return;
      e.preventDefault(); e.stopPropagation();
      if (b.hasAttribute('data-ap-cat')) { var c = b.getAttribute('data-ap-cat'); if (c !== st.cat) { st.cat = c; st.size = c === 'شنط' ? 'مقاس واحد' : ''; renderSizes(); } clearErr('cat'); }
      else if (b.hasAttribute('data-ap-size')) { st.size = b.getAttribute('data-ap-size'); clearErr('size'); }
      else if (b.hasAttribute('data-ap-color')) {
        st.color = b.getAttribute('data-ap-color'); clearErr('color');
        if (st.color === 'آخر' && !colorOther) { colorOther = document.createElement('span'); colorOther.style.cssText = fieldBox; colorOther.innerHTML = '<input data-ap-color-other type="text" maxlength="20" placeholder="اللون مطلوب" aria-label="لون آخر" style="flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 15px; color: #1C1917">'; b.parentNode.after(colorOther); colorOther.querySelector('input').focus(); }
        else if (st.color !== 'آخر' && colorOther) { colorOther.remove(); colorOther = null; }
      }
      else if (b.hasAttribute('data-ap-cond')) { st.cond = b.getAttribute('data-ap-cond'); clearErr('cond'); }
      else if (b.hasAttribute('data-ap-auth')) st.auth = b.getAttribute('data-ap-auth');
      else if (b.hasAttribute('data-ap-nobrand')) { st.nobrand = !st.nobrand; if (st.nobrand) brandIn.value = ''; clearErr('brand'); }
      else if (b.hasAttribute('data-ap-dec') || b.hasAttribute('data-ap-inc')) { if (usesIn.disabled) return; var n = (parseInt(usesIn.value, 10) || 0) + (b.hasAttribute('data-ap-inc') ? 1 : -1); usesIn.value = Math.max(0, Math.min(99, n)); }
      else if (b.hasAttribute('data-ap-city')) { pickSheet('المدينة', CITIES.map(function (x) { return x[0]; }), $a('[data-ap-city-value]').textContent, function (v) { $a('[data-ap-city-value]').textContent = v; }); }
      else if (b.hasAttribute('data-ap-rules')) { write('outlet-policy', 'prohibited'); location.href = 'policy.html'; return; }
      else if (b.hasAttribute('data-ap-add')) { picker.click(); return; }
      else if (b.hasAttribute('data-ap-remove')) { b.closest('[data-ap-photo]').remove(); paintPhotos(); return; }
      else if (b.hasAttribute('data-ap-submit')) { submit(); return; }
      paintAll();
    }, true);
    priceIn.addEventListener('input', function () { priceIn.value = priceIn.value.replace(/\D/g, '').slice(0, 6); clearErr('price'); paintAll(); });
    usesIn.addEventListener('input', function () { usesIn.value = usesIn.value.replace(/\D/g, '').slice(0, 2); });
    nameIn.addEventListener('input', function () { clearErr('name'); });
    brandIn.addEventListener('input', function () { clearErr('brand'); });
    descIn.addEventListener('input', function () { $a('[data-ap-desc-count]').textContent = descIn.value.length + ' / 500'; });
    // photos: real picker, previews kept small so they fit in the session
    var picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/*'; picker.multiple = true; picker.hidden = true; screen.appendChild(picker);
    var tiles = function () { return [].slice.call(phBox.querySelectorAll('[data-ap-photo]')); };
    var paintPhotos = function () {
      tiles().forEach(function (t, i) { t.querySelector('[data-ap-cover]').style.display = i === 0 ? 'flex' : 'none'; });
      var n = tiles().length; addBtn.style.display = n >= 5 ? 'none' : 'flex';
      $a('[data-ap-count]').textContent = n + ' من 5';
      if (n) clearErr('photos');
    };
    if (editP) { var et = phTpl.cloneNode(true), eim = et.querySelector('img'); eim.src = editP.src; eim.alt = editP.name; if (editP.src.indexOf('data:') === 0) { eim.style.objectFit = 'cover'; eim.style.mixBlendMode = 'normal'; eim.style.padding = '0'; } phBox.insertBefore(et, addBtn); }
    picker.addEventListener('change', function () {
      [].slice.call(picker.files).forEach(function (f) {
        if (tiles().length >= 5) { toast('الحد الأقصى 5 صور'); return; }
        var t = phTpl.cloneNode(true), im = t.querySelector('img');
        im.style.objectFit = 'cover'; im.style.mixBlendMode = 'normal'; im.style.padding = '0'; im.alt = 'صورة المنتج';
        phBox.insertBefore(t, addBtn);
        var raw = new Image(); raw.onload = function () { var k = Math.min(1, 600 / Math.max(raw.width, raw.height)), cv = document.createElement('canvas'); cv.width = Math.round(raw.width * k); cv.height = Math.round(raw.height * k); cv.getContext('2d').drawImage(raw, 0, 0, cv.width, cv.height); im.src = cv.toDataURL('image/jpeg', 0.75); URL.revokeObjectURL(raw.src); };
        raw.src = URL.createObjectURL(f);
      });
      picker.value = ''; paintPhotos();
    });
    paintPhotos();
    var fail = function (k, msg) {
      var f = $a('[data-ap-field="' + k + '"]'); clearErr(k);
      f.insertAdjacentHTML('beforeend', '<span data-ap-err style="font-size: 12px; line-height: 18px; font-weight: 700; color: #B42318">' + msg + '</span>');
      f.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(msg); return false;
    };
    var submit = function () {
      var name = nameIn.value.trim(), price = parseInt(priceIn.value, 10) || 0, uses = usesIn.value === '' ? NaN : parseInt(usesIn.value, 10);
      var color = st.color === 'آخر' ? (colorOther && colorOther.querySelector('input').value.trim()) : st.color;
      if (!tiles().length) return fail('photos', 'يلزم رفع صورة واحدة على الأقل');
      if (name.length < 3) return fail('name', 'اسم المنتج مطلوب');
      if (!st.cat) return fail('cat', 'التصنيف مطلوب');
      if (!st.size && st.cat !== 'شنط') return fail('size', 'المقاس مطلوب');
      if (!color) return fail('color', 'اللون مطلوب');
      if (!st.nobrand && !brandIn.value.trim()) return fail('brand', 'الماركة مطلوبة، أو اختيار «بدون ماركة»');
      if (!st.cond) return fail('cond', 'حالة المنتج مطلوبة');
      if (isNaN(uses) || uses < 0) return fail('uses', 'عدد مرات الاستخدام مطلوب');
      if (price <= 0) return fail('price', 'يلزم إدخال سعر صحيح');
      var PRL = products(), id = editP ? editP.id : Date.now();
      if (editP) PRL = PRL.filter(function (x) { return x.id !== editP.id; });
      PRL.unshift({ id: id, src: tiles()[0].querySelector('img').src, alt: name, name: name, price: price, st: 'قيد المراجعة', sub: 'تم إرساله للمراجعة الآن، ولم يظهر للمشترين بعد',
        cat: st.cat, size: st.size, color: color, brand: st.nobrand ? 'بدون ماركة' : brandIn.value.trim(), cond: st.cond, uses: uses, auth: st.auth, city: $a('[data-ap-city-value]').textContent, desc: descIn.value.trim() });
      write('outlet-products', PRL); write('outlet-ap-last', id);
      if (editP) { write('outlet-flash', 'تم حفظ التعديل وعاد المنتج للمراجعة'); location.replace('my-products.html'); return; }
      location.replace('add-product-sent.html');
    };
  }

  if (page === 'add-product-sent.html') {
    var lastId = read('outlet-ap-last', 0), lp = products().filter(function (x) { return x.id === lastId; })[0];
    if (lp) {
      var li = screen.querySelector('[data-aps-img]'); li.src = lp.src; li.alt = lp.name;
      if (lp.src.indexOf('data:') === 0) { li.style.objectFit = 'cover'; li.style.mixBlendMode = 'normal'; li.parentNode.style.padding = '0'; }
      screen.querySelector('[data-aps-name]').textContent = lp.name;
      screen.querySelector('[data-aps-price]').innerHTML = riyal(10, 11) + lp.price;
    }
  }

  if (page === 'seller-setup.html') {
    demoFill(screen.querySelector('[data-ss-id]'), '1098765432'); demoFill(screen.querySelector('[data-ss-iban]'), '80 1000 0000 1234 5678 9012');
    var ssAddr = (ADDRS.filter(function (a) { return a.pickup; })[0] || ADDRS[0]);
    var ssV = screen.querySelector('[data-ss-addr-value]');
    ssV.textContent = ssAddr ? ssAddr.label + ' · ' + ssAddr.line : 'اختيار عنوان';
    screen.querySelector('[data-ss-addr]').addEventListener('click', function (e) {
      e.stopPropagation();
      pickSheet('عنوان الاستلام', ADDRS.map(function (a) { return a.label + ' · ' + a.line; }).concat(['+ عنوان جديد']), ssV.textContent, function (v) {
        if (v === '+ عنوان جديد') { write('outlet-addr-edit', -1); write('outlet-addr-return', 'seller-setup.html'); location.href = 'address-form.html'; return; }
        ssV.textContent = v; ssAddr = ADDRS.filter(function (a) { return a.label + ' · ' + a.line === v; })[0]; });
    });
    var ibanIn = screen.querySelector('[data-ss-iban]');
    var ssBank = read('outlet-bank', null);
    if (ssBank && ssBank.iban) ibanIn.value = ssBank.iban.replace(/(.{2})(.{4})(.{4})(.{4})(.{4})(.{4})/, '$1 $2 $3 $4 $5 $6');
    ibanIn.addEventListener('input', function () { var d = ibanIn.value.replace(/\D/g, '').slice(0, 22); ibanIn.value = d.replace(/(.{2})(.{0,4})(.{0,4})(.{0,4})(.{0,4})(.{0,4})/, function () { return [].slice.call(arguments, 1, 7).filter(Boolean).join(' '); }); });
    screen.querySelector('[data-ss-save]').addEventListener('click', function (e) {
      e.stopPropagation();
      var id = screen.querySelector('[data-ss-id]').value.replace(/\D/g, ''), ib = ibanIn.value.replace(/\D/g, '');
      if (!/^[12]\d{9}$/.test(id)) { toast('رقم الهوية 10 أرقام ويبدأ بـ 1 أو 2'); return; }
      if (!ssAddr) { toast('اختيار عنوان الاستلام'); return; }
      if (ssAddr.fee == null) toast('المندوب لا يستلم من ' + ssAddr.city + ' بعد، لذا ستُعرض قطعك بالتسليم المباشر فقط');
      if (ib.length !== 22) { toast('يجب أن يكون الآيبان SA و22 رقمًا'); return; }
      ADDRS.forEach(function (a) { a.pickup = a === ssAddr; }); write('outlet-addrs', ADDRS);
      write('outlet-bank', { name: profile().name, iban: ib }); write('outlet-seller-ok', true);
      toast('تمام، يمكنك إضافة منتجك'); setTimeout(function () { location.replace('add-product.html'); }, 600);
    });
  }

  // ---------- U-33 rating (one per party per completed order, final once sent) ----------
  var RATE_LABELS = ['', 'سيئ', 'غير جيد', 'جيد', 'جيد جدًا', 'ممتاز'];
  var STAR_D = 'M13.73 3.51l1.76 3.52c.24.49.88.96 1.42 1.05l3.19.53c2.04.34 2.52 1.82 1.05 3.28l-2.48 2.48c-.42.42-.65 1.23-.52 1.81l.71 3.07c.56 2.43-.73 3.37-2.88 2.1l-2.99-1.77c-.54-.32-1.43-.32-1.98 0l-2.99 1.77c-2.14 1.27-3.44.32-2.88-2.1l.71-3.07c.13-.58-.1-1.39-.52-1.81l-2.48-2.48c-1.46-1.46-.99-2.94 1.05-3.28l3.19-.53c.53-.09 1.17-.56 1.41-1.05l1.76-3.52c.96-1.91 2.52-1.91 3.47 0Z';
  var starsHTML = function (n, sz) { var h = ''; for (var i = 1; i <= 5; i++) { var on = i <= n; h += '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="' + (on ? '#EA580C' : 'none') + '" stroke="' + (on ? '#EA580C' : '#D6CEC7') + '" stroke-width="1.4" aria-hidden="true"><path d="' + STAR_D + '"></path></svg>'; } return h; };
  function ratings() { return read('outlet-ratings', {}); }
  function rateTarget(v) {
    var o = v.role === 'sell' ? SELL_ORDERS.filter(function (x) { return x.no === v.no; })[0] : allOrders().filter(function (x) { return x.no === v.no; })[0];
    return o ? { o: o, name: v.role === 'sell' ? o.buyer : o.seller[0], who: v.role === 'sell' ? 'المشتري' : 'البائع' } : null;
  }

  if (page === 'rate.html') {
    var rv = read('outlet-rate-view', { no: 'OUT-24611', role: 'buy' }), rt = rateTarget(rv), rkey = rv.no + '|' + rv.role;
    var backTo = rv.role === 'sell' ? 'incoming-order.html' : 'order.html';
    if (!rt || rt.o.status !== 'completed') { toast('يُتاح التقييم بعد اكتمال الطلب فقط'); setTimeout(function () { location.replace(backTo); }, 900); return; }
    if (ratings()[rkey]) { location.replace('rate-sent.html'); return; }
    var rq = function (s) { return screen.querySelector(s); };
    rq('h1').textContent = 'تقييم ' + rt.who;
    rq('[data-rate-q]').textContent = 'كيف كانت التجربة مع ' + rt.who + ' بشكل عام؟';
    rq('[data-rate-initial]').textContent = rt.name.charAt(0);
    rq('[data-rate-name]').textContent = rt.name;
    rq('[data-rate-sub]').innerHTML = rt.who + ' · طلب <span style="direction: ltr; display: inline-block">' + rt.o.no + '</span> · ' + esc(rt.o.items[0].name);
    var rimg = rq('[data-rate-thumb]'); rimg.src = rt.o.items[0].src; rimg.alt = rt.o.items[0].alt || rt.o.items[0].name;
    var note = rq('[data-rate-text]').closest('div').nextElementSibling; if (note) note.lastElementChild.textContent = rv.role === 'sell' ? 'يصل تقييمك للمشتري إلى فريق outlet ولا يظهر للعامة، ولا يمكن تعديله بعد الإرسال.' : 'يُنشر التقييم مباشرة في صفحة البائع، ولا يمكن تعديله بعد الإرسال.';
    var stars = 5, txt = rq('[data-rate-text]'), cnt = rq('[data-rate-count]'), send = rq('[data-rate-send]');
    txt.value = rv.role === 'sell' ? 'تواصل سريع واستلم في الموعد. شكرًا!' : 'القطعة نفس الوصف بالضبط، والتغليف مرتب والتعامل راقي.'; cnt.textContent = txt.value.length + ' / 300';
    var paintStars = function () {
      [].forEach.call(screen.querySelectorAll('[data-rate-star]'), function (b) {
        var on = +b.getAttribute('data-rate-star') <= stars, svg = b.querySelector('svg');
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.style.color = on ? '#EA580C' : '#D6CEC7'; svg.setAttribute('fill', on ? '#EA580C' : 'none');
      });
      rq('[data-rate-label]').textContent = stars ? RATE_LABELS[stars] : 'التقييم من 1 إلى 5 نجوم';
      rq('[data-rate-label]').style.color = stars ? '#C2410C' : '#8E857F';
      send.style.opacity = stars ? '1' : '0.4';
    };
    paintStars();
    screen.addEventListener('click', function (e) {
      var s = e.target.closest('[data-rate-star]');
      if (s) { e.preventDefault(); e.stopPropagation(); stars = +s.getAttribute('data-rate-star'); paintStars(); return; }
      if (e.target.closest('[data-rate-send]')) {
        e.preventDefault(); e.stopPropagation();
        if (!stars) { toast('عدد النجوم مطلوب'); return; }
        var all = ratings(); if (all[rkey]) { location.replace('rate-sent.html'); return; }
        all[rkey] = { stars: stars, text: txt.value.trim(), date: fmtDate(new Date(), true) };
        write('outlet-ratings', all); location.replace('rate-sent.html');
      }
    }, true);
    txt.addEventListener('input', function () { cnt.textContent = txt.value.length + ' / 300'; });
  }

  if (page === 'rate-sent.html') {
    var sv = read('outlet-rate-view', { no: 'OUT-24611', role: 'buy' }), st2 = rateTarget(sv), rr = ratings()[sv.no + '|' + sv.role];
    if (st2 && rr) {
      screen.querySelector('[data-rs-name]').textContent = st2.name;
      screen.querySelector('[data-rs-stars]').innerHTML = starsHTML(rr.stars, 18);
      var cm = screen.querySelector('[data-rs-comment]');
      if (rr.text) cm.textContent = '«' + rr.text + '»'; else cm.remove();
      screen.querySelector('[data-rs-meta]').innerHTML = 'طلب <span style="direction: ltr; display: inline-block">' + sv.no + '</span> · ' + rr.date;
      screen.querySelector('[data-rs-text]').textContent = sv.role === 'sell' ? 'تم تسجيل تقييمك. تقييمات المشترين لا تظهر للعامة، ولا يمكن تعديلها.' : 'نُشر تقييمك في صفحة البائع ولا يمكن تعديله.';
    }
    var rsBack = screen.querySelector('[data-rs-back]');
    rsBack.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (sv.role === 'sell') { write('outlet-inc-view', sv.no); location.href = 'incoming-order.html'; } else { write('outlet-order-view', sv.no); location.href = 'order.html'; }
    }, true);
  }

  // ---------- U-10 favourites ----------
  if (page === 'favorites.html') {
    var fg = screen.querySelector('[data-fav-grid]'), fc = screen.querySelector('[data-fav-count]');
    var HEART_D = 'M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z';
    var favList = function () { return Object.keys(favs).map(function (k) { var v = favs[k]; return typeof v === 'object' ? v : infoFor(k, k.replace(/^.*\//, '').replace(/\.\w+$/, ''), '', 0, 0); }); };
    var renderFav = function () {
      var L = favList();
      fc.textContent = L.length ? L.length + (L.length > 10 || L.length < 3 ? ' قطعة' : ' قطع') : '';
      if (!L.length) {
        fg.parentNode.innerHTML = '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 60px 12px 0"><span aria-hidden="true" style="width: 88px; height: 88px; border-radius: 999px; background: #FFF4EC; color: #EA580C; display: flex; align-items: center; justify-content: center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="' + HEART_D + '"></path></svg></span><h2 style="margin: 0; font-size: 18px; line-height: 26px; font-weight: 700">لا توجد منتجات في المفضلة</h2><p style="margin: 0; font-size: 14px; line-height: 22px; color: #6B635D">الضغط على القلب في أي قطعة يحفظها للرجوع إليها لاحقًا.</p><a href="./" style="margin-top: 8px; height: 50px; padding: 0 28px; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; display: flex; align-items: center">تصفّح القطع</a></div>';
        return;
      }
      fg.innerHTML = L.map(function (p) {
        var off = !!p.st, sold = p.st === 'تم البيع';
        return '<div data-fav-card data-src="' + p.src + '" style="display: flex; flex-direction: column; gap: 6px; min-width: 0; cursor: pointer"><span style="position: relative; aspect-ratio: 3 / 4; border-radius: 18px; background: #F7F3F0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 12px; box-sizing: border-box"><img src="' + p.src + '" alt="' + esc(p.alt || p.name) + '" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply;' + (off ? ' opacity: 0.45;' : '') + '">' +
          '<button type="button" data-fav-remove aria-label="شيل ' + esc(p.name) + ' من المفضلة" style="position: absolute; top: 8px; left: 8px; width: 36px; height: 36px; border: 0; border-radius: 999px; background: #FFFFFF; color: #EA580C; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 2px 8px rgba(28,25,23,0.08)"><svg width="18" height="18" viewBox="0 0 24 24" fill="#EA580C" stroke="#EA580C" stroke-width="1.4" aria-hidden="true"><path d="' + HEART_D + '"></path></svg></button>' +
          (off ? '<span style="position: absolute; bottom: 8px; right: 8px; height: 24px; padding: 0 10px; border-radius: 999px; background: ' + (sold ? '#1C1917; color: #FFFFFF' : '#FFFFFF; color: #6B635D') + '; font-size: 11px; font-weight: 700; display: flex; align-items: center">' + p.st + '</span>' : '') + '</span>' +
          '<span style="font-size: 14px; line-height: 20px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' + (off ? ' color: #8E857F;' : '') + '">' + esc(p.name) + '</span>' +
          '<span style="display: flex; align-items: center; justify-content: space-between; gap: 6px"><span style="direction: ltr; display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 700; color: ' + (off ? '#8E857F' : '#1C1917') + '">' + riyal(10, 11) + (p.priceNum || '') + '</span><span style="font-size: 11px; line-height: 16px; color: #8E857F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">' + esc((p.seller || [''])[0]) + '</span></span></div>';
      }).join('');
    };
    renderFav();
    screen.addEventListener('click', function (e) {
      var card = e.target.closest('[data-fav-card]'); if (!card) return;
      e.preventDefault(); e.stopPropagation();
      var src = card.getAttribute('data-src'), p = favs[src];
      if (e.target.closest('[data-fav-remove]')) {
        delete favs[src]; write('outlet-favs', favs);
        card.style.transition = 'opacity .2s, transform .2s'; card.style.opacity = '0'; card.style.transform = 'scale(.96)';
        setTimeout(renderFav, 200); toast('تمت الإزالة من المفضلة'); return;
      }
      if (p && p.st === 'تم البيع') { toast('تم بيع هذه القطعة، ولا يمكن شراؤها'); return; }
      if (p && p.st) { toast('القطعة غير متاحة للعرض الآن'); return; }
      write('outlet-product', typeof p === 'object' ? p : infoFor(src, '', '', 0, 0)); location.href = 'product.html';
    }, true);
  }

  // ---------- U-34 notifications (in-app list; read state per session) ----------
  var NOTIF_UNREAD = [1, 2, 3];
  var NOTIF_GO = {
    1: ['outlet-chat-view', 'OUT-24790', 'chat.html'], 2: ['outlet-order-view', 'OUT-24790', 'order.html'], 3: ['outlet-inc-view', 'OUT-24833', 'incoming-order.html'],
    4: ['outlet-inc-view', 'OUT-24810', 'incoming-order.html'], 5: [null, null, 'withdrawals.html'], 6: ['outlet-order-view', 'OUT-24655', 'dispute.html'],
    7: ['outlet-pd-id', 1, 'product-status.html'], 8: [null, null, 'wallet.html'], 9: ['outlet-pd-id', 3, 'product-status.html']
  };
  function notifRead() { return read('outlet-notif-read', {}); }
  function notifUnread() { var r = notifRead(); return NOTIF_UNREAD.filter(function (i) { return !r[i]; }).length; }
  // bell on every page opens the list; a dot shows while something is unread
  (function () {
    var bells = [].slice.call(document.querySelectorAll('a[href="#notifications"]'));
    var n = notifUnread();
    bells.forEach(function (b) {
      b.setAttribute('aria-label', n ? 'الإشعارات، فيه ' + n + ' جديد' : 'الإشعارات');
      var dot = b.querySelector('[data-bell-dot]') || [].filter.call(b.querySelectorAll('span'), function (s) { return /border-radius: 999px/.test(s.getAttribute('style') || '') && !s.querySelector('svg'); })[0];
      if (!dot && n) { b.style.position = 'relative'; b.insertAdjacentHTML('beforeend', '<span data-bell-dot aria-hidden="true" style="position: absolute; top: 9px; left: 11px; width: 9px; height: 9px; border-radius: 999px; background: #EA580C; box-shadow: 0 0 0 2px #FFFFFF"></span>'); }
      else if (dot && !n) dot.style.display = 'none';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); location.href = 'notifications.html'; }, true);
    });
  })();

  if (page === 'notifications.html') {
    var nl = screen.querySelector('[data-n-list]'), nc = screen.querySelector('[data-n-unread]');
    if (read('outlet-notify', true) === false) nl.insertAdjacentHTML('beforebegin', '<a href="settings.html" style="margin: 0 0 4px; padding: 12px 14px; border-radius: 16px; background: #FEF6E7; color: #9A5800; display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 20px; font-weight: 700; text-decoration: none"><span style="flex: 1">إشعارات الجوال مغلقة، فالتحديثات تظهر هنا فقط. لتأكيد الاستلام مهلة 24 ساعة.</span><span style="flex: none; text-decoration: underline">تفعيل</span></a>');
    var paintN = function () {
      var r = notifRead(), n = notifUnread();
      nc.textContent = n ? n + ' جديدة' : '';
      [].forEach.call(nl.querySelectorAll('[data-notif]'), function (row) {
        var id = +row.getAttribute('data-notif'), un = NOTIF_UNREAD.indexOf(id) !== -1 && !r[id];
        row.style.background = un ? '#FFF4EC' : 'transparent';
        var title = row.querySelector('span[style*="flex: 1; min-width: 0; font-size: 14px"]'); if (title) title.style.fontWeight = un ? '700' : '500';
        var dot = row.querySelector('[aria-label="غير مقروء"]'); if (dot) dot.style.display = un ? 'block' : 'none';
      });
      screen.querySelector('[data-n-readall]').style.visibility = n ? 'visible' : 'hidden';
    };
    paintN();
    screen.addEventListener('click', function (e) {
      if (e.target.closest('[data-n-readall]')) {
        e.preventDefault(); e.stopPropagation();
        var r = notifRead(); NOTIF_UNREAD.forEach(function (i) { r[i] = true; }); write('outlet-notif-read', r); paintN(); toast('تم تعليم كل الإشعارات كمقروءة'); return;
      }
      var row = e.target.closest('[data-notif]'); if (!row) return;
      e.preventDefault(); e.stopPropagation();
      var id = +row.getAttribute('data-notif'), r2 = notifRead(); r2[id] = true; write('outlet-notif-read', r2);
      var g = NOTIF_GO[id]; if (g[0]) write(g[0], g[1]);
      location.href = g[2];
    }, true);
  }

  // ---------- U-19 tax invoice (outlet's own services: service fee + delivery, VAT 15% included) ----------
  if (page === 'invoice.html') {
    var ivNo = read('outlet-invoice-view', read('outlet-order-view', 'OUT-24790'));
    var iv = allOrders().filter(function (x) { return x.no === ivNo; })[0] || allOrders()[0];
    var q3 = function (s) { return screen.querySelector(s); };
    var m2 = function (n, sz, b) { return '<span style="direction: ltr; display: inline-flex; align-items: center; gap: 3px; font-size: ' + sz + 'px; font-weight: ' + (b ? 700 : 500) + '">' + riyal(9, 10) + n.toFixed(2) + '</span>'; };
    var split = function (gross) { var net = Math.round(gross / 1.15 * 100) / 100; return [net, Math.round((gross - net) * 100) / 100, gross]; };
    var lines = [['رسوم الخدمة', iv.fee || 0]].concat(iv.delivery ? [['رسوم التوصيل', iv.delivery]] : []);
    var tN = 0, tV = 0, tT = 0;
    q3('[data-inv-rows]').innerHTML = lines.map(function (l) {
      var s = split(l[1]); tN += s[0]; tV += s[1]; tT += s[2];
      var td = 'padding: 10px 6px; font-size: 12px; line-height: 18px; vertical-align: top';
      return '<tr><td style="' + td + '; font-weight: 500">' + l[0] + '</td><td style="' + td + '">' + m2(s[0], 12) + '</td><td style="' + td + '">' + m2(s[1], 12) + '</td><td style="' + td + '">' + m2(s[2], 12, 1) + '</td></tr>';
    }).join('');
    q3('[data-inv-net]').innerHTML = m2(tN, 13); q3('[data-inv-vat]').innerHTML = m2(tV, 13); q3('[data-inv-total]').innerHTML = m2(tT, 16, 1);
    var digits = iv.no.replace(/\D/g, '');
    q3('[data-inv-no]').textContent = 'INV-2026-0' + digits;
    q3('[data-inv-order]').textContent = iv.no;
    q3('[data-inv-date]').textContent = (iv.times && iv.times.paid) ? iv.times.paid.replace(' · ', ' 2026 · ') : iv.date;
    q3('[data-inv-buyer]').textContent = read('outlet-profile', { name: 'لمى الحربي' }).name;
    if (iv.status === 'cancelled' || effSt(iv) === 'refunded') {
      var paper = q3('[data-inv-paper]');
      paper.insertAdjacentHTML('afterbegin', '<div style="padding: 10px 12px; border-radius: 12px; background: #FEF3F2; font-size: 12px; line-height: 18px; font-weight: 700; color: #B42318">تم إلغاء الطلب، وصدر إشعار دائن <span style="direction: ltr; display: inline-block">CN-2026-0' + digits + '</span> بنفس المبلغ ورجع لمحفظتك.</div>');
    }
    screen.addEventListener('click', function (e) {
      if (e.target.closest('[data-inv-pdf]')) { e.preventDefault(); e.stopPropagation(); toast('في النسخة النهائية تُحمَّل الفاتورة PDF من منصة «فاتورة»'); }
      else if (e.target.closest('[data-inv-share]')) {
        e.preventDefault(); e.stopPropagation();
        if (navigator.share) navigator.share({ title: 'فاتورة outlet ' + iv.no, text: 'فاتورة ضريبية مبسطة · ' + iv.no }).catch(function () {});
        else toast('المشاركة متاحة من الجوال');
      }
    }, true);
  }

  // ---------- review fix: a piece bought in a (non-cancelled) order is sold: no buying, gone from browse lists ----------
  var SOLD_SRC = {};
  allOrders().forEach(function (o) { if (o.status !== 'cancelled') (o.items || []).forEach(function (it) { if (it.src) SOLD_SRC[it.src.replace(/^.*\//, '')] = 1; }); });
  var isSold = function (src) { return !!SOLD_SRC[(src || '').replace(/^.*\//, '')]; };
  if (page === 'product.html') {
    var spP = read('outlet-product', null);
    if (spP && isSold(spP.src)) {
      var spAdd = screen.querySelector('[data-act="add"]'), spBuy = screen.querySelector('[data-act="buy"]');
      if (spAdd) spAdd.remove();
      if (spBuy) { spBuy.removeAttribute('data-act'); spBuy.disabled = true; spBuy.textContent = 'تم بيع القطعة'; spBuy.style.background = '#F7F3F0'; spBuy.style.color = '#8E857F'; spBuy.style.cursor = 'default'; }
      [].forEach.call(screen.querySelectorAll('p'), function (el) { if (/قطعة واحدة متاحة/.test(el.textContent)) el.lastChild.textContent = 'تم بيع هذه القطعة ولم تعد متاحة للشراء.'; });
    }
  }
  if (page === 'index.html' || page === 'category.html' || page === 'search.html') {
    [].forEach.call(screen.querySelectorAll('img'), function (im) {
      if (!isSold(im.getAttribute('src'))) return;
      var card = im.closest('div[style*="border-radius: 18px"]');
      while (card && card.parentElement && card.parentElement !== screen) { var ps = getComputedStyle(card.parentElement); if (ps.display === 'grid' || /auto|scroll/.test(ps.overflowX)) break; card = card.parentElement; }
      if (card && card.parentElement !== screen) card.style.display = 'none';
    });
    var gg = page === 'category.html' && screen.querySelector('div[style*="grid-template-columns: repeat(2"]');
    var ggN = gg ? [].filter.call(gg.children, function (c) { return c.style.display !== 'none'; }).length : 0, ggC = gg && screen.querySelector('h1') && screen.querySelector('h1').nextElementSibling;
    var ggCat = new URLSearchParams(location.search).get('cat');
    if (ggC && ggCat && ggCat !== 'فساتين') ggC.textContent = ggN ? ggN + (ggN === 1 ? ' قطعة' : ggN === 2 ? ' قطعتين' : ' قطع') : '';
    if (gg && gg.children.length && !ggN) gg.insertAdjacentHTML('afterend', '<div style="padding: 60px 30px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center"><b style="font-size: 17px; line-height: 24px">لا توجد منتجات متاحة</b><span style="font-size: 14px; line-height: 22px; color: #6B635D">القطع هنا تم بيعها. تُضاف القطع الجديدة بعد مراجعة فريق outlet.</span></div>');
  }

  // ---------- U-23 seller product details & review status ----------
  var PD_SEED = {
    1: { cat: 'فساتين', size: 'M', color: 'تيراكوتا', brand: 'Zara', cond: 'ممتازة', uses: 2, desc: 'فستان ميدي بقصّة واسعة وأكمام طويلة، القماش خفيف ومناسب للمشاوير. استُخدم مرتين فقط ولا يوجد فيه أي عيوب.', date: '3 نوفمبر', views: 128, favs: 9 },
    2: { cat: 'ملابس', size: 'L', color: 'سماوي', brand: 'Massimo Dutti', cond: 'جديدة بالتيكت', uses: 0, desc: 'قميص كتان سماوي بقصّة واسعة، ما زال بالتيكت ولم يُستخدم. مناسب للصيف.', date: '7 نوفمبر' },
    3: { cat: 'فساتين', size: 'S', color: 'أبيض', brand: 'Zara', cond: 'جيدة', uses: 2, desc: 'فستان طويل بلون عاجي وأكمام طويلة. فيه علامة خفيفة عند الطرف السفلي، وتظهر في الصورة الثالثة.', date: '6 نوفمبر' },
    4: { cat: 'فساتين', size: 'M', color: 'أسود', brand: 'Mango', cond: 'ممتازة', uses: 1, desc: 'فستان أسود كلاسيك بطول الركبة، استُخدم مرة واحدة في مناسبة.', date: '28 أكتوبر' },
    5: { cat: 'ملابس', size: 'M', color: 'كحلي وأبيض', brand: 'H&M', cond: 'ممتازة', uses: 3, desc: 'سويتر قطن مخطط، دافئ وغير ثقيل.', date: '20 أكتوبر' },
    6: { cat: 'ملابس', size: 'M', color: 'بيج', brand: 'بدون ماركة', cond: 'جيدة', uses: 5, desc: 'بنطلون واسع بخصر عالي، القماش مريح.', date: '18 أكتوبر' },
    7: { cat: 'فساتين', size: 'S', color: 'وردي', brand: 'بدون ماركة', cond: 'كالجديدة', uses: 1, desc: 'فستان سهرة وردي طويل، استُخدم مرة واحدة.', date: '2 أكتوبر' },
    8: { cat: 'فساتين', size: 'M', color: 'كحلي', brand: 'بدون ماركة', cond: 'ممتازة', uses: 2, desc: 'فستان منقّط بأكمام قصيرة.', date: '25 سبتمبر' }
  };
  if (page === 'product-status.html') {
    var pdId = read('outlet-pd-id', 1), PDL = products(), pd = PDL.filter(function (x) { return x.id === pdId; })[0];
    if (!pd) { location.replace('my-products.html'); return; }
    var pdBody = screen.querySelector('.noscroll'), pdBar = pdBody.nextElementSibling;
    var PDC = { 'منشور': ['#ECF6EF', '#1F7A4D'], 'قيد المراجعة': ['#FEF6E7', '#9A5800'], 'مرفوض': ['#FEF3F2', '#B42318'], 'مخفي': ['#F2F2F2', '#4A4440'], 'مباع': ['#FDEBDD', '#9A3412'] };
    var usesTxt = function (n) { n = +n || 0; return n === 0 ? 'لم تُستخدم' : n === 1 ? 'مرة واحدة' : n === 2 ? 'مرتين' : n <= 10 ? n + ' مرات' : n + ' مرة'; };
    var pdNote = function (t) { return '<div style="padding: 12px 14px; border-radius: 16px; background: #F7F3F093; display: flex; gap: 8px; font-size: 12px; line-height: 18px; color: #6B635D"><span style="display: flex; flex: none; margin-top: 1px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10ZM12 8v5M11.995 16h.009"></path></svg></span><span>' + t + '</span></div>'; };
    var pdStep = function (t, s, state) {
      var dot = state === 'done' ? '<span aria-hidden="true" style="width: 20px; height: 20px; border-radius: 999px; background: #9A5800; color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex: none"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>'
        : state === 'now' ? '<span aria-hidden="true" style="width: 20px; height: 20px; border-radius: 999px; background: #FFFFFF; box-shadow: inset 0 0 0 5px #9A5800; flex: none"></span>'
        : '<span aria-hidden="true" style="width: 20px; height: 20px; border-radius: 999px; background: #FFFFFF; flex: none"></span>';
      return '<div style="display: flex; align-items: center; gap: 10px">' + dot + '<span style="flex: 1; font-size: 13px; line-height: 20px; font-weight: ' + (state === 'todo' ? '500; color: #8E857F' : '700; color: #1C1917') + '">' + t + '</span><span style="font-size: 12px; color: #8E857F">' + s + '</span></div>';
    };
    var btnL = 'height: 54px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: 1';
    var btnD = 'height: 54px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: 1.3';
    var renderPD = function () {
      var d = {}, k, seed = PD_SEED[pd.id] || {};
      for (k in seed) d[k] = seed[k];
      for (k in pd) if (pd[k] != null && pd[k] !== '') d[k] = pd[k];
      var st = pd.st, c = PDC[st] || PDC['مخفي'];
      var orderNo = pd.order || ((pd.sub || '').match(/OUT-\d+/) || [])[0];
      var activeOrder = st === 'مباع' && !/اكتمل/.test(pd.sub || '');
      var reason = d.reason || (pd.sub || '').replace(/^سبب الرفض: /, '');
      var isData = pd.src.indexOf('data:') === 0;
      var S = st === 'منشور' ? ['منشور وظاهر للمشترين', 'فريق outlet وافق عليه' + (d.date ? ' يوم ' + d.date : '') + '. أي تعديل يخفيه ويعيده للمراجعة.', '']
        : st === 'قيد المراجعة' ? ['المنتج قيد المراجعة', 'غير ظاهر للمشترين حتى يوافق عليه فريق outlet. اعتماد المنتج من الفريق فقط.',
          '<div style="margin-top: 4px; padding: 12px; border-radius: 14px; background: #FFFFFF; display: flex; flex-direction: column; gap: 10px">' + pdStep('أُرسل للمراجعة', pd.sent || (pd.sub && /الآن|دلوقتي/.test(pd.sub) ? 'اليوم' : d.date || 'اليوم'), 'done') + pdStep('فريق outlet يراجعه', 'الآن', 'now') + pdStep('القرار', 'سيصلك إشعار', 'todo') + '</div>']
        : st === 'مرفوض' ? ['تم رفض المنتج', 'غير ظاهر للمشترين. بعد تعديل ما ورد في السبب وإعادة الإرسال، سيعود للمراجعة.',
          '<div style="margin-top: 4px; padding: 12px; border-radius: 14px; background: #FFFFFF; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; line-height: 16px; font-weight: 700; color: #B42318">سبب الرفض</span><span style="font-size: 14px; line-height: 22px; font-weight: 700">' + esc(reason) + '</span></div>']
        : st === 'مخفي' ? ['مخفي عن المشترين', 'المنتج معتمد لكنه غير ظاهر. يمكن إعادة إظهاره دون مراجعة جديدة ما دام لم يُعدَّل.', '']
        : ['تم البيع', orderNo ? (activeOrder ? 'تم بيع القطعة في الطلب <span style="direction: ltr; display: inline-block">' + orderNo + '</span>، والطلب ما زال جاريًا. لا يمكن تعديل المنتج أو إخفاؤه حتى يكتمل الطلب.' : 'تم بيع القطعة في الطلب <span style="direction: ltr; display: inline-block">' + orderNo + '</span>، والطلب اكتمل.') : 'تم بيع القطعة.', ''];
      var net = Math.round(pd.price * 0.85 * 10) / 10;
      var rows = [['التصنيف', d.cat], ['المقاس', d.size], ['اللون', d.color], ['الماركة', d.brand], ['حالة المنتج', d.cond], ['مرات الاستخدام', d.uses != null ? usesTxt(d.uses) : ''], ['أصلية أو تقليد', d.auth || 'أصلية'], ['مدينة الاستلام', d.city || profile().city]].filter(function (r) { return r[1]; });
      var tile = 'width: 36px; height: 36px; flex: none; border-radius: 999px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; color: #C2410C';
      var statT = function (path, n, l) { return '<div style="padding: 12px; border-radius: 16px; background: #F7F3F093; display: flex; align-items: center; gap: 10px"><span aria-hidden="true" style="' + tile + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg></span><span style="display: flex; flex-direction: column"><b style="font-size: 16px; line-height: 22px">' + n + '</b><span style="font-size: 12px; line-height: 16px; color: #6B635D">' + l + '</span></span></div>'; };
      pdBody.innerHTML =
        '<div style="position: relative; height: 300px; flex: none; border-radius: 24px; background: #F7F3F0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: ' + (isData ? '0' : '18px') + '; box-sizing: border-box"><img src="' + pd.src + '" alt="' + esc(pd.alt || pd.name) + '" style="width: 100%; height: 100%; object-fit: ' + (isData ? 'cover' : 'contain') + '; mix-blend-mode: ' + (isData ? 'normal' : 'multiply') + '; opacity: ' + (st === 'مخفي' ? '0.55' : '1') + '">' +
        '<span style="position: absolute; top: 12px; right: 12px; height: 26px; padding: 0 10px; border-radius: 999px; background: #FFFFFF; color: ' + c[1] + '; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 999px; background: ' + c[1] + '"></span>' + st + '</span></div>' +
        '<section aria-label="حالة المراجعة" style="padding: 14px; border-radius: 20px; background: ' + c[0] + '; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 16px; line-height: 24px; font-weight: 700; color: ' + c[1] + '">' + S[0] + '</span><span style="font-size: 13px; line-height: 20px; color: #4A4440">' + S[1] + '</span>' + S[2] + '</section>' +
        '<div style="display: flex; flex-direction: column; gap: 4px"><div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px"><h2 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 700">' + esc(pd.name) + '</h2><span style="direction: ltr; flex: none; display: inline-flex; align-items: center; gap: 5px; font-size: 20px; line-height: 28px; font-weight: 700">' + riyal(14, 15) + pd.price + '</span></div><span style="font-size: 12px; line-height: 18px; color: #6B635D">' + (st === 'مباع' ? 'صافي أرباحك ' + net + ' ريال بعد عمولة المنصة (15%)' : 'سيصلك ' + net + ' ريال بعد عمولة المنصة (15%)') + '</span></div>' +
        (st === 'منشور' ? '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">' + statT('<path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12 10.02 8.42 12 8.42s3.58 1.6 3.58 3.58Z"></path><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z"></path>', d.views || 0, 'مشاهدة') + statT('<path d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"></path>', d.favs || 0, 'في المفضلة') + '</div>' : '') +
        '<section style="display: flex; flex-direction: column; gap: 8px"><h3 style="margin: 0; font-size: 15px; line-height: 22px; font-weight: 700">البيانات</h3><div style="padding: 4px 14px; border-radius: 20px; background: #F7F3F093; display: flex; flex-direction: column">' + rows.map(function (r) { return '<div style="display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; font-size: 14px; line-height: 20px"><span style="color: #6B635D">' + r[0] + '</span><b style="font-weight: 700; text-align: left">' + esc(String(r[1])) + '</b></div>'; }).join('') + '</div></section>' +
        (d.desc ? '<section style="display: flex; flex-direction: column; gap: 8px"><h3 style="margin: 0; font-size: 15px; line-height: 22px; font-weight: 700">الوصف</h3><p style="margin: 0; font-size: 14px; line-height: 23px; color: #4A4440">' + esc(d.desc) + '</p></section>' : '') +
        (st === 'منشور' ? pdNote('الإخفاء يوقف ظهور المنتج فقط، ولا يحذف بياناته. ويمكن إعادته دون مراجعة جديدة إذا لم يُعدَّل.')
          : st === 'مخفي' ? pdNote('إعادة الإظهار لا تحتاج مراجعة. وإذا عُدّل المنتج، يعود للمراجعة أولًا.')
          : st === 'مباع' ? pdNote('يبقى المنتج في سجلاتك، ولا تتغير بيانات الطلب المدفوع.') : '');
      var bar = st === 'منشور' ? '<button type="button" data-pd-act="hide" style="' + btnL + '">إخفاء المنتج</button><button type="button" data-pd-act="edit" style="' + btnD + '">تعديل</button>'
        : st === 'مخفي' ? '<button type="button" data-pd-act="edit" style="' + btnL + '">تعديل</button><button type="button" data-pd-act="show" style="' + btnD + '">إعادة إظهار المنتج</button>'
        : st === 'مرفوض' ? '<button type="button" data-pd-act="edit" style="' + btnD + '">تعديل وإعادة إرسال</button>'
        : st === 'مباع' && orderNo ? '<button type="button" data-pd-act="order" style="' + btnD + '">عرض الطلب</button>' : '';
      if (pdBar) { pdBar.innerHTML = bar; pdBar.style.display = bar ? 'flex' : 'none'; }
    };
    renderPD();
    screen.addEventListener('click', function (e) {
      var a = e.target.closest('[data-pd-act]'); if (!a) return;
      e.preventDefault(); e.stopPropagation();
      var act = a.getAttribute('data-pd-act');
      var save = function () { write('outlet-products', PDL); renderPD(); };
      if (act === 'hide') askSheet('إخفاء المنتج؟', 'لن يظهر للمشترين حتى تتم إعادته. لن تُحذف بياناته، والإعادة لا تحتاج مراجعة.', 'إخفاء', 'رجوع', function () { pd.st = 'مخفي'; pd.sub = 'غير ظاهر للمشترين، ويمكن إعادة إظهاره بدون مراجعة'; save(); toast('تم إخفاء المنتج'); });
      else if (act === 'show') { pd.st = 'منشور'; pd.sub = 'عاد ظاهرًا للمشترين'; save(); toast('عاد المنتج ظاهرًا للمشترين'); }
      else if (act === 'edit') { write('outlet-edit-id', pd.id); location.href = 'edit-product.html'; }
      else if (act === 'order') { write('outlet-inc-view', pd.order || (pd.sub.match(/OUT-\d+/) || [])[0]); location.href = 'incoming-order.html'; }
    }, true);
  }

  // ---------- U-09 seller public profile ----------
  var CATALOG = [
    ['assets/dress-pleated.jpg', 'فستان بليسيه طويل', 'فستان شيفون وردي بليسيه بأكمام طويلة', 210], ['assets/dress-terracotta.jpg', 'فستان تريكو طويل', 'فستان تريكو طويل', 175],
    ['assets/dress-pink.jpg', 'فستان شيفون وردي', 'فستان شيفون وردي', 160], ['assets/dress-green.jpg', 'فستان لف أخضر', 'فستان كتان أخضر هادئ بتصميم لف وأكمام قصيرة', 145],
    ['assets/sweater.jpg', 'كنزة صوف كريمي بألوان كحلي وأحمر', 'كنزة صوف ملونة', 98], ['assets/shirt.jpg', 'قميص قطن مريح', 'قميص قطن مريح', 76], ['assets/sneakers.jpg', 'حذاء أبيض', 'حذاء رياضي جلد أبيض', 150],
    ['assets/dress-ivory.jpg', 'فستان قطن أبيض', 'فستان قطن أبيض', 95], ['assets/trench.jpg', 'معطف ترنش كلاسيكي', 'معطف ترنش بيج', 520],
    ['assets/bag.jpg', 'شنطة جلد كلاسيكية', 'شنطة يد جلد بلون بني فاتح', 320], ['assets/dress-polka.jpg', 'فستان منقّط كحلي', 'فستان منقّط كحلي', 120], ['assets/shirt.jpg', 'قميص أزرق', 'قميص أزرق', 60],
    ['assets/pants.jpg', 'بنطلون بيج', 'بنطلون واسع بيج', 85], ['assets/dress.jpg', 'فستان أحمر', 'فستان أحمر', 120]
  ];
  var REV_POOL = [[5, 'نورة', '6 نوفمبر', 'القطعة مثل الصور تمامًا، والتغليف كان جميلًا.'], [5, 'ريم', '2 نوفمبر', 'تعامل محترم والتسليم كان في موعده.'], [4, 'جود', '28 أكتوبر', 'جميلة، لكن المقاس أصغر قليلًا من المكتوب.'], [5, 'هيا', '20 أكتوبر', ''], [5, 'سلمى', '14 أكتوبر', 'رد بسرعة في المحادثة والقطعة نضيفة.'], [4, 'دانة', '9 أكتوبر', 'الحالة جيدة جدًا، وفيها علامة بسيطة مذكورة في الوصف.']];

  if (page === 'seller.html') {
    var sName = read('outlet-seller-view', 'خزانة لمى');
    var sIdx = Math.max(0, sellers.map(function (x) { return x[0]; }).indexOf(sName)), sInfo = sellers[sIdx];
    var q4 = function (s) { return screen.querySelector(s); };
    var soldSrc = {}; allOrders().forEach(function (o) { if (o.seller && o.seller[0] === sName && o.status !== 'cancelled') o.items.forEach(function (it) { soldSrc[it.src] = 1; }); });
    var items = CATALOG.filter(function (c) { return sellers[hash(c[1]) % sellers.length][0] === sName && !soldSrc[c[0]]; });
    q4('[data-sp-initial]').textContent = sName.charAt(0);
    q4('[data-sp-name]').textContent = sName;
    q4('[data-sp-meta]').textContent = sInfo[2] + ' · على outlet من 2025';
    q4('[data-sp-avg]').textContent = sInfo[1];
    q4('[data-sp-count]').textContent = sInfo[3] + ' تقييم';
    q4('[data-sp-items]').textContent = items.length;
    var HEART = 'M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z';
    var body = q4('[data-sp-initial]').closest('.noscroll');
    var tabs = body.querySelector('[role="tablist"]');
    var panel = document.createElement('div'); tabs.after(panel);
    [].forEach.call(body.querySelectorAll('[data-sp-panel]'), function (p) { p.remove(); });
    var tab = 'items';
    // reviews: the buyer's own published rating for this seller first, then the rest
    var mine = [], rs = ratings();
    allOrders().forEach(function (o) { var r = rs[o.no + '|buy']; if (r && o.seller && o.seller[0] === sName) mine.push([r.stars, 'تقييمك', r.date.split(' · ')[0], r.text]); });
    var pool = REV_POOL.slice(hash(sName) % 2).slice(0, 4);
    var revs = mine.concat(pool);
    var render = function () {
      [].forEach.call(tabs.querySelectorAll('[data-sp-tab]'), function (b) {
        var on = b.getAttribute('data-sp-tab') === tab;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.style.background = on ? '#FFFFFF' : 'transparent'; b.style.boxShadow = on ? '0 2px 8px rgba(28,25,23,0.08)' : 'none'; b.style.fontWeight = on ? '700' : '500'; b.style.color = on ? '#1C1917' : '#6B635D';
      });
      tabs.querySelector('[data-sp-tab-n]').textContent = items.length;
      tabs.querySelector('[data-sp-tab-r]').textContent = sInfo[3] + mine.length;
      if (tab === 'items') {
        panel.innerHTML = items.length ? '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 10px">' + items.map(function (c) {
          var on = !!favs[c[0]], has = inCart(infoFor(c[0], c[1], c[2], c[3], sIdx));
          return '<div data-sp-card data-src="' + c[0] + '" style="display: flex; flex-direction: column; gap: 6px; min-width: 0; cursor: pointer"><span style="position: relative; aspect-ratio: 3 / 4; border-radius: 18px; background: #F7F3F0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 12px; box-sizing: border-box"><img src="' + c[0] + '" alt="' + esc(c[2]) + '" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply">' +
            '<button type="button" data-sp-fav aria-pressed="' + on + '" aria-label="' + (on ? 'إزالة من المفضلة' : 'إضافة للمفضلة') + '" style="position: absolute; top: 8px; left: 8px; width: 36px; height: 36px; border: 0; border-radius: 999px; background: #FFFFFF; color: ' + (on ? '#EA580C' : '#1C1917') + '; display: flex; align-items: center; justify-content: center; padding: 0"><svg width="18" height="18" viewBox="0 0 24 24" fill="' + (on ? '#EA580C' : 'none') + '" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="' + HEART + '"></path></svg></button></span>' +
            '<span style="font-size: 14px; line-height: 20px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">' + esc(c[1]) + '</span><div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><span style="direction: ltr; display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 700">' + riyal(10, 11) + c[3] + '</span>' +
            '<button type="button" data-sp-add aria-label="' + (has ? esc(c[1]) + ' في السلة' : 'إضافة ' + esc(c[1]) + ' للسلة') + '" style="width: 32px; height: 32px; flex: none; border: 0; border-radius: 999px; background: ' + (has ? '#1C1917' : '#EA580C') + '; color: #FFFFFF; display: flex; align-items: center; justify-content: center; padding: 0">' + (has ? ICON_TICK : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 18V6"></path></svg>') + '</button></div></div>';
        }).join('') + '</div>' : '<p style="margin: 30px 0; text-align: center; font-size: 14px; color: #6B635D">لا توجد قطع معروضة حاليًا.</p>';
      } else {
        // star counts that add up to the shown average (one 3-star, the rest 4s and 5s)
        var dc = sInfo[3], dP = Math.round(+sInfo[1] * dc), d4 = Math.max(0, 5 * dc - 2 - dP), all5 = +sInfo[1] >= 4.95;
        var dist = [5, 4, 3, 2, 1].map(function (n) { return [n, all5 ? (n === 5 ? dc : 0) : n === 5 ? dc - 1 - d4 : n === 4 ? d4 : n === 3 ? 1 : 0]; });
        panel.innerHTML = '<div style="display: flex; flex-direction: column; gap: 10px"><div style="padding: 14px; border-radius: 18px; background: #FFF4EC; display: flex; align-items: center; gap: 16px"><span style="display: flex; flex-direction: column; align-items: center; gap: 2px; flex: none"><span style="font-size: 34px; line-height: 40px; font-weight: 700">' + sInfo[1] + '</span><span style="display: flex; gap: 1px; direction: ltr">' + starsHTML(Math.round(+sInfo[1]), 12) + '</span><span style="font-size: 11px; color: #6B635D">' + (sInfo[3] + mine.length) + ' تقييم</span></span>' +
          '<span style="flex: 1; display: flex; flex-direction: column; gap: 4px; direction: ltr">' + dist.map(function (d) { return '<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6B635D"><span style="width: 10px; text-align: center">' + d[0] + '</span><span style="flex: 1; height: 6px; border-radius: 999px; background: #F7F3F0; overflow: hidden; display: flex"><span style="width: ' + Math.round(d[1] / sInfo[3] * 100) + '%; height: 100%; border-radius: 999px; background: #EA580C"></span></span><span style="width: 20px; text-align: left">' + d[1] + '</span></div>'; }).join('') + '</span></div>' +
          revs.map(function (r) { return '<div style="padding: 14px; border-radius: 18px; background: ' + (r[1] === 'تقييمك' ? '#FFF4EC' : '#F7F3F093') + '; display: flex; flex-direction: column; gap: 6px"><div style="display: flex; align-items: center; justify-content: space-between"><span style="display: flex; gap: 2px; direction: ltr">' + starsHTML(r[0], 15) + '</span><span style="font-size: 12px; color: #8E857F">' + esc(r[1]) + ' · ' + r[2] + '</span></div>' + (r[3] ? '<p style="margin: 0; font-size: 14px; line-height: 22px">' + esc(r[3]) + '</p>' : '') + '</div>'; }).join('') + '</div>';
      }
    };
    render();
    screen.addEventListener('click', function (e) {
      var t = e.target.closest('[data-sp-tab]');
      if (t) { e.preventDefault(); e.stopPropagation(); tab = t.getAttribute('data-sp-tab'); render(); return; }
      var card = e.target.closest('[data-sp-card]'); if (!card) return;
      e.preventDefault(); e.stopPropagation();
      var c = CATALOG.filter(function (x) { return x[0] === card.getAttribute('data-src'); })[0], info = infoFor(c[0], c[1], c[2], c[3], sIdx);
      if (e.target.closest('[data-sp-fav]')) { toggleFav(c[0], info); render(); return; }
      if (e.target.closest('[data-sp-add]')) { addToCart(info, null, render); return; }
      write('outlet-product', info); location.href = 'product.html';
    }, true);
  }

  // ---------- search ----------
  var extra = { 'فساتين': 'فستان', 'ملابس': 'قميص بلوزه بنطلون بنطال جاكيت معطف بالطو كنزه', 'شنط': 'شنطه حقيبه', 'أحذية': 'حذاء جزمه كوتشي سنيكرز' };
  function indexItems(list) {
    list.forEach(function (el) {
      var alts = [].map.call(el.querySelectorAll('img'), function (i) { return i.alt; }).join(' ');
      var txt = el.textContent + ' ' + alts + ' ' + (el.getAttribute('aria-label') || '');
      Object.keys(extra).forEach(function (k) { if (txt.indexOf(k) !== -1) txt += ' ' + extra[k]; });
      el._q = norm(txt);
    });
  }
  function hit(el, words) { return words.every(function (w) { return el._q.indexOf(w) !== -1; }); }
  var input = screen && screen.querySelector('input[type="search"]');

  if (page === 'index.html' && input) {
    // the home search opens the search screen
    var go = function (e) { e.preventDefault(); location.href = 'search.html'; };
    input.addEventListener('focus', go);
    input.addEventListener('pointerdown', go);
    input.readOnly = true;
    var homeFilter = input.closest('label') && input.closest('label').querySelector('button');
    if (homeFilter) homeFilter.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); location.href = 'search.html'; });
  } else if (page === 'search.html' && input) {
    var idle = screen.querySelector('[data-search-idle]'), results = screen.querySelector('[data-search-results]');
    var count = screen.querySelector('[data-search-count]');
    var items = [].slice.call(results.querySelectorAll('div[style*="border-radius: 18px"]')).filter(function (c) { return c.querySelector('button[aria-label$=" للسلة"]'); });
    indexItems(items);
    var empty = document.createElement('div'); empty.className = 'proto-empty proto-hide'; results.appendChild(empty);
    var run = function () {
      var q = norm(input.value), words = q ? q.split(' ') : [], n = 0;
      idle.style.display = q ? 'none' : 'flex';
      results.style.display = q ? 'flex' : 'none';
      items.forEach(function (c) { var ok = hit(c, words); c.classList.toggle('proto-hide', !ok); if (ok) n++; });
      var word = n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتين' : n <= 10 ? n + ' نتائج' : n + ' نتيجة';
      count.textContent = n ? word + ' لـ «' + input.value.trim() + '»' : '';
      empty.innerHTML = 'لا توجد نتائج لـ «' + esc(input.value.trim()) + '»<span>يمكن تجربة كلمة أخرى، مثل فستان أو شنطة أو جاكيت</span>';
      empty.classList.toggle('proto-hide', !q || n > 0);
    };
    input.addEventListener('input', run);
    input.addEventListener('search', run);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
    screen.addEventListener('click', function (e) {
      var q = e.target.closest('[data-q]'), f = e.target.closest('[data-act="forget"]'), c = e.target.closest('[data-act="clear-recent"]');
      if (f) { e.stopPropagation(); f.parentNode.remove(); return; }
      if (c) { e.stopPropagation(); var r = screen.querySelector('[data-recent]'); if (r) r.remove(); return; }
      if (q) { e.stopPropagation(); input.value = q.getAttribute('data-q'); run(); }
    }, true);
    setTimeout(function () { input.focus(); }, 50);
  } else if (input) {
    // other screens: filter what is on the screen as you type
    var list = [];
    document.querySelectorAll('button[aria-label$=" للسلة"]').forEach(function (b) { var card = b.closest('div[style*="border-radius: 18px"]'); if (card) list.push(card); });
    screen.querySelectorAll('a').forEach(function (a) { if (a.querySelector('img') && !a.closest('nav')) list.push(a); });
    indexItems(list);
    var scroller = list.length ? list[0].closest('[style*="overflow-y: auto"]') : null;
    var emptyMsg = document.createElement('div'); emptyMsg.className = 'proto-empty proto-hide';
    if (scroller) scroller.appendChild(emptyMsg);
    var runLocal = function () {
      var q = norm(input.value), words = q ? q.split(' ') : [], shown = 0;
      list.forEach(function (el) { var ok = hit(el, words) && !(el._filtered); el.classList.toggle('proto-hide', !ok); if (ok) shown++; });
      if (!q && gridCards.length) applyFilter(filterState);
      emptyMsg.innerHTML = 'لا توجد نتائج لـ «' + esc(input.value.trim()) + '»<span>يمكن تجربة كلمة أخرى، مثل فستان أو شنطة أو جاكيت</span>';
      emptyMsg.classList.toggle('proto-hide', !q || shown > 0);
      if (scroller) scroller.scrollTop = 0;
    };
    input.addEventListener('input', runLocal);
    input.addEventListener('search', runLocal);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
  }

  // favourites already saved
  document.querySelectorAll('button[aria-label="إضافة للمفضلة"]').forEach(function (b) {
    var img = b.parentNode.querySelector('img');
    if (img && favs[img.getAttribute('src')]) paintFav(b, true);
  });

  // ---------- clicks ----------
  document.addEventListener('click', function (e) {
    var t = e.target;
    var back = t.closest('a[aria-label="رجوع"]');
    if (back) {
      var fromHere = false;
      try { fromHere = document.referrer && new URL(document.referrer).origin === location.origin; } catch (err) {}
      if (fromHere && history.length > 1) { e.preventDefault(); history.back(); }
      return;
    }
    var fav = t.closest('button[aria-pressed], button[aria-label="إضافة للمفضلة"]');
    if (fav && !fav.closest('[role="dialog"]')) {
      var img = fav.parentNode.querySelector('img');
      var favCard = cardOf(fav);
      paintFav(fav, toggleFav(img ? img.getAttribute('src') : '', favCard ? productInfo(favCard) : null));
      return;
    }
    // "حسابي" in the bottom bar (pages built before the account screen still link to #profile)
    if (t.closest('nav a[href="#favorites"]')) { e.preventDefault(); location.href = 'favorites.html'; return; }
    if (t.closest('nav a[href="#sell"]')) { e.preventDefault(); location.href = 'add-product.html'; return; }
    if (t.closest('nav a[href="#messages"]')) { e.preventDefault(); location.href = 'messages.html'; return; }
    if (t.closest('nav a[href="#profile"]')) { e.preventDefault(); location.href = 'account.html'; return; }
    var cartLink = t.closest('a[aria-label^="سلة التسوق"]');
    if (cartLink) { e.preventDefault(); location.href = 'cart.html'; return; }
    var add = t.closest('button[aria-label^="أضف "][aria-label$=" للسلة"], button[aria-label^="إضافة "][aria-label$=" للسلة"]');
    if (add) { var c = cardOf(add); if (c) openQuickAdd(c, add); return; }
    var opensFilter = t.closest('button[aria-label^="الفلاتر"], button[aria-label^="ترتيب حسب"]');
    if (opensFilter && document.getElementById('tpl-filter')) { openFilter(opensFilter); return; }
    var card = t.closest('div[style*="border-radius: 18px"]');
    if (card && card.querySelector('button[aria-label$=" للسلة"]') && !t.closest('button')) { openProduct(card); return; }
    var chip = t.closest('nav[aria-label="التصنيفات"] a');
    if (chip && chip.getAttribute('href').charAt(0) === '#') { e.preventDefault(); var ch = chip.getAttribute('href'); location.href = ch === '#all' ? 'search.html' : 'category.html?cat=' + encodeURIComponent(CAT_HASH[ch] || 'فساتين'); return; }
    var catLink = t.closest('a[href="#clothes"], a[href="#bags"], a[href="#shoes"], a[href="#dresses"]');
    if (catLink) { e.preventDefault(); location.href = 'category.html?cat=' + encodeURIComponent(CAT_HASH[catLink.getAttribute('href')]); return; }
    var dead = t.closest('a[href^="#"], button');
    if (dead && !dead.closest('label')) { e.preventDefault(); toast('هذه الشاشة ما زالت قيد التصميم'); }
  });
})();
