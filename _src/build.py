#!/usr/bin/env python3
"""Müqəddəs Kitab dərsləri — dərs səhifələrini _src/dersler/*.json fayllarından yaradır.

  python3 _src/build.py            # bütün dərslər + siyahı + müəllim səhifələri
  python3 _src/build.py 2 3        # yalnız 2 və 3-cü dərs (siyahılar yenə yenilənir)

Hər dərs üçün 4 səhifə: matta-NN-az, matta-NN-az-genc, matta-NN-ko-usaq, matta-NN-ko-genc
və müəllim səhifəsi muellim/matta-NN/. Azərbaycan dilindəki səhifələr üçün səs mətnləri
_src/ses/matta-NN-az(-genc).json faylına yazılır (ses.py ilə mp3 yaradılır).
"""
import json, os, re, sys, html, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_src')
E = lambda s: html.escape(str(s), quote=True)


def az_ord(n):
    last = {1: 'ci', 2: 'ci', 3: 'cü', 4: 'cü', 5: 'ci', 6: 'cı', 7: 'ci', 8: 'ci', 9: 'cu'}
    tens = {10: 'cu', 20: 'ci', 30: 'cu', 40: 'cı', 50: 'ci', 60: 'cı', 70: 'ci', 80: 'ci', 90: 'cı'}
    return f"{n}-{last[n % 10] if n % 10 else tens[n % 100]}"


LUG = None      # hazırkı səhifənin lüğəti (yoxlama üçün)
WARN = []


def wbtn(show, key):
    if LUG is not None and key not in LUG:
        WARN.append(key); return show
    return f'<button class="w" type="button" data-w="{key}">{show}</button>'


def inline(t):
    """[[söz]] → lüğət düyməsi, [[göstər|açar]] → başqa açar, {{Yar. 12:3}} → istinad, **x** → qalın."""
    t = E(t)
    t = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', lambda m: wbtn(m.group(1), m.group(2)), t)
    t = re.sub(r'\[\[([^\]]+)\]\]', lambda m: wbtn(m.group(1), m.group(1)), t)
    t = re.sub(r'\{\{([^}]+)\}\}', r'<span class="ref">\1</span>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return t


def plain(t):
    t = re.sub(r'\[\[([^\]|]+)\|[^\]]+\]\]', r'\1', t)
    t = re.sub(r'\[\[([^\]]+)\]\]', r'\1', t)
    t = re.sub(r'\s*\{\{[^}]+\}\}', '', t)
    t = t.replace('**', '')
    return re.sub(r'\s+', ' ', t).strip()


def img_src(name):
    return ('../img/' + name) if '/' in name else ('../img/nt/' + name)


UI = {
    'az': {
        'usaq_eyebrow': lambda n: f'Uşaqlar üçün Müqəddəs Kitab dərsi · Matta, {az_ord(n)} dərs',
        'genc_eyebrow': lambda n: f'Yeniyetmələr üçün Müqəddəs Kitab dərsi · Matta, {az_ord(n)} dərs',
        'mins': lambda m: f'təxminən {m} dəqiqə', 'book': 'Matta',
        'back': 'Bütün dərslər', 'playAll_u': 'Əvvəldən dinlə', 'playAll_g': 'Hamısını dinlə', 'stop': 'Dayandır', 'slow': 'Yavaş', 'say': '🔊 Dinlə',
        'note_u': 'Sarı sözlərə toxun, mənası çıxacaq. 🔊 düyməsi Azərbaycan dilində oxuyur.',
        'note_g': 'Nöqtəli xətt altındakı sözlərə toxun: mənası, orijinal dildə forması və koreyacası çıxacaq.',
        'goal': 'Bu gün nə öyrənəcəyik?', 'scene': 'Səhnə', 'verse_u': 'Bu həftənin əzbər ayəsi', 'verse_g': 'Bu həftənin əzbər ayəsi',
        'simple': 'uşaqlar üçün sadə dildə', 'simple_g': 'sadə dildə', 'blankHint': 'Boş yerlər üçün sözləri ardıcıl seç.',
        'dict_u': ('Söz lüğəti', 'Toxun, mənasına bax'), 'dict_g': ('Söz lüğəti və orijinal dil', 'Toxun, ətraflı bax'),
        'quiz': ('Yoxlama sualları', lambda n: f'{n} sual'), 'think': 'Gəlin düşünək', 'share': 'Paylaşma sualları',
        'draw': 'Rəsm çək', 'drawFrame': 'Kağıza çək və<br>şəklini müəllimə göndər',
        'pray_u': 'Birlikdə dua edək', 'pray_g': 'Bağlanış duası', 'prayBtn': '🔊 Duanı dinlə', 'close': 'Bağla',
        'aims': ('Fon', 'Əsas fikir', 'Tətbiq'),
    },
    'ko': {
        'usaq_eyebrow': lambda n: f'어린이 성경 공부 · 마태복음 제{n}과',
        'genc_eyebrow': lambda n: f'청소년 성경 공부 · 마태복음 제{n}과',
        'mins': lambda m: f'약 {m}분', 'book': '마태복음',
        'back': '목차로', 'playAll_u': '처음부터 듣기', 'playAll_g': '전체 듣기', 'stop': '멈추기', 'slow': '천천히', 'say': '🔊 듣기',
        'note_u': '노란 낱말을 누르면 뜻이 나와요. 🔊 버튼을 누르면 읽어 줘요.',
        'note_g': '점선 낱말을 누르면 뜻·원어·아제르바이잔어가 나와요.',
        'goal': '오늘 배울 것', 'scene': '장면', 'verse_u': '이번 주 외울 말씀', 'verse_g': '이번 주 외울 말씀',
        'simple': '어린이가 이해하기 쉬운 말로 옮김', 'simple_g': '쉬운 말로 옮김', 'blankHint': '빠진 낱말을 순서대로 눌러 보세요.',
        'dict_u': ('낱말 사전', '눌러서 뜻과 그림 보기'), 'dict_g': ('낱말·원어 사전', '눌러서 자세히'),
        'quiz': ('확인 퀴즈', lambda n: f'{n}문제'), 'think': '함께 생각해요', 'share': '나눔 질문',
        'draw': '그려 보아요', 'drawFrame': '종이에 그리고<br>사진을 찍어 선생님께 보내요',
        'pray_u': '함께 기도해요', 'pray_g': '마침 기도', 'prayBtn': '🔊 기도 듣기', 'close': '닫기',
        'aims': ('배경', '핵심', '적용'),
    },
}


class Audio:
    def __init__(self):
        self.items = {}
        self.n = 0

    def key(self, text, k=None):
        if k is None:
            k = f'y{self.n}'; self.n += 1
        self.items[k] = plain(text)
        return k


def scene_imgs(L):
    return L['img']


def hero_html(L, lang, alt):
    i = L.get('hero', len(L['img']) - 1)
    return f'<img src="{img_src(L["img"][i])}" width="1280" height="757" alt="{E(alt)}">'


def head(title, css, lang):
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)}</title>
<link rel="stylesheet" href="../fonts/pretendardvariable-dynamic-subset.css">
<link rel="stylesheet" href="../css/{css}">
</head>
<body>
<div class="wrap">
'''


def sheet(ui):
    return f'''<div class="sheet-bg" id="sheetBg" hidden></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sTitle" hidden>
  <div class="row"><div class="ic" id="sIcon"></div><div><h3 id="sTitle"></h3><div class="az" id="sAz"></div></div></div>
  <p id="sMean"></p>
  <p class="ex" id="sEx"></p>
  <div class="btns"><button class="pill ghost" id="sSay" type="button">{ui["say"]}</button><button class="pill" id="sClose" type="button">{ui["close"]}</button></div>
