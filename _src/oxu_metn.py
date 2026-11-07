"""Gündəlik Oxu: Müqəddəs Kitab mətnini holybible.or.kr-dan götürür (dəyişdirilmədən).
İstifadə: python3 _src/oxu_metn.py 40 11 20 matta   → oxu/data/matta-metn-11-20.json
          python3 _src/oxu_metn.py 40 11              → bir fəslin ayələri (JSON) ekrana"""
import html, json, re, sys, urllib.request

URL = 'http://www.holybible.or.kr/BIBLE_azer/cgi/bibleftxt.php?VR=0&VL=%d&CN=%d&CV=99&FR='


def fetch(vl, cn):
    req = urllib.request.Request(URL % (vl, cn), headers={'User-Agent': 'Mozilla/5.0'})
    raw = urllib.request.urlopen(req, timeout=30).read().decode('cp1254', 'replace')
    items = re.findall(r'<li>\s*<font class=tk4l>(.*?)</font>', raw, re.S | re.I)
    verses = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', x))).strip() for x in items]
    if not verses:
        raise SystemExit('Ayə tapılmadı: VL=%d CN=%d' % (vl, cn))
    return verses


if __name__ == '__main__':
    import os
    a = sys.argv[1:]
    if len(a) == 2:
        print(json.dumps(fetch(int(a[0]), int(a[1])), ensure_ascii=False, indent=1))
    else:
        vl, c1, c2, slug = int(a[0]), int(a[1]), int(a[2]), a[3]
        out = {'menbe': 'Azərbaycan dilində Müqəddəs Kitab, © 2008 Müqəddəs Kitab Şirkəti. CC BY-NC-ND 4.0. Mətn dəyişdirilmədən verilir.',
               'fesiller': {str(c): fetch(vl, c) for c in range(c1, c2 + 1)}}
        p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'oxu', 'data', '%s-metn-%02d-%02d.json' % (slug, c1, c2))
        json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
        print(p, {c: len(v) for c, v in out['fesiller'].items()})
