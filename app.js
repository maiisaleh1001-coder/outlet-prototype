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