</div>
'''


def audio_bar(ui, lvl):
    return f'''  <div class="audio" role="group">
    <button class="pill" id="playAll" type="button"><svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg>{ui["playAll_" + lvl[0]]}</button>
    <button class="pill ghost" id="stopAll" type="button">{ui["stop"]}</button>
    <button class="pill ghost" id="slow" type="button" aria-pressed="false">{ui["slow"]}</button>
    <p class="note" id="ttsNote">{ui["note_" + lvl[0]]}</p>
  </div>
'''


def a_attr(au, text, k=None):
    if au is None:
        return ''
    return f' data-a="{au.key(text, k)}"'


def foot_js(dd, lang, tracker, n):
    s = f'<script>window.DD={json.dumps(dd, ensure_ascii=False)};</script>\n<script src="../js/ders.js" defer></script>\n'
    if tracker:
        s += f'<script>window.DERS={json.dumps(tracker, ensure_ascii=False)};</script>\n<script src="../js/ders-izle.js" defer></script>\n'
    return s + '</body>\n</html>\n'


def build_usaq(L, lang):
    global LUG
    n = L['no']; ui = UI[lang]; d = L[lang]['usaq']; LUG = d['lugat']
    au = Audio() if lang == 'az' else None
    title = (f'Matta {n}-ci dərs uşaqlar' if False else (f'Matta · {az_ord(n)} dərs · uşaqlar' if lang == 'az' else f'마태복음 {n}과 어린이'))
    o = [head(title, 'usaq.css', lang)]
    o.append(f'  <a href="../" style="font-family:inherit;font-size:14px;color:inherit;opacity:.7;text-decoration:none">← {ui["back"]}</a>\n')
    o.append(f'''  <header class="hero">
    {hero_html(L, lang, d.get('hero_alt', d['basliq']))}
    <div class="hero-text">
      <span class="eyebrow">{E(ui["usaq_eyebrow"](n))}</span>
      <h1>{E(d["basliq"])}</h1>
      <p class="ref">{ui["book"]} {E(L["ref"])} · {ui["mins"](L.get("deq", {}).get("usaq", 40))}</p>
    </div>
  </header>
''')
    o.append(audio_bar(ui, 'usaq'))
    o.append(f'  <section class="goal">\n    <h3>{ui["goal"]}</h3>\n    <ul>\n' + ''.join(f'      <li>{inline(g)}</li>\n' for g in d['hedef']) + '    </ul>\n  </section>\n')
    for i, sc in enumerate(d['sehneler']):
        o.append(f'''  <article class="scene">
    <img src="{img_src(L["img"][sc.get("r", i)])}" width="1280" height="757" loading="lazy" alt="{E(sc.get("alt", sc["b"]))}">
    <div class="txt">
      <div class="top"><span class="num">{ui["scene"]} {i + 1} · {E(sc["ayə"])}</span><button class="pill ghost say" type="button">{ui["say"]}</button></div>
      <h3{a_attr(au, sc["b"])}>{E(sc["b"])}</h3>
''')
        for p in sc['p']:
            o.append(f'      <p{a_attr(au, p)}>{inline(p)}</p>\n')
        o.append('    </div>\n  </article>\n')
    v = d['aye']
    o.append(f'''  <section class="verse">
    <div class="top" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="eyebrow" style="color:var(--teal)">{ui["verse_u"]}</span><button class="pill ghost" id="sayVerse" type="button">{ui["say"]}</button></div>
    <p class="big" id="verseText"{a_attr(au, v["metn"], "verse")}>{E(v["metn"])}</p>
    <p class="src">{ui["book"]} {E(v["ref"])} · {ui["simple"]}</p>
    <p class="blank-line" id="blankLine">{E(v["bos"]).replace("___", "<u> </u>")}</p>
    <div class="chips" id="chips"></div>
    <p class="fb" id="chipFb" aria-live="polite">{ui["blankHint"]}</p>
  </section>
