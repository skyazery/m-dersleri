/* Dərs izləmə: şagirdin nəticələrini müəllimin Google cədvəlinə göndərir.
   Səhifə əvvəlcə window.DERS = {sinif:'usaq'|'genc', ders:'matta-01'} təyin edir. */
(function () {
  'use strict';
  // Google Apps Script veb tətbiqinin ünvanı (müəllim quraşdırandan sonra yazılır)
  var ENDPOINT = '';

  var CFG = window.DERS || {};
  if (!CFG.sinif || !CFG.ders) return;

  var K_NAME = 'mders-ad', K_Q = 'mders-novbe', K_DEV = 'mders-cihaz';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function deviceId() {
    var d = lsGet(K_DEV);
    if (!d) { d = Math.random().toString(36).slice(2, 8); lsSet(K_DEV, d); }
    return d;
  }
  function getName() { return (lsGet(K_NAME) || '').trim(); }
  function readQ() { try { return JSON.parse(lsGet(K_Q) || '[]'); } catch (e) { return []; } }
  function writeQ(q) { lsSet(K_Q, JSON.stringify(q.slice(-300))); }

  function send(nov, netice, etrafli) {
    var q = readQ();
    q.push({
      sinif: CFG.sinif, ders: CFG.ders, nov: nov,
      netice: netice == null ? '' : String(netice).slice(0, 40),
      etrafli: etrafli == null ? '' : String(etrafli).slice(0, 1500),
      vaxt: new Date().toISOString(), cihaz: deviceId()
    });
    writeQ(q);
    flush();
  }

  var busy = false;
  function flush() {
    if (busy || !ENDPOINT || !getName() || !navigator.onLine) return;
    var q = readQ();
    if (!q.length) return;
    var name = getName();
    var batch = q.slice(0, 25).map(function (e) { var c = {}; for (var k in e) c[k] = e[k]; c.sagird = name; return c; });
    busy = true;
    fetch(ENDPOINT, {
      method: 'POST', mode: 'no-cors', keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ events: batch })
    }).then(function () {
      writeQ(readQ().slice(batch.length));
      busy = false;
      if (readQ().length) setTimeout(flush, 400);
    }).catch(function () { busy = false; });
  }
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  /* ---------- görünüş ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.dz-card{background:var(--paper,#fff);border:2px solid var(--teal,#2C8A84);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}' +
    '.dz-card h3{margin:0;font-size:18px}' +
    '.dz-card p{margin:0;font-size:14px;color:var(--soft,#5A6A88)}' +
    '.dz-row{display:flex;gap:8px;flex-wrap:wrap}' +
    '.dz-row input{flex:1 1 160px;min-width:0;font:inherit;font-size:17px;padding:9px 12px;border-radius:10px;border:1px solid var(--line,#D9E0EC);background:var(--paper,#fff);color:inherit}' +
    '.dz-btn{font:inherit;font-weight:700;border:0;border-radius:10px;padding:9px 16px;background:var(--teal,#2C8A84);color:#fff;cursor:pointer}' +
    '.dz-btn.ghost{background:transparent;color:var(--teal,#2C8A84);border:1px solid var(--teal,#2C8A84)}' +
    '.dz-btn:disabled{opacity:.5;cursor:default}' +
    '.dz-hi{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:14px;color:var(--soft,#5A6A88)}' +
    '.dz-hi b{color:var(--ink,#1C2A48)}' +
    '.dz-link{font:inherit;font-size:14px;background:none;border:0;padding:0;color:var(--teal,#2C8A84);text-decoration:underline;cursor:pointer}' +
    '.dz-ok{font-size:14px;color:var(--teal,#2C8A84);min-height:1.3em}';
  document.head.appendChild(css);

  var anchor = document.querySelector('.audio') || document.querySelector('.wrap > header');
  var box = document.createElement('div');
  if (anchor) anchor.insertAdjacentElement('afterend', box);

  function renderName() {
    var name = getName();
    box.innerHTML = '';
    if (name) {
      box.className = 'dz-hi';
      var s = document.createElement('span');
      s.innerHTML = '👋 Salam, <b></b>! Nəticələrin müəllimə gedir.';
      s.querySelector('b').textContent = name;
      var ch = document.createElement('button');
      ch.className = 'dz-link'; ch.type = 'button'; ch.textContent = 'Adı dəyiş';
      ch.onclick = function () { lsSet(K_NAME, ''); renderName(); };
      box.appendChild(s); box.appendChild(ch);
      return;
    }
    box.className = 'dz-card';
    box.innerHTML =
      '<h3>Adın nədir?</h3>' +
      '<p>Adını yaz ki, müəllimin sənin nəticələrini görsün. Yalnız adın kifayətdir, soyad lazım deyil.</p>' +
      '<form class="dz-row"><input id="dzName" maxlength="30" autocomplete="given-name" placeholder="Məsələn: Aysel" aria-label="Adın"><button class="dz-btn" type="submit">Yadda saxla</button></form>';
    box.querySelector('form').onsubmit = function (e) {
      e.preventDefault();
      var v = box.querySelector('#dzName').value.replace(/\s+/g, ' ').trim();
      if (!v) { box.querySelector('#dzName').focus(); return; }
      v = v.charAt(0).toLocaleUpperCase('az') + v.slice(1);
      lsSet(K_NAME, v);
      renderName();
      flush();
    };
  }
  renderName();

  /* ---------- davamiyyət: gündə bir dəfə ---------- */
  var today = new Date();
  var dkey = 'mders-gun-' + CFG.ders + '-' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  if (!lsGet(dkey)) { lsSet(dkey, '1'); send('open', '✓'); }

  /* ---------- irəliləyiş: oxunan bölmələr ---------- */
  var parts = [].slice.call(document.querySelectorAll('.scene'));
  ['verseText', 'quiz'].forEach(function (id) { var el = document.getElementById(id); if (el) parts.push(el); });
  var seen = new Set(), pkey = 'mders-proq-' + CFG.ders, best = parseInt(lsGet(pkey) || '0', 10), ptimer = null;
  if ('IntersectionObserver' in window && parts.length) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { seen.add(en.target); io.unobserve(en.target); } });
      var pct = Math.round(seen.size / parts.length * 100);
      if (pct > best) {
        best = pct; lsSet(pkey, String(pct));
        clearTimeout(ptimer);
        ptimer = setTimeout(function () { send('progress', best + '%'); }, pct === 100 ? 0 : 4000);
      }
    }, { threshold: 0.4 });
    parts.forEach(function (p) { io.observe(p); });
  }

  /* ---------- test: ilk cavablar ---------- */
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var first = {}, sent = false;
    quiz.addEventListener('click', function (e) {
      var b = e.target.closest('.opts button'); if (!b) return;
      var q = b.closest('.q'); var qs = [].slice.call(quiz.querySelectorAll('.q'));
      var i = qs.indexOf(q); if (i < 0 || i in first) return;
      first[i] = b.classList.contains('ok');
      var n = Object.keys(first).length;
      if (n === qs.length && !sent) {
        sent = true;
        var right = 0, wrong = [];
        for (var k = 0; k < qs.length; k++) { if (first[k]) right++; else wrong.push(k + 1); }
        send('quiz', right + '/' + qs.length, wrong.length ? 'Səhv: ' + wrong.join(', ') : 'Hamısı düz');
      }
    });
  }

  /* ---------- əzbər ayə ---------- */
  var verse = document.getElementById('verseText');
  var verseBox = verse && (verse.closest('section') || verse.parentNode);
  if (verseBox) {
    var vrow = document.createElement('div');
    vrow.className = 'dz-row'; vrow.style.alignItems = 'center';
    var vb = document.createElement('button');
    vb.className = 'dz-btn'; vb.type = 'button';
    var vkey = 'mders-ayə-' + CFG.ders;
    var vmsg = document.createElement('span'); vmsg.className = 'dz-ok';
    function vstate() {
      var done = !!lsGet(vkey);
      vb.textContent = done ? '✓ Əzbərlədim' : 'Ayəni əzbərlədim';
      vb.disabled = done;
    }
    vb.onclick = function () { lsSet(vkey, '1'); send('verse', '✓'); vstate(); vmsg.textContent = 'Afərin! Müəllimin görəcək.'; };
    vstate();
    vrow.appendChild(vb); vrow.appendChild(vmsg);
    verseBox.appendChild(vrow);
  }
  var chipFb = document.getElementById('chipFb');
  if (chipFb && 'MutationObserver' in window) {
    var gameSent = false;
    new MutationObserver(function () {
      if (!gameSent && /Afərin/.test(chipFb.textContent)) { gameSent = true; send('verse-oyun', '✓'); }
    }).observe(chipFb, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- yazılı fəaliyyət ---------- */
  var ta = document.getElementById('mine');
  if (ta) {
    var arow = document.createElement('div');
    arow.className = 'dz-row'; arow.style.alignItems = 'center';
    var ab = document.createElement('button');
    ab.className = 'dz-btn'; ab.type = 'button'; ab.textContent = 'Müəllimə göndər';
    var amsg = document.createElement('span'); amsg.className = 'dz-ok'; amsg.setAttribute('aria-live', 'polite');
    ab.onclick = function () {
      var t = ta.value.trim();
      if (!t) { amsg.textContent = 'Əvvəlcə bir neçə söz yaz.'; ta.focus(); return; }
      send('activity', 'yazı', t);
      if (!getName()) amsg.textContent = 'Yadda saxlanıldı. Yuxarıda adını yaz, sonra müəllimə gedəcək.';
      else if (!navigator.onLine || !ENDPOINT) amsg.textContent = 'Yadda saxlanıldı. İnternet olanda göndəriləcək.';
      else amsg.textContent = 'Göndərildi ✓';
    };
    arow.appendChild(ab); arow.appendChild(amsg);
    ta.insertAdjacentElement('afterend', arow);
  }

  flush();
})();
