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