''')
    o.append(f'  <div class="head"><h2>{ui["dict_u"][0]}</h2><span>{ui["dict_u"][1]}</span></div>\n  <div class="dict" id="dict"></div>\n')
    o.append(f'  <div class="head"><h2>{ui["quiz"][0]}</h2><span>{ui["quiz"][1](len(d["test"]))}</span></div>\n  <div class="quiz" id="quiz"></div>\n')
    o.append(f'  <section class="card">\n    <h2 style="font-size:24px">{ui["think"]}</h2>\n    <ol>\n' + ''.join(f'      <li>{inline(q)}</li>\n' for q in d['dusun']) + '    </ol>\n  </section>\n')
    f = d['fealiyyet']
    o.append(f'''  <div class="acts">
    <section class="card">
      <h3>{ui["draw"]}</h3>
      <p>{inline(f["ciz"])}</p>
      <div class="frame">{ui["drawFrame"]}</div>
    </section>
    <section class="card">
      <h3>{E(f["b"])}</h3>
      <label for="mine">{inline(f["p"])}</label>
      <textarea id="mine" placeholder="{E(f.get("ph", ""))}"></textarea>
    </section>
  </div>
''')
    o.append(f'''  <section class="prayer">
    <h2>{ui["pray_u"]}</h2>
    <p id="prayerText"{a_attr(au, d["dua"], "prayer")}>{E(d["dua"])}</p>
    <button class="pill" id="sayPrayer" type="button" style="align-self:flex-start">{ui["prayBtn"]}</button>
  </section>
</div>
''')
    o.append(sheet(ui))
    lug = d['lugat']
    if au is not None:
        for j, (w, x) in enumerate(lug.items()):
            au.key(f'{w}. {x["m"]} {x["e"]}', f'd{j}')
    dd = {'dil': lang, 'sinif': 'usaq', 'ses': 'fayl' if lang == 'az' else 'cihaz', 'lugat': lug, 'test': d['test'],
          'oyun': {'sozler': v['sozler'], 'yalan': v['yalan']}}
    tracker = None
    if lang == 'az':
        tracker = {'sinif': 'usaq', 'ders': f'matta-{n:02d}'}
        if f.get('secim'):
            tracker['secim'] = f['secim']
    o.append(foot_js(dd, lang, tracker, n))
    return ''.join(o), au


def build_genc(L, lang):
    global LUG
    n = L['no']; ui = UI[lang]; d = L[lang]['genc']; LUG = d['lugat']
    au = Audio() if lang == 'az' else None
    title = f'Matta · {az_ord(n)} dərs · yeniyetmələr' if lang == 'az' else f'마태복음 {n}과 청소년'
    o = [head(title, 'genc.css', lang)]
    o.append(f'  <a href="../" style="font-family:inherit;font-size:14px;color:inherit;opacity:.7;text-decoration:none">← {ui["back"]}</a>\n')
    o.append(f'''  <header class="hero">
    {hero_html(L, lang, d.get('hero_alt', d['basliq']))}
    <div class="hero-text">
      <span class="label">{E(ui["genc_eyebrow"](n))}</span>
      <h1>{E(d["basliq"])}</h1>
      <p class="sub">{ui["book"]} {E(L["ref"])} · {ui["mins"](L.get("deq", {}).get("genc", 50))}</p>
      <p class="hero-q">{inline(d["giris"])}</p>
    </div>
  </header>
