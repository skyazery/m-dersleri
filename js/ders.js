/* Müqəddəs Kitab dərsləri — ümumi səhifə skripti.
   Səhifə window.DD = {dil:'az'|'ko', sinif:'usaq'|'genc', ses:'fayl'|'cihaz', lugat:{...}, test:[...], oyun:{...}} təyin edir. */
(function () {
  'use strict';
  var D = window.DD || {};
  var TT = {
    az: {
      ok: 'Düzdür!', no: 'Yenə fikirləş. Mətni bir daha oxu.', orig: 'Orijinal: ', other: 'Koreyaca: ',
      gameOk: 'Düzdür! Növbəti boşluq.', gameDone: 'Afərin! İndi ayəni üç dəfə ucadan oxu.', gameNo: function (n) { return 'Yenə fikirləş. Bu, ' + n + '-ci boşluqdur.'; },
      noAudio: 'Səs faylı açılmadı. İnterneti yoxla.', fsLabel: 'Yazı ölçüsü'
    },
    ko: {
      ok: '맞아요!', no: '다시 생각해 보세요. 본문을 한 번 더 읽어 봐요.', orig: '원어: ', other: '아제르바이잔어: ',
      gameOk: '맞아요! 다음 빈칸이에요.', gameDone: '잘했어요! 소리 내어 세 번 읽어 보세요.', gameNo: function (n) { return '다시 생각해 봐요. ' + n + '번째 빈칸이에요.'; },
      noAudio: '이 브라우저에서는 읽어 주기가 안 돼요. 휴대폰 크롬이나 사파리에서 열어 보세요.', fsLabel: '글자 크기'
    },
    ru: {
      ok: 'Правильно!', no: 'Подумай ещё. Прочитай текст ещё раз.', orig: 'Оригинал: ', other: 'По-азербайджански: ',
      gameOk: 'Правильно! Следующий пропуск.', gameDone: 'Молодец! Теперь прочитай стих вслух три раза.', gameNo: function (n) { return 'Подумай ещё. Это ' + n + '-й пропуск.'; },
      noAudio: 'Не удалось открыть аудио. Проверь интернет.', fsLabel: 'Размер текста'
    },
    en: {
      ok: 'Correct!', no: 'Think again. Read the passage once more.', orig: 'Original: ', other: 'Azerbaijani: ',
      gameOk: 'Correct! Next blank.', gameDone: 'Well done! Now read the verse aloud three times.', gameNo: function (n) { return 'Think again. This is blank number ' + n + '.'; },
      noAudio: 'The audio could not be opened. Check your internet.', fsLabel: 'Text size'
    }
  };
  var T = TT[D.dil] || TT.az;
  function $(id) { return document.getElementById(id); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- səs ---------- */
  var note = $('ttsNote');
  var P = { rate: 1, el: null, queue: [], cur: null, follow: false };
  var useFiles = D.ses === 'fayl';
  var synth = !useFiles && ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
  var voice = null;
  function pickVoice() {
    try { var vs = speechSynthesis.getVoices(); voice = vs.find(function (v) { return /^ko/i.test(v.lang) && /google|yuna|sun-?hi|heami|natural/i.test(v.name); }) || vs.find(function (v) { return /^ko/i.test(v.lang); }) || null; } catch (e) {}
  }
  if (synth) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }
  function clearMarks() { document.querySelectorAll('.reading').forEach(function (e) { e.classList.remove('reading'); }); }
  function stop() {
    P.queue = [];
    if (P.el) { try { P.el.pause(); } catch (e) {} P.el = null; }
    if (synth) { try { speechSynthesis.cancel(); } catch (e) {} }
    clearMarks();
  }
  function mark(el) {
    if (!el) return;
    el.classList.add('reading');
    if (P.follow) { var m = matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({ block: 'center', behavior: m ? 'auto' : 'smooth' }); }
  }
  function next() {
    if (P.cur) P.cur.classList.remove('reading');
    var it = P.queue.shift();
    if (!it) { P.el = null; P.cur = null; return; }
    P.cur = it.el || null; mark(it.el);
    if (useFiles) {
      var a = new Audio('audio/' + it.k + '.mp3'); a.playbackRate = P.rate; a.preservesPitch = true; P.el = a;
      a.onended = next; a.onerror = function () { if (note) note.textContent = T.noAudio; next(); };
      a.play().catch(function () { next(); });
    } else if (synth) {
      var u = new SpeechSynthesisUtterance(it.t); u.lang = 'ko-KR'; if (voice) u.voice = voice; u.rate = P.rate * .95;
      u.onend = u.onerror = next; speechSynthesis.speak(u);
    }
  }
  function play(els, follow) {
    stop(); P.follow = !!follow;
    P.queue = els.filter(Boolean).map(function (e) { return { k: e.dataset.a, el: e, t: (e.dataset.say || e.textContent).replace(/\s+/g, ' ').trim() }; })
      .filter(function (x) { return useFiles ? x.k : x.t; });
    next();
  }
  function playKey(k, text) { stop(); P.queue = [{ k: k, t: text }]; next(); }
  if (!useFiles && !synth) {
    document.querySelectorAll('.say,#playAll,#sayVerse,#sayPrayer,#sSay').forEach(function (b) { b.hidden = true; });
    if (note) note.textContent = T.noAudio;
  }
  function sceneEls(sc) { return [].slice.call(sc.querySelectorAll('.txt h3, .txt > p, .deep p')); }
  document.querySelectorAll('.scene .say').forEach(function (b) { b.onclick = function () { play(sceneEls(b.closest('.scene'))); }; });
  if ($('playAll')) $('playAll').onclick = function () {
    var all = []; document.querySelectorAll('.scene').forEach(function (s) { all = all.concat(sceneEls(s)); });
    all.push($('verseText')); play(all, true);
  };
  if ($('stopAll')) $('stopAll').onclick = stop;
  var slow = $('slow');
  if (slow) slow.onclick = function () { var on = slow.getAttribute('aria-pressed') !== 'true'; slow.setAttribute('aria-pressed', on); P.rate = on ? .85 : 1; if (P.el) P.el.playbackRate = P.rate; };
  if ($('sayVerse')) $('sayVerse').onclick = function () { play([$('verseText')]); };
  if ($('sayPrayer')) $('sayPrayer').onclick = function () { play([$('prayerText')]); };

  /* ---------- lüğət ---------- */
  var W = D.lugat || {}, keys = Object.keys(W);
  var bg = $('sheetBg'), sh = $('sheet'), lastBtn = null, cur = null;
  function openW(k, btn) {
    var d = W[k]; if (!d) return; lastBtn = btn; cur = k;
    $('sIcon').textContent = d.i || '📖'; $('sTitle').textContent = k;
    $('sAz').textContent = (d.o ? T.orig + d.o + ' · ' : '') + T.other + d.x;
    $('sMean').textContent = d.m; $('sEx').textContent = d.e;
    bg.hidden = false; sh.hidden = false; $('sClose').focus();
  }
  function closeW() { stop(); bg.hidden = true; sh.hidden = true; if (lastBtn) lastBtn.focus(); }
  if (sh) {
    bg.onclick = closeW; $('sClose').onclick = closeW;
    $('sSay').onclick = function () { var d = W[cur]; if (d) playKey('d' + keys.indexOf(cur), cur + '. ' + d.m + ' ' + d.e); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sh.hidden) closeW(); });
  }
  document.querySelectorAll('.w').forEach(function (b) { b.onclick = function () { openW(b.dataset.w, b); }; });
  var dict = $('dict');
  if (dict) keys.forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button';
    b.innerHTML = '<span class="ic"></span><span><b></b>' + (D.sinif === 'genc' ? '<small></small>' : '') + '</span>';
    b.querySelector('.ic').textContent = W[k].i || '📖'; b.querySelector('b').textContent = k;
    var sm = b.querySelector('small'); if (sm) sm.textContent = W[k].s || '';
    b.onclick = function () { openW(k, b); }; dict.appendChild(b);
  });

  /* ---------- test ---------- */
  var qz = $('quiz');
  if (qz) (D.test || []).forEach(function (it, qi) {
    var d = document.createElement('div'); d.className = 'q';
    d.innerHTML = '<p></p><div class="opts"></div><div class="fb" aria-live="polite"></div>';
    d.querySelector('p').textContent = (qi + 1) + '. ' + it.q;
    var op = d.querySelector('.opts'), fb = d.querySelector('.fb');
    it.o.forEach(function (t, oi) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t;
      b.onclick = function () { if (oi === it.a) { b.className = 'ok'; fb.textContent = it.f || T.ok; } else { b.className = 'no'; fb.textContent = T.no; } };
      op.appendChild(b);
    });
    qz.appendChild(d);
  });

  /* ---------- əzbər ayə oyunu (uşaqlar) ---------- */
  var G = D.oyun, chips = $('chips');
  if (G && chips) {
    var pos = 0, opts = G.sozler.concat([G.yalan]);
    opts.sort(function (a, b) { return a.localeCompare(b); });
    opts.forEach(function (w) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = w; b.setAttribute('aria-pressed', 'false');
      b.onclick = function () {
        var fb = $('chipFb'); if (pos >= G.sozler.length) return;
        if (w === G.sozler[pos]) {
          b.setAttribute('aria-pressed', 'true');
          document.querySelectorAll('#blankLine u')[pos].textContent = w; pos++;
          fb.textContent = pos === G.sozler.length ? T.gameDone : T.gameOk;
        } else fb.textContent = T.gameNo(pos + 1);
      };
      chips.appendChild(b);
    });
  }

  /* ---------- yazı ölçüsü (yeniyetmələr) ---------- */
  if (D.sinif === 'genc') {
    var fsBox = document.createElement('span'); fsBox.className = 'fs-float'; fsBox.setAttribute('role', 'group'); fsBox.setAttribute('aria-label', T.fsLabel);
    fsBox.innerHTML = '<button class="pill ghost" type="button" aria-label="A−">A−</button><span id="fsVal" aria-live="polite">100%</span><button class="pill ghost" type="button" aria-label="A+">A+</button>';
    document.body.appendChild(fsBox);
    var steps = [0.9, 1, 1.15, 1.3, 1.45], fi = 1, fkey = 'fs-' + D.dil + '-genc';
    var v = parseInt(lsGet(fkey), 10); if (v >= 0 && v < steps.length) fi = v;
    var dn = fsBox.children[0], val = fsBox.children[1], up = fsBox.children[2];
    var apply = function () { document.documentElement.style.setProperty('--z', steps[fi]); val.textContent = Math.round(steps[fi] * 100) + '%'; dn.disabled = fi === 0; up.disabled = fi === steps.length - 1; lsSet(fkey, fi); };
    dn.onclick = function () { if (fi > 0) { fi--; apply(); } }; up.onclick = function () { if (fi < steps.length - 1) { fi++; apply(); } };
    apply();
  }
})();
