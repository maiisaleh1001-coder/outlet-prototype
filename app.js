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
      { src: 'assets/dress-green.jpg', alt: 'فستان كتان أخضر هادي بتصميم لف وأكمام قصيرة', name: 'فستان لف أخضر', size: 'S', cond: 'ممتازة', priceNum: 145, oldNum: 220, seller: SELLERS[0] },
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
  function addToCart(p, then) {
    var done = function () { saveCart(); paintCart(true); if (then) then(); else toast('اتضافت للسلة'); };
    if (cart.some(function (c) { return c.src === p.src && c.name === p.name; })) { toast('القطعة دي في السلة بالفعل'); if (then) then(); return; }
    if (cart.length && cart[0].seller[0] !== p.seller[0]) {
      var html = '<section role="dialog" aria-modal="true" aria-label="تبدأ سلة جديدة؟" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
        '<div style="padding: 4px 18px 8px; display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 700">تبدأ سلة جديدة؟</h2>' +
        '<p style="margin: 0; font-size: 14px; line-height: 22px; color: #6B635D">السلة فيها قطع من «' + cart[0].seller[0] + '». كل طلب بيكون من بائع واحد، فإضافة القطعة دي هتبدأ سلة جديدة من «' + p.seller[0] + '».</p></div>' +
        '<div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 28px">' +
        '<button type="button" data-act="replace" style="height: 52px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700">ابدأ سلة جديدة</button>' +
        '<button type="button" data-act="close" style="height: 52px; border: 0; border-radius: 999px; background: #F7F3F0; color: #1C1917; font-family: inherit; font-size: 15px; font-weight: 700">خليني في السلة الحالية</button></div></section>';
      setTimeout(function () {
        mountSheet(html, function (e, b) {
          if (b && b.getAttribute('data-act') === 'replace') { cart = [cartItem(p)]; closeSheet(); setTimeout(done, 200); }
        }, null);
      }, sheetOpen ? 340 : 0);
      return;
    }
    cart.push(cartItem(p)); done();
  }
  function paintFav(btn, on) {
    var svg = btn.querySelector('svg');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'شيل من المفضلة' : 'أضف للمفضلة');
    if (svg) { svg.setAttribute('fill', on ? '#EA580C' : 'none'); svg.setAttribute('stroke', on ? '#EA580C' : 'currentColor'); }
  }
  function toggleFav(key) {
    var on = !favs[key];
    if (on) favs[key] = 1; else delete favs[key];
    write('outlet-favs', favs);
    toast(on ? 'اتضافت للمفضلة' : 'اتشالت من المفضلة');
    return on;
  }
  paintCart(false);

  // ---------- product data (read from a card) ----------
  var sellers = [['خزانة لمى', '4.9', 'الرياض', 38], ['دولاب سارة', '4.8', 'جدة', 21], ['ركن هند', '5.0', 'الدمام', 54], ['ستايل نوف', '4.7', 'الخبر', 12]];
  var colors = [['أخضر', '#8FA68A'], ['أسود', '#1C1917'], ['أحمر', '#C0392B'], ['أبيض', '#F4F1EA'], ['بيج', '#D8C3A5'], ['كحلي', '#233A5E'], ['أزرق', '#8DB3D9'],
                ['وردي', '#D9A3A8'], ['تراكوتا', '#B5583A'], ['الجمل', '#C19A6B'], ['جملي', '#C19A6B'], ['بني', '#A0703F'], ['كريمي', '#EFE6D2']];
  function sizeOf(name) { return /حذاء/.test(name) ? '40' : /شنط/.test(name) ? 'مقاس واحد' : ['S', 'M', 'L', 'XL', 'M', 'XS', 'L'][hash(name) % 7]; }
  function cardOf(el) { var b = el.querySelector ? el : null; return el.closest('div[style*="border-radius: 18px"]'); }
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
    var cond = ['ممتازة', 'كالجديدة', 'ممتازة', 'جيدة جدًا'][h % 4];
    var size = sizeOf(name);
    return {
      src: img ? img.getAttribute('src') : '', alt: alt, name: name,
      price: priceEl ? priceEl.innerHTML : '', priceNum: priceEl ? parseInt(priceEl.textContent.replace(/\D/g, ''), 10) : 0,
      old: oldEl ? oldEl.innerHTML : '', oldNum: oldEl ? parseInt(oldEl.textContent.replace(/\D/g, ''), 10) : 0, off: badge ? badge.textContent.trim() : '',
      size: size, cond: cond, color: col[0], colorDot: col[1], seller: sellers[h % sellers.length],
      desc: alt + '. قطعة مستعملة بحالة ' + cond + '، نظيفة ومن غير عيوب ظاهرة، والمقاس ' + size + '. الصور للقطعة نفسها، وبتتشحن متطبّقة ومغلّفة بعناية.'
    };
  }
  function openProduct(card) { write('outlet-product', productInfo(card)); location.href = 'product.html'; }

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
            '<a href="#seller" data-act="soon" style="display: flex; align-items: center; gap: 12px; padding: 12px 0; text-decoration: none; color: #1C1917">' +
              '<span aria-hidden="true" style="width: 40px; height: 40px; flex: none; border-radius: 999px; background: #FDEBDD; color: #9A3412; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center">' + p.seller[0].split(' ').pop().charAt(0) + '</span>' +
              '<span style="flex: 1; display: flex; flex-direction: column"><span style="font-size: 14px; line-height: 20px; font-weight: 700">' + p.seller[0] + '</span><span style="font-size: 12px; line-height: 16px; color: #6B635D">★ ' + p.seller[1] + ' · ' + p.seller[2] + ' · ' + p.seller[3] + ' قطعة مباعة</span></span>' +
              '<span style="color: #6B635D; display: flex">' + ICON_CHEV + '</span></a>' +
            '<p style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 18px; color: #6B635D">' + ICON_SHIELD + 'قطعة واحدة متاحة، والمبلغ محفوظ حتى استلامها</p>' +
          '</div>' +
        '</div>' +
        '<div style="flex: none; display: flex; align-items: center; gap: 12px; padding: 12px 18px 28px; background: #FFFFFF">' +
          '<button type="button" data-act="fav" aria-pressed="' + on + '" aria-label="' + (on ? 'شيل من المفضلة' : 'أضف للمفضلة') + '" style="width: 52px; height: 52px; flex: none; border: 1px solid #EFE6DE; border-radius: 999px; background: #FFFFFF; color: #1C1917; display: flex; align-items: center; justify-content: center; padding: 0">' + ICON_HEART + '</button>' +
          '<button type="button" data-act="add" style="flex: 1; height: 52px; border: 0; border-radius: 999px; background: #1C1917; color: #FFFFFF; font-family: inherit; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px">' + ICON_BAG + 'أضف للسلة</button>' +
        '</div>' +
      '</section>';
    var wrap = mountSheet(html, function (e, b) {
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'soon') { e.preventDefault(); toast('الشاشة دي لسه بتتصمم'); }
      else if (act === 'details') { e.preventDefault(); openProduct(card); }
      else if (act === 'fav') {
        var now = toggleFav(p.src);
        paintFav(b, now);
        var cardFav = card.querySelector('button[aria-label="أضف للمفضلة"], button[aria-pressed]');
        if (cardFav) paintFav(cardFav, now);
      } else if (act === 'add') { closeSheet(); setTimeout(function () { addToCart(p); }, 340); }
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

  // ---------- filter + sort (dresses page) ----------
  var filterState = read('outlet-filter', { sort: 'new', sizes: [], min: 0, max: 600 });
  var grid = document.querySelector('.screen div[style*="grid-template-columns: repeat(2"]');
  var gridCards = grid && page === 'category.html' ? [].slice.call(grid.children) : [];
  gridCards.forEach(function (c, i) { c._order = i; c._info = productInfo(c); });
  function matches(c, st) {
    var info = c._info;
    return info.priceNum >= st.min && (st.max >= 600 || info.priceNum <= st.max) && (!st.sizes.length || st.sizes.indexOf(info.size) !== -1);
  }
  function applyFilter(st) {
    var shown = 0;
    gridCards.slice().sort(function (a, b) {
      if (st.sort === 'asc') return a._info.priceNum - b._info.priceNum;
      if (st.sort === 'desc') return b._info.priceNum - a._info.priceNum;
      return a._order - b._order;
    }).forEach(function (c) { grid.appendChild(c); var ok = matches(c, st); c.classList.toggle('proto-hide', !ok); if (ok) shown++; });
    var active = (st.sizes.length ? 1 : 0) + (st.min > 0 || st.max < 600 ? 1 : 0);
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
    if (!empty && grid) { empty = document.createElement('div'); empty.className = 'proto-empty proto-empty-filter'; empty.innerHTML = 'مفيش قطع بالفلاتر دي<span>جرّب مقاس تاني أو وسّع نطاق السعر</span>'; grid.parentNode.appendChild(empty); }
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
      else if (act === 'clear') { st = { sort: 'new', sizes: [], min: 0, max: 600 }; }
      else if (act === 'apply') { filterState = st; write('outlet-filter', st); applyFilter(st); closeSheet(); grid.closest('[style*="overflow-y: auto"]').scrollTop = 0; return; }
      paint(w);
    }, opener);
    if (!wrap) return;
    function chipStyle(btn, on) {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.style.background = on ? '#1C1917' : '#F7F3F0'; btn.style.color = on ? '#FFFFFF' : '#1C1917'; btn.style.fontWeight = on ? '700' : '500';
    }
    function paint(w) {
      w.querySelectorAll('[data-sort]').forEach(function (b) { chipStyle(b, b.getAttribute('data-sort') === st.sort); });
      w.querySelectorAll('[data-size]').forEach(function (b) { chipStyle(b, st.sizes.indexOf(b.getAttribute('data-size')) !== -1); });
      var lo = w.querySelector('[data-price="min"]'), hi = w.querySelector('[data-price="max"]');
      lo.value = st.min; hi.value = st.max;
      var fill = w.querySelector('[data-price-fill]');
      fill.style.right = (st.min / 6) + '%'; fill.style.left = (100 - st.max / 6) + '%';
      var label = w.querySelector('[data-price-label]'), svg = label.querySelector('svg');
      label.textContent = ''; label.appendChild(svg);
      label.appendChild(document.createTextNode(st.min === 0 && st.max >= 600 ? 'كل الأسعار' : st.min + ' – ' + (st.max >= 600 ? '600+' : st.max)));
      var n = gridCards.filter(function (c) { return matches(c, st); }).length;
      w.querySelector('[data-act="apply"]').textContent = n ? 'اعرض ' + n + (n === 1 ? ' قطعة' : n === 2 ? ' قطعتين' : ' قطع') : 'مفيش نتايج';
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
    var PAGE_DEFAULT = { src: 'assets/dress-green.jpg', alt: 'فستان كتان أخضر هادي بتصميم لف وأكمام قصيرة', name: 'فستان لف أخضر', size: 'S', cond: 'ممتازة', priceNum: 145, oldNum: 220, seller: SELLERS[0] };
    var set = function (k, fn) { document.querySelectorAll('[data-p="' + k + '"]').forEach(fn); };
    if (p) {
      set('img', function (el) { el.src = p.src; el.alt = p.alt; });
      set('name', function (el) { el.textContent = p.name; });
      set('price', function (el) { el.innerHTML = p.price.replace('width="12" height="13"', 'width="18" height="20"'); });
      set('old', function (el) { if (p.old) el.innerHTML = p.old.replace('width="9" height="10"', 'width="11" height="12"'); else el.remove(); });
      set('off', function (el) { if (p.off) el.textContent = p.off; else el.remove(); });
      set('size', function (el) { el.textContent = p.size; });
      set('cond', function (el) { el.textContent = p.cond; });
      set('color', function (el) { el.textContent = p.color; });
      set('color-dot', function (el) { el.style.background = p.colorDot; if (p.color === 'أبيض' || p.color === 'كريمي') el.style.boxShadow = 'inset 0 0 0 1px #E7DED6'; });
      set('seller', function (el) { el.textContent = p.seller[0]; });
      set('seller-initial', function (el) { el.textContent = p.seller[0].split(' ').pop().charAt(0); });
      set('rating', function (el) { el.textContent = p.seller[1]; });
      set('sold', function (el) { el.textContent = p.seller[3] + ' قطعة مباعة'; });
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
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pager], [data-act], [data-p="fav"], [data-p="seller-link"]');
      if (!b) return;
      e.stopPropagation(); e.preventDefault();
      if (b.hasAttribute('data-pager')) { flipTo(b.getAttribute('data-pager') === 'next' ? 1 : -1); }
      else if (b.getAttribute('data-p') === 'fav') { paintFav(b, toggleFav(key)); }
      else if (b.getAttribute('data-p') === 'seller-link') { toast('صفحة البائع لسه بتتصمم'); }
      else if (b.getAttribute('data-act') === 'more') {
        var d = document.querySelector('[data-p="desc"]'), open = d.style.webkitLineClamp === 'unset';
        d.style.webkitLineClamp = open ? '3' : 'unset'; d.style.display = open ? '-webkit-box' : 'block';
        b.textContent = open ? 'اقرأ المزيد' : 'اقرأ أقل';
      }
      else if (b.getAttribute('data-act') === 'add') { addToCart(p || PAGE_DEFAULT); }
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
        var rm = row.querySelector('[data-act="remove"]'); rm.setAttribute('aria-label', 'احذف ' + it.name + ' من السلة'); rm.setAttribute('data-i', i);
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
        cart.splice(parseInt(b.getAttribute('data-i'), 10), 1); saveCart(); paintCart(false); renderCart(); toast('اتشالت من السلة');
      } else if (b.getAttribute('data-act') === 'checkout') { location.href = 'checkout.html'; }
      else { toast('صفحة البائع لسه بتتصمم'); }
    }, true);
  }

  // ---------- order maths shared by checkout, payment and the result ----------
  // saved addresses; delivery fee is set by region (null = courier does not cover that region)
  var ADDRS = [
    { label: 'البيت', line: 'حي النرجس، شارع الأمير سعود بن عبدالله، الرياض', fee: 25 },
    { label: 'الشغل', line: 'حي الروضة، طريق الأمير سلطان، جدة', fee: 30 },
    { label: 'بيت العيلة', line: 'حي الخالدية، القريات', fee: null }
  ];
  var SERVICE_FEE = 9;
  function orderSums() {
    var c = read('outlet-checkout', { addr: 0, method: 'courier' }), a = ADDRS[c.addr] || ADDRS[0];
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
      cart.forEach(function (it) { var t = thumbTpl.cloneNode(true), im = t.querySelector('img'); im.src = it.src; im.alt = it.name; thumbsBox.appendChild(t); });
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
          '<span aria-hidden="true" style="width: 22px; height: 22px; flex: none; box-sizing: border-box; border-radius: 999px; border: 2px solid ' + (on ? '#C2410C' : '#C9BFB7') + '; display: flex; align-items: center; justify-content: center">' + (on ? '<span style="width: 10px; height: 10px; border-radius: 999px; background: #C2410C"></span>' : '') + '</span>' +
          '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; line-height: 22px; font-weight: 700">' + a.label + '</span><span style="font-size: 12px; line-height: 18px; color: #6B635D">' + a.line + '</span>' +
          (a.fee === null ? '<span style="font-size: 11px; line-height: 16px; color: #9A3412">التوصيل بالمندوب مش متاح هنا، والتسليم المباشر متاح</span>' : '') + '</span></button>';
      }).join('');
      var html = '<section role="dialog" aria-modal="true" aria-label="اختيار عنوان الاستلام" style="box-sizing: border-box; background: #FFFFFF; border-radius: 28px 28px 0 0; box-shadow: 0 -12px 40px rgba(28,25,23,0.18); display: flex; flex-direction: column; color: #1C1917">' + GRAB +
        '<div style="padding: 0 18px 28px; display: flex; flex-direction: column; gap: 10px"><h2 style="margin: 0 0 4px; font-size: 20px; line-height: 28px; font-weight: 700">عنوان الاستلام</h2>' + rows +
        '<button type="button" data-act="new-address" style="height: 48px; border: 0; border-radius: 999px; background: transparent; font-family: inherit; font-size: 14px; font-weight: 700; color: #C2410C; display: flex; align-items: center; justify-content: center; gap: 6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 18V6"></path></svg>إضافة عنوان جديد</button></div></section>';
      mountSheet(html, function (e) {
        var r = e.target.closest('[data-addr]'), n = e.target.closest('[data-act="new-address"]');
        if (r) { co.addr = parseInt(r.getAttribute('data-addr'), 10); renderCheckout(); closeSheet(); }
        else if (n) { toast('شاشة إضافة عنوان لسه بتتصمم'); }
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
      if (payMethod !== 'apple' && digits.length < 12) { toast('اكتب رقم البطاقة الأول'); num.focus(); return; }
      processing(function () {
        // demo rule for showing the failure screen: a card number ending in 0002 is declined
        if (payMethod !== 'apple' && /0002$/.test(digits)) { location.href = 'payment-failed.html'; return; }
        var s = orderSums();
        var order = { no: 'OUT-' + (24000 + Math.floor(Math.random() * 900)), items: cart.slice(), seller: cart[0].seller, method: s.method, addr: s.addr.label, total: s.total, pay: PAY_LABEL[payMethod] };
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
        ? 'البائع بيجهز القطع، والمندوب هيستلمها من عنده ويوصلها خلال 2–4 أيام عمل. هنبعت إشعار مع كل تحديث.'
        : 'محادثة الطلب مع البائع اتفتحت دلوقتي، اتفقوا فيها على مكان ووقت التسليم. وبعد الاستلام أكّد من صفحة الطلب.';
    }
    paintCart(false);
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act="track"], [data-act="invoice"]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      toast(b.getAttribute('data-act') === 'track' ? 'صفحة متابعة الطلب لسه بتتصمم' : 'الفاتورة الضريبية لسه بتتصمم');
    }, true);
  }

  // ---------- search ----------
  var extra = { 'فساتين': 'فستان', 'قمصان': 'قميص بلوزه', 'بناطيل': 'بنطلون بنطال', 'شنط': 'شنطه حقيبه', 'أحذية': 'حذاء جزمه كوتشي سنيكرز', 'جواكيت': 'جاكيت معطف بالطو' };
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
      empty.innerHTML = 'مفيش نتايج لـ «' + esc(input.value.trim()) + '»<span>جرّب كلمة تانية، زي فستان أو شنطة أو جاكيت</span>';
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
      emptyMsg.innerHTML = 'مفيش نتايج لـ «' + esc(input.value.trim()) + '»<span>جرّب كلمة تانية، زي فستان أو شنطة أو جاكيت</span>';
      emptyMsg.classList.toggle('proto-hide', !q || shown > 0);
      if (scroller) scroller.scrollTop = 0;
    };
    input.addEventListener('input', runLocal);
    input.addEventListener('search', runLocal);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
  }

  // favourites already saved
  document.querySelectorAll('button[aria-label="أضف للمفضلة"]').forEach(function (b) {
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
    var fav = t.closest('button[aria-pressed], button[aria-label="أضف للمفضلة"]');
    if (fav && !fav.closest('[role="dialog"]')) {
      var img = fav.parentNode.querySelector('img');
      paintFav(fav, toggleFav(img ? img.getAttribute('src') : ''));
      return;
    }
    var cartLink = t.closest('a[aria-label^="سلة التسوق"]');
    if (cartLink) { e.preventDefault(); location.href = 'cart.html'; return; }
    var add = t.closest('button[aria-label^="أضف "][aria-label$=" للسلة"]');
    if (add) { var c = cardOf(add); if (c) openQuickAdd(c, add); return; }
    var opensFilter = t.closest('button[aria-label^="الفلاتر"], button[aria-label^="ترتيب حسب"]');
    if (opensFilter && document.getElementById('tpl-filter')) { openFilter(opensFilter); return; }
    var card = t.closest('div[style*="border-radius: 18px"]');
    if (card && card.querySelector('button[aria-label$=" للسلة"]') && !t.closest('button')) { openProduct(card); return; }
    var chip = t.closest('nav[aria-label="التصنيفات"] a');
    if (chip && chip.getAttribute('href').charAt(0) === '#') { e.preventDefault(); toast('القسم ده لسه بيتصمم، جرّب فساتين'); return; }
    var dead = t.closest('a[href^="#"], button');
    if (dead && !dead.closest('label')) { e.preventDefault(); toast('الشاشة دي لسه بتتصمم'); }
  });
})();