''')
    o.append(audio_bar(ui, 'genc'))
    o.append('  <section class="aims">\n' + ''.join(f'    <div><b>{E(b)}</b><p>{inline(p)}</p></div>\n' for b, p in zip(ui['aims'], d['meqsed'])) + '  </section>\n')
    for i, sc in enumerate(d['sehneler']):
        o.append(f'''  <article class="scene">
    <img src="{img_src(L["img"][sc.get("r", i)])}" width="1280" height="757" loading="lazy" alt="{E(sc.get("alt", sc["b"]))}">
    <div class="txt">
      <div class="top"><span class="label">{i + 1} · {E(sc["ayə"])}</span><button class="pill ghost say" type="button">{ui["say"]}</button></div>
      <h3{a_attr(au, sc["b"])}>{E(sc["b"])}</h3>
''')
        for p in sc['p']:
            o.append(f'      <p{a_attr(au, p)}>{inline(p)}</p>\n')
        if sc.get('deep'):
            dp = sc['deep']
            o.append(f'      <div class="deep{" rose" if dp.get("rose") else ""}"><h4>{E(dp["b"])}</h4><p{a_attr(au, dp["p"])}>{inline(dp["p"])}</p></div>\n')
        o.append('    </div>\n  </article>\n')
    if d.get('cedvel'):
        c = d['cedvel']
        o.append(f'  <div class="head"><h2>{E(c["b"])}</h2><span>{E(c.get("alt", ""))}</span></div>\n  <div class="tbl"><table>\n    <thead><tr>' +
                 ''.join(f'<th>{E(h)}</th>' for h in c['bas']) + '</tr></thead>\n    <tbody>\n' +
                 ''.join('      <tr>' + ''.join(f'<td>{inline(x)}</td>' for x in r) + '</tr>\n' for r in c['set']) + '    </tbody>\n  </table></div>\n')
    v = d['aye']
    o.append(f'''  <section class="verse">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="label" style="color:#F0C46A">{ui["verse_g"]}</span><button class="pill ghost" id="sayVerse" type="button">{ui["say"]}</button></div>
    <p class="big" id="verseText"{a_attr(au, v["metn"], "verse")}>{E(v["metn"])}</p>
    <p class="src">{ui["book"]} {E(v["ref"])} · {ui["simple_g"]}</p>
  </section>
''')
    o.append(f'  <div class="head"><h2>{ui["dict_g"][0]}</h2><span>{ui["dict_g"][1]}</span></div>\n  <div class="dict" id="dict"></div>\n')
    o.append(f'  <div class="head"><h2>{ui["quiz"][0]}</h2><span>{ui["quiz"][1](len(d["test"]))}</span></div>\n  <div class="quiz" id="quiz"></div>\n')
    o.append(f'  <section class="card">\n    <h2 style="font-size:24px">{ui["share"]}</h2>\n    <ol>\n' + ''.join(f'      <li>{inline(q)}</li>\n' for q in d['paylas']) + '    </ol>\n  </section>\n')
    et = d['etiraf']
    o.append(f'''  <section class="card">
    <h2 style="font-size:24px">{E(et["b"])}</h2>
    <label for="mine">{inline(et["p"])}</label>
    <textarea id="mine" placeholder="{E(et.get("ph", ""))}"></textarea>
  </section>
  <section class="verse" style="background:#0E1736">
    <span class="label" style="color:#F0C46A">{ui["pray_g"]}</span>
    <p id="prayerText"{a_attr(au, d["dua"], "prayer")} style="font-size:17px;line-height:1.8">{E(d["dua"])}</p>
    <button class="pill ghost" id="sayPrayer" type="button" style="align-self:flex-start">{ui["prayBtn"]}</button>
  </section>
