---
name: gundelik-oxu
description: Adds chapters to the youth Bible reading site "Gündəlik Oxu" (m-dersleri/oxu, Azerbaijani, teens) – the unchanged Bible text, recorded Azerbaijani audio for every verse, title/intro/quiz/reflection questions, word dictionary and an animated scene – and keeps its audio up to date. Use it whenever the owner asks for the next chapters or the next 10 ("Matta 11–20 만들어 주세요", "다음 10장", "성경읽기", "Gündəlik Oxu", "청소년 성경읽기"), a new book (Mark, Luke, John), fixing a chapter's quiz or dictionary, or the reading audio.
---

# Gündəlik Oxu – adding chapters

The site is `oxu/` in this repo (GitHub Pages: https://skyazery.github.io/m-dersleri/oxu/). Students open it with a personal key (`?k=…`), read one chapter a day, and "Oxudum və göndər" saves the result to the owner's Google Sheet and Telegram (`oxu/apps-script/Code.gs`, URL in `oxu/ayarlar.js`). Never push without the owner's go-ahead: the site is live for students.

## Files
| file | what |
|---|---|
| `oxu/data/<book>-metn-AA-BB.json` | Bible text, 10 chapters per file: `{menbe, fesiller: {"11": [verses…]}}`. Made by script only. |
| `oxu/data/<book>-oyrenme-AA-BB.json` | Study data for the same chapters (you write this). |
| `oxu/ayarlar.js` | Lists the data files (`METN`, `OYRENME`). Add each new pair here. |
| `oxu/audio/<ibt>-NN/<verse>.mp3` | One recording per verse (e.g. `audio/matt-11/3.mp3`). Made by script only. |
| `oxu/sehne.js` | Hand-drawn SVG scenes for some chapters (optional; otherwise the JSON `sehne` emoji scene is used). |
| `_src/oxu_metn.py`, `_src/oxu_ses.py` | Text fetcher and audio maker. |

## Steps for the next 10 chapters
1. Text: `python3 _src/oxu_metn.py <vl> <from> <to> <book>` (e.g. `40 11 20 matta`). Never edit the verses.
2. Read every chapter's verses, then write `oxu/data/<book>-oyrenme-<from>-<to>.json` (format below).
3. Add both files to `oxu/ayarlar.js`.
4. Audio: `python3 _src/oxu_ses.py` (needs `pip install edge-tts`; only new or changed verses are recorded, voice `az-AZ-BanuNeural`, rate −4% – the same voice as the lessons).
5. Check at phone size: `python3 -m http.server 8767` in the repo, open `http://localhost:8767/oxu/?f=<chapter>` (sample mode, nothing is sent). Play two verses, tap a verse number, open a dictionary word, answer the quiz.
6. Give the owner, in Korean, a short review list per chapter: title, memory verse, the 3 quiz questions with answers.
7. After approval: commit, push, wait ~1 minute, check one new chapter page and one new mp3 return 200.

## Study data format (`oyrenme`)
Top level (copy from the previous file of the same book): `kitab` ("Matta"), `kitabAd` ("Mattanın yazdığı Müjdə"), `ibt` ("Matt"), `cemi` (28), `umumiFikir`, `melumat` (book facts and parts), plus:

- `fesiller`: `{ "11": chapter, … }` where chapter is
  - `basliq` – 2–4 word heading (e.g. "Çöldə bir səs")
  - `giris` – one sentence: what happens
  - `bax` – 3 short "watch for" items, each starting with an emoji ("🦗 Yəhya nə yeyir?")
  - `ayə` – the memory verse number
  - `test` – 3 questions `[question, [3 options], right index]`, answers straight from the text; vary the right index
  - `fikir` – 2 reflection questions (the general one in `umumiFikir` is added automatically)
  - `sehne` – `{fon, e: [[emoji, x%, y%, size, anim, delay], …]}` with 4–8 elements.
    - `fon`: cay, dag, deniz, gece, kend, seher, sehra, yagis, yol
    - `anim`: blink, descend, drift, flash, float, fly, hop, none, pulse, rise, rock, swing, travel, twinkle, walk, wave
- `lugat`: list of `{s: [stems], b: heading, n: type (Şəxs / Yer / Söz …), m: meaning, bil: "Did you know" or ""}`. Stems are the lowercase start of the word as written. Add every new person, place and hard word of these chapters; do not repeat entries from earlier files.

Language: Azerbaijani, informal "sən" to the teen, short sentences. Explanations stay with the text and widely shared Christian understanding; cross-references like "(Yeşaya 40:3)".

## Books
| book | kitabAd | kitab | vl | cemi | ibt |
|---|---|---|---|---|---|
| matta | Mattanın yazdığı Müjdə | Matta | 40 | 28 | Matt |
| mark | Markın yazdığı Müjdə | Mark | 41 | 16 | Mark |
| luka | Lukanın yazdığı Müjdə | Luka | 42 | 24 | Luke |
| yehya | Yəhyanın yazdığı Müjdə | Yəhya | 43 | 21 | John |

## Licence
Bible text: Azərbaycan dilində Müqəddəs Kitab, © 2008 Müqəddəs Kitab Şirkəti, CC BY-NC-ND 4.0 – unchanged, non-commercial, with credit (the page shows it). The recordings read the text unchanged.
