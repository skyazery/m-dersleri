/* Dərs izləmə: şagirdin nəticələrini müəllimin Google cədvəlinə göndərir.
   Səhifə əvvəlcə window.DERS = {sinif:'usaq'|'genc', ders:'matta-01'} təyin edir. */
(function () {
  'use strict';
  // Google Apps Script veb tətbiqinin ünvanı (müəllim quraşdırandan sonra yazılır)
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzpx5LBqs88_WiBL27NbdiaM0xDYjVHWJBDA12EW1wVlyllqQCzJqW4nwD1JpMe25Q/exec';

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
      sagird: getName(),
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
    var batch = q.slice(0, 25).map(function (e) { var c = {}; for (var k in e) c[k] = e[k]; if (!c.sagird) c.sagird = name; return c; });
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
    '.dz-ok{font-size:14px;color:var(--teal,#2C8A84);min-height:1.3em}' +
    '.dz-names{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}' +
    '.dz-name{font:inherit;font-size:18px;font-weight:700;padding:12px 8px;border-radius:14px;border:2px solid var(--line,#D9E0EC);background:var(--sky,var(--bg,#EEF2F8));color:var(--ink,#1C2A48);cursor:pointer}' +
    '.dz-name:hover,.dz-name:focus-visible{border-color:var(--teal,#2C8A84);outline:none}' +
    '.dz-keys{display:flex;flex-wrap:wrap;gap:6px}' +
    '.dz-key{font:inherit;font-size:20px;font-weight:700;min-width:44px;min-height:44px;border-radius:10px;border:1px solid var(--line,#D9E0EC);background:var(--sky,var(--bg,#EEF2F8));color:var(--ink,#1C2A48);cursor:pointer}' +
    '.dz-build{display:flex;flex-direction:column;gap:10px}' +
    '.dz-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}' +
    '.dz-chip{font:inherit;font-size:16px;font-weight:700;text-align:left;padding:10px 12px;border-radius:14px;border:2px solid var(--line,#D9E0EC);background:var(--paper,#fff);color:var(--ink,#1C2A48);cursor:pointer}' +
    '.dz-chip[aria-pressed="true"]{border-color:var(--teal,#2C8A84);background:var(--teal-soft,#DCEFEC)}' +
    '.dz-sent{margin:0;font-size:18px;font-weight:700;background:var(--gold-soft,#FBEFD5);border-radius:12px;padding:10px 14px}';
  document.head.appendChild(css);

  var anchor = document.querySelector('.audio') || document.querySelector('.wrap > header');
  var box = document.createElement('div');
  if (anchor) anchor.insertAdjacentElement('afterend', box);

  /* Ad müəllimin göndərdiyi şəxsi linkdən gəlir: ...?ad=Aysel  (ad yazmaq xanası yoxdur) */
  var KIDS = CFG.sinif === 'usaq';
  var LT = {
    az: { hi: 'Salam', wrong: 'Səhv: ', allok: 'Hamısı düz', vDone: '✓ Əzbərlədim', vBtn: 'Ayəni əzbərlədim', vMsg: 'Afərin! Müəllimin görəcək.', pick: 'Toxun və seç. Bir neçəsini seçə bilərsən.', send: 'Müəllimə göndər', needPick: 'Əvvəlcə bir yer seç.', needText: 'Əvvəlcə bir neçə söz yaz.', saved: 'Yadda saxlanıldı. İnternet olanda göndəriləcək.', sent: 'Göndərildi ✓', and: 'və', me: 'mən', done: /Afərin/ },
    ru: { hi: 'Привет', wrong: 'Ошибки: ', allok: 'Всё верно', vDone: '✓ Выучил(а)', vBtn: 'Я выучил(а) стих', vMsg: 'Молодец! Учитель увидит.', pick: 'Нажимай и выбирай. Можно выбрать несколько.', send: 'Отправить учителю', needPick: 'Сначала выбери что-нибудь.', needText: 'Сначала напиши несколько слов.', saved: 'Сохранено. Отправится, когда будет интернет.', sent: 'Отправлено ✓', and: 'и', me: 'я', done: /Молодец/ },
    en: { hi: 'Hi', wrong: 'Wrong: ', allok: 'All correct', vDone: '✓ Memorized', vBtn: 'I memorized the verse', vMsg: 'Well done! Your teacher will see it.', pick: 'Tap to choose. You can choose more than one.', send: 'Send to teacher', needPick: 'Choose something first.', needText: 'Write a few words first.', saved: 'Saved. It will be sent when you are online.', sent: 'Sent ✓', and: 'and', me: 'I', done: /Well done/ }
  };
  var L = LT[CFG.dil] || LT.az;
  var onNameChange = [];
  (function () {
    var m = /[?&]ad=([^&#]*)/.exec(location.search);
    if (!m) return;
    var v = '';
    try { v = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { v = ''; }
    v = v.replace(/\s+/g, ' ').trim().slice(0, 30);
    if (v) lsSet(K_NAME, v);
  })();
  function renderName() {
    var name = getName();
    box.innerHTML = '';
    if (!name) { box.className = ''; return; }
    box.className = 'dz-hi';
    var s = document.createElement('span');
    s.innerHTML = '👋 ' + L.hi + ', <b></b>!';
    s.querySelector('b').textContent = name;
    box.appendChild(s);
  }
  renderName();

  /* ---------- davamiyyət: hər şagird üçün gündə bir dəfə ---------- */
  function sk(base) { return base + '|' + getName(); }
  function markOpen() {
    if (!getName()) return;
    var d = new Date();
    var key = sk('mders-gun-' + CFG.ders + '-' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate());
    if (!lsGet(key)) { lsSet(key, '1'); send('open', '✓'); }
  }
  markOpen();
  onNameChange.push(markOpen);

  /* ---------- irəliləyiş: oxunan bölmələr ---------- */
  var parts = [].slice.call(document.querySelectorAll('.scene'));
  ['verseText', 'quiz'].forEach(function (id) { var el = document.getElementById(id); if (el) parts.push(el); });
  var seen = new Set(), ptimer = null;
  function pkey() { return sk('mders-proq-' + CFG.ders); }
  function pbest() { return parseInt(lsGet(pkey()) || '0', 10); }
  function checkProgress() {
    if (!getName() || !parts.length) return;
    var pct = Math.round(seen.size / parts.length * 100);
    if (pct > pbest()) {
      lsSet(pkey(), String(pct));
      clearTimeout(ptimer);
      ptimer = setTimeout(function () { send('progress', pct + '%'); }, pct === 100 ? 0 : 4000);
    }
  }
  onNameChange.push(checkProgress);
  if ('IntersectionObserver' in window && parts.length) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { seen.add(en.target); io.unobserve(en.target); } });
      checkProgress();
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
        send('quiz', right + '/' + qs.length, wrong.length ? L.wrong + wrong.join(', ') : L.allok);
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
    function vkey() { return sk('mders-ayə-' + CFG.ders); }
    var vmsg = document.createElement('span'); vmsg.className = 'dz-ok';
    function vstate() {
      var done = !!lsGet(vkey());
      vb.textContent = done ? L.vDone : L.vBtn;
      vb.disabled = done;
    }
    vb.onclick = function () {
      
      lsSet(vkey(), '1'); send('verse', '✓'); vstate(); vmsg.textContent = L.vMsg;
    };
    vstate();
    onNameChange.push(vstate);
    vrow.appendChild(vb); vrow.appendChild(vmsg);
    verseBox.appendChild(vrow);
  }
  var chipFb = document.getElementById('chipFb');
  if (chipFb && 'MutationObserver' in window) {
    var gameSent = false;
    new MutationObserver(function () {
      if (!gameSent && L.done.test(chipFb.textContent)) { gameSent = true; send('verse-oyun', '✓'); }
    }).observe(chipFb, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- yazılı fəaliyyət ---------- */
  var ta = document.getElementById('mine');
  if (ta && KIDS) {
    /* Uşaqlar üçün yazmaq əvəzinə düymələrlə cümlə qururuq */
    /* Dərsə görə seçimlər: window.DERS.secim = {basliq, izah, cumle:'… {ad} … {x}', adsiz, bos, bag, secimler:[[emoji, söz]]} */
    var SC = CFG.secim || null;
    var PLACES = SC ? SC.secimler : [['🏠', 'evdə'], ['🏫', 'məktəbdə'], ['🚶', 'yolda'], ['🛏️', 'yatağımda'],
      ['👨‍👩‍👧', 'ailəmlə'], ['🤝', 'dostlarımla'], ['⛪', 'Cəmiyyətdə'],
      ['😨', 'qorxanda'], ['😢', 'kədərlənəndə'], ['😊', 'sevinəndə']];
    var picked = [];
    var lbl = document.querySelector('label[for="mine"]');
    if (lbl) lbl.textContent = (SC && SC.izah) || L.pick;
    var card = ta.closest('.card'); var h = card && card.querySelector('h3');
    if (h) h.textContent = (SC && SC.basliq) || 'Allah səninlə haradadır?';
    ta.hidden = true;
    var wrapB = document.createElement('div'); wrapB.className = 'dz-build';
    var grid2 = document.createElement('div'); grid2.className = 'dz-chips';
    var sent = document.createElement('p'); sent.className = 'dz-sent'; sent.setAttribute('aria-live', 'polite');
    function particle(w) { var m = w.match(/[aıouəeiöüAIOUƏEİÖÜ](?=[^aıouəeiöüAIOUƏEİÖÜ]*$)/); return m && /[aıouAIOU]/.test(m[0]) ? 'da' : 'də'; }
    function joinAz(list) {
      if (list.length < 2) return list.join('');
      return list.slice(0, -1).join(', ') + ' ' + (SC.bag || L.and) + ' ' + list[list.length - 1];
    }
    function sentence() {
      var n = getName();
      if (SC) {
        var s2 = SC.cumle.replace('{ad}', n || SC.adsiz || L.me).replace('{x}', picked.length ? joinAz(picked) : (SC.bos || '…'));
        return s2.charAt(0).toLocaleUpperCase(CFG.dil || 'az') + s2.slice(1);
      }
      var s = n ? 'Allah ' + n + ' ilə birlikdədir.' : 'Allah mənimlə birlikdədir.';
      if (picked.length) {
        var parts2 = picked.map(function (w) { return w + ' ' + particle(w); });
        var t = parts2.join(', ');
        s += ' ' + t.charAt(0).toLocaleUpperCase(CFG.dil || 'az') + t.slice(1) + '.';
      }
      return s;
    }
    function upd() { sent.textContent = sentence(); ta.value = picked.length ? sentence() : ''; }
    PLACES.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'dz-chip'; b.setAttribute('aria-pressed', 'false');
      b.textContent = p[0] + ' ' + p[1].charAt(0).toLocaleUpperCase(CFG.dil || 'az') + p[1].slice(1);
      b.onclick = function () {
        var i = picked.indexOf(p[1]);
        if (i < 0) picked.push(p[1]); else picked.splice(i, 1);
        b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
        upd();
      };
      grid2.appendChild(b);
    });
    wrapB.appendChild(grid2); wrapB.appendChild(sent);
    ta.insertAdjacentElement('afterend', wrapB);
    onNameChange.push(upd);
    upd();
  }
  if (ta) {
    var arow = document.createElement('div');
    arow.className = 'dz-row'; arow.style.alignItems = 'center';
    var ab = document.createElement('button');
    ab.className = 'dz-btn'; ab.type = 'button'; ab.textContent = L.send;
    var amsg = document.createElement('span'); amsg.className = 'dz-ok'; amsg.setAttribute('aria-live', 'polite');
    ab.onclick = function () {
      var t = ta.value.trim();
      if (!t) { amsg.textContent = KIDS ? L.needPick : L.needText; if (!KIDS) ta.focus(); return; }
      send('activity', 'yazı', t);
      if (!navigator.onLine || !ENDPOINT) amsg.textContent = L.saved;
      else amsg.textContent = L.sent;
    };
    arow.appendChild(ab); arow.appendChild(amsg);
    (ta.hidden && ta.nextElementSibling && ta.nextElementSibling.classList.contains('dz-build') ? ta.nextElementSibling : ta).insertAdjacentElement('afterend', arow);
  }

  flush();
})();