</div>
''')
    o.append(sheet(ui))
    lug = d['lugat']
    if au is not None:
        for j, (w, x) in enumerate(lug.items()):
            au.key(f'{w}. {x["m"]} {x["e"]}', f'd{j}')
    dd = {'dil': lang, 'sinif': 'genc', 'ses': 'fayl' if lang == 'az' else 'cihaz', 'lugat': lug, 'test': d['test']}
    tracker = {'sinif': 'genc', 'ders': f'matta-{n:02d}'} if lang == 'az' else None
    o.append(foot_js(dd, lang, tracker, n))
    return ''.join(o), au


def build_teacher(L):
    global LUG
    LUG = None
    n = L['no']; t = L['muellim']
    ku, kg, au_, ag = L['ko']['usaq'], L['ko']['genc'], L['az']['usaq'], L['az']['genc']
    def rows(rs):
        return ''.join('      <tr>' + ''.join(f'<td>{inline(x)}</td>' for x in r) + '</tr>\n' for r in rs)
    def ans(qs_ko, qs_az):
        return ''.join(f'      <tr><td>{i + 1}</td><td>{E(a["o"][a["a"]])} / {E(b["o"][b["a"]])}</td><td>{E(a.get("f", ""))}</td></tr>\n' for i, (a, b) in enumerate(zip(qs_ko, qs_az)))
    links = [(f'matta-{n:02d}-az', 'Azərbaycanca · uşaqlar', '아제르바이잔어 어린이 · 음성'), (f'matta-{n:02d}-az-genc', 'Azərbaycanca · yeniyetmələr', '아제르바이잔어 청소년 · 음성'),
             (f'matta-{n:02d}-ko-usaq', '한국어 · 어린이', '그림 이야기와 퀴즈'), (f'matta-{n:02d}-ko-genc', '한국어 · 청소년', '배경·원어·나눔')]
    o = [f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>교사용 · 마태복음 {n}과</title>
<link rel="stylesheet" href="../../fonts/pretendardvariable-dynamic-subset.css">
<link rel="stylesheet" href="../muellim.css">
</head>
<body>
<div class="wrap">
<a class="back" href="../">← 교사용 목차</a>
<header>
  <span class="eb">MÜƏLLİM ÜÇÜN · 교사용</span>
  <h1>{E(kg["basliq"])}</h1>
  <p>제{n}과 · 마태복음 {E(L["ref"])} · 어린이: {E(ku["basliq"])}</p>
</header>
<section>
  <h2>학생용 교재 주소</h2>
  <div class="links">
''']
    for href, a, b in links:
        o.append(f'    <a href="../../{href}/"><b>{a}</b><small>{b}</small></a>\n')
    o.append(f'''  </div>
</section>
<section>
  <h2>개요</h2>
  <p>{inline(t["mesaj"])}</p>
  <div class="tbl"><table>
    <thead><tr><th></th><th>어린이반</th><th>청소년반</th></tr></thead>
    <tbody>
      <tr><td><b>시간</b></td><td>{L.get("deq", {}).get("usaq", 40)}분</td><td>{L.get("deq", {}).get("genc", 50)}분</td></tr>
''')
    for i in range(3):
        o.append(f'      <tr><td><b>목표 {i + 1}</b></td><td>{inline(ku["hedef"][i])}</td><td>{inline(kg["meqsed"][i])}</td></tr>\n')
    o.append(f'''      <tr><td><b>외울 말씀</b></td><td>{E(ku["aye"]["ref"])}</td><td>{E(kg["aye"]["ref"])}</td></tr>
    </tbody>
  </table></div>
  <h3>준비물</h3>
  <ul>{''.join(f"<li>{inline(x)}</li>" for x in t["hazirliq"])}</ul>
</section>
<section>
  <h2>본문 배경 해설</h2>
''')
    for b, p in t['fon']:
        o.append(f'  <p><b>{E(b)}</b> {inline(p)}</p>\n')
    o.append('</section>\n')
    for key, label, mins, tip in [('usaq_plan', '어린이반 진행안', L.get('deq', {}).get('usaq', 40), 'ipucu_usaq'), ('genc_plan', '청소년반 진행안', L.get('deq', {}).get('genc', 50), 'ipucu_genc')]:
        o.append(f'''<section>
  <h2>{label} ({mins}분)</h2>
  <div class="tbl"><table>
    <thead><tr><th>시간</th><th>순서</th><th>진행 방법</th><th>교사 멘트 예시</th></tr></thead>
    <tbody>
{rows(t[key])}    </tbody>
  </table></div>
  <h3>진행 팁</h3>
  <ul>{''.join(f"<li>{inline(x)}</li>" for x in t[tip])}</ul>
</section>
''')
    o.append(f'''<section>
  <h2>어려운 질문에 답하기</h2>
  <div class="tbl"><table>
    <thead><tr><th>질문</th><th>어린이반 답 예시</th><th>청소년반 답 예시</th></tr></thead>
    <tbody>
{rows(t["suallar"])}    </tbody>
  </table></div>
</section>
<section>
  <h2>퀴즈 정답</h2>
  <h3>어린이반</h3>
  <div class="tbl"><table>
    <thead><tr><th>번호</th><th>정답 (한국어 / Azərbaycanca)</th><th>해설</th></tr></thead>
    <tbody>
{ans(ku["test"], au_["test"])}    </tbody>
  </table></div>
  <p><b>외울 말씀 빈칸 놀이</b> 한국어판: {" → ".join(E(x) for x in ku["aye"]["sozler"])} (함정: {E(ku["aye"]["yalan"])}). 아제르바이잔어판: {" → ".join(E(x) for x in au_["aye"]["sozler"])} (함정: {E(au_["aye"]["yalan"])}).</p>
  <h3>청소년반</h3>
  <div class="tbl"><table>
    <thead><tr><th>번호</th><th>정답 (한국어 / Azərbaycanca)</th><th>해설</th></tr></thead>
    <tbody>
{ans(kg["test"], ag["test"])}    </tbody>
  </table></div>
</section>
<section>
  <h2>낱말 대조표</h2>
  <div class="tbl"><table>
    <thead><tr><th>한국어</th><th>Azərbaycanca</th><th>뜻</th></tr></thead>
    <tbody>
''')
    for w, x in kg['lugat'].items():
        o.append(f'      <tr><td>{E(w)}</td><td>{E(x["x"])}</td><td>{E(x.get("s", ""))}</td></tr>\n')
    o.append('''    </tbody>
  </table></div>
</section>
<footer>Müqəddəs Kitab dərsləri · 교사용</footer>
</div>
</body>
</html>
''')
    return ''.join(o)


