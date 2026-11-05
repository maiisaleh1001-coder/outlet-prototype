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