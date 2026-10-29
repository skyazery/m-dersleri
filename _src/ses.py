#!/usr/bin/env python3
"""Azərbaycan dilində səs faylları: _src/ses/<qovluq>.json → <qovluq>/audio/*.mp3 (edge-tts, Banu).
   python3 _src/ses.py matta-02-az matta-02-az-genc   (yalnız dəyişən/olmayan fayllar yaradılır)"""
import asyncio, json, os, sys, hashlib
import edge_tts
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PX = os.environ.get('HTTPS_PROXY')

async def one(path, text, rate):
    for _ in range(4):
        try:
            await edge_tts.Communicate(text, 'az-AZ-BanuNeural', rate=rate, proxy=PX).save(path); return True
        except Exception as e:
            err = e; await asyncio.sleep(2)
    print('FAIL', path, err); return False

async def folder(name):
    items = json.load(open(os.path.join(ROOT, '_src', 'ses', name + '.json'), encoding='utf-8'))
    out = os.path.join(ROOT, name, 'audio'); os.makedirs(out, exist_ok=True)
    stamp_p = os.path.join(ROOT, '_src', 'ses', name + '.hash.json')
    stamp = json.load(open(stamp_p)) if os.path.exists(stamp_p) else {}
    rate = '-4%' if name.endswith('genc') else '-6%'
    sem = asyncio.Semaphore(5); todo = []
    for k, t in items.items():
        h = hashlib.md5((rate + t).encode()).hexdigest()
        p = os.path.join(out, k + '.mp3')
        if stamp.get(k) == h and os.path.exists(p): continue
        todo.append((k, t, p, h))
    async def run(k, t, p, h):
        async with sem:
            if await one(p, t, rate): stamp[k] = h
    await asyncio.gather(*[run(*x) for x in todo])
    for f in os.listdir(out):
        if f.endswith('.mp3') and f[:-4] not in items: os.remove(os.path.join(out, f))
    json.dump(stamp, open(stamp_p, 'w'))
    print(name, 'new:', len(todo), 'total:', len(items))

async def main():
    for n in sys.argv[1:]: await folder(n)
asyncio.run(main())