def load_all():
    out = []
    for p in sorted(glob.glob(os.path.join(SRC, 'dersler', 'matta-*.json'))):
        out.append(json.load(open(p, encoding='utf-8')))
    return out


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(text)


def build_lesson(L):
    n = L['no']
    for lang, lvl, folder in [('az', 'usaq', f'matta-{n:02d}-az'), ('az', 'genc', f'matta-{n:02d}-az-genc'),
                              ('ko', 'usaq', f'matta-{n:02d}-ko-usaq'), ('ko', 'genc', f'matta-{n:02d}-ko-genc')]:
        WARN.clear()
        page, au = (build_usaq if lvl == 'usaq' else build_genc)(L, lang)
        if WARN: print(f'  ! {folder}: lüğətdə olmayan sözlər → adi mətn: {sorted(set(WARN))}')
        write(os.path.join(ROOT, folder, 'index.html'), page)
        if au is not None:
            write(os.path.join(SRC, 'ses', folder + '.json'), json.dumps(au.items, ensure_ascii=False, indent=0))
    write(os.path.join(ROOT, 'muellim', f'matta-{n:02d}', 'index.html'), build_teacher(L))


def build_index(lessons):
    """Ana səhifə: 1-ci dərs (əl ilə yazılıb) + yaradılan dərslər."""
    meta = [{'no': 1, 'ref': '1:1–25', 'az': 'İmmanuel — Allah bizimlədir!', 'ko': '임마누엘, 하나님이 우리와 함께', 'img': '02-isanin-dogulmasi.jpg'}]
    for L in lessons:
        meta.append({'no': L['no'], 'ref': L['ref'], 'az': L['az']['usaq']['basliq'], 'ko': L['ko']['usaq']['basliq'], 'img': L['img'][L.get('hero', len(L['img']) - 1)]})
    meta.sort(key=lambda m: m['no'])
    cards = []
    for m in meta:
        n = m['no']; src = ('img/' + m['img']) if '/' in m['img'] else ('img/nt/' + m['img'])
        cards.append(f'''<section class="card">
<img class="thumb" src="{src}" width="1280" height="757" loading="lazy" alt="">
<div class="body">
<span class="eyebrow">{az_ord(n)} dərs · 제{n}과 · Matta {E(m["ref"])}</span>
<h3>{E(m["az"])}</h3>
<p class="ko">{E(m["ko"])}</p>
<div class="links">
<a class="main" href="matta-{n:02d}-az/"><b>Azərbaycanca · uşaqlar</b><small>🔊 səsli oxu ilə</small></a>
<a class="main" href="matta-{n:02d}-az-genc/"><b>Azərbaycanca · yeniyetmələr</b><small>🔊 səsli oxu ilə</small></a>
<a href="matta-{n:02d}-ko-usaq/"><b>한국어 · 어린이</b><small>그림 이야기와 퀴즈</small></a>
<a href="matta-{n:02d}-ko-genc/"><b>한국어 · 청소년</b><small>배경·원어·나눔</small></a>
</div>
</div>
</section>''')
    p = os.path.join(ROOT, 'index.html')
    s = open(p, encoding='utf-8').read()
    a = s.index('<h2>Mattanın yazdığı Müjdə</h2>')
    b = s.index('<footer>')
    s = s[:a] + '<h2>Mattanın yazdığı Müjdə</h2>\n<!-- dersler:basla -->\n' + '\n'.join(cards) + '\n<!-- dersler:son -->\n\n' + s[b:]
    if '.card .thumb' not in s:
        s = s.replace('</style>', '.card{padding:0;overflow:hidden;gap:0}.card .thumb{display:block;width:100%;height:auto;aspect-ratio:5/2;object-fit:cover}.card .body{padding:16px 20px 18px;display:flex;flex-direction:column;gap:8px}.card .ko{margin:0;color:var(--soft)}\n</style>', 1)
    write(p, s)


