#!/usr/bin/env python3
"""Gündəlik Oxu: hər ayənin səsi. oxu/data/<kitab>-metn-*.json → oxu/audio/<ibt>-<fəsil>/<ayə>.mp3 (edge-tts, Banu).
   python3 _src/oxu_ses.py            (yalnız dəyişən/olmayan fayllar yaradılır)"""
import asyncio, glob, hashlib, json, os
import edge_tts
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OXU = os.path.join(ROOT, 'oxu')
VOICE, RATE = 'az-AZ-BanuNeural', '-4%'
PX = os.environ.get('HTTPS_PROXY')
STAMP = os.path.join(ROOT, '_src', 'ses', 'oxu.hash.json')


async def one(path, text):
    for k in range(5):
        try:
            await asyncio.wait_for(edge_tts.Communicate(text, VOICE, rate=RATE, proxy=PX).save(path + '.tmp'), 60)
            os.replace(path + '.tmp', path); return True
        except Exception as e:
            err = e; await asyncio.sleep(2 + 3 * k)
    print('FAIL', path, err); return False


async def main():
    stamp = json.load(open(STAMP)) if os.path.exists(STAMP) else {}
    todo, keep = [], set()
    for f in sorted(glob.glob(os.path.join(OXU, 'data', '*-metn-*.json'))):
        ibt = json.load(open(f.replace('-metn-', '-oyrenme-'), encoding='utf-8')).get('ibt', 'Matt').lower()
        for c, verses in json.load(open(f, encoding='utf-8'))['fesiller'].items():
            d = os.path.join(OXU, 'audio', '%s-%02d' % (ibt, int(c)))
            os.makedirs(d, exist_ok=True)
            for i, v in enumerate(verses, 1):
                p = os.path.join(d, '%d.mp3' % i)
                k = os.path.relpath(p, OXU); keep.add(k)
                h = hashlib.md5((VOICE + RATE + v).encode()).hexdigest()
                if stamp.get(k) != h or not os.path.exists(p):
                    todo.append((k, v, p, h))
    sem = asyncio.Semaphore(6)

    async def run(k, v, p, h):
        async with sem:
            if await one(p, v): stamp[k] = h
    await asyncio.gather(*[run(*x) for x in todo])
    for k in list(stamp):
        if k not in keep:
            stamp.pop(k)
            if os.path.exists(os.path.join(OXU, k)): os.remove(os.path.join(OXU, k))
    json.dump(stamp, open(STAMP, 'w'), indent=0, sort_keys=True)
    print('yeni:', len(todo), 'cəmi:', len(keep))

asyncio.run(main())