def build_teacher_index(lessons):
    p = os.path.join(ROOT, 'muellim', 'index.html')
    s = open(p, encoding='utf-8').read()
    items = ['<li><a href="#links">제1과 · 마태복음 1:1–25 · 임마누엘, 하나님이 우리와 함께 (이 페이지)</a></li>']
    for L in lessons:
        items.append(f'<li><a href="matta-{L["no"]:02d}/">제{L["no"]}과 · 마태복음 {E(L["ref"])} · {E(L["ko"]["genc"]["basliq"])}</a></li>')
    block = '<!-- dersler:basla -->\n<section id="lessons">\n  <h2>과별 교사용 지도서</h2>\n  <ol class="lessons">\n    ' + '\n    '.join(items) + '\n  </ol>\n</section>\n<!-- dersler:son -->\n'
    if '<!-- dersler:basla -->' in s:
        a = s.index('<!-- dersler:basla -->'); b = s.index('<!-- dersler:son -->') + len('<!-- dersler:son -->\n')
        s = s[:a] + block + s[b:]
    else:
        s = s.replace('<section id="links">', block + '\n<section id="links">', 1)
        s = s.replace('<style>', '<style>\n.lessons{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:4px}.lessons a{color:inherit}\n', 1)
    write(p, s)


if __name__ == '__main__':
    lessons = load_all()
    only = {int(x) for x in sys.argv[1:]}
    for L in lessons:
        if not only or L['no'] in only:
            build_lesson(L)
            print('built', L['no'])
    build_index(lessons)
    build_teacher_index(lessons)
