/* Gündəlik Oxu — fəsil səhnələri (SVG illüstrasiyalar, yüngül animasiya)
   Hər səhnə 800×320 ölçülü SVG qaytarır. */
(function () {
  const W = 800, H = 320;
  let uid = 0;
  const id = p => p + (++uid);
  const rnd = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280)(7);

  /* ---------- primitivlər ---------- */
  const sky = (stops) => { const g = id("sky"); return { def: `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`, el: `<rect width="${W}" height="${H}" fill="url(#${g})"/>` }; };
  const glow = (x, y, r, c, o = .8, cls = "") => { const g = id("gl"); return { def: `<radialGradient id="${g}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset=".45" stop-color="${c}" stop-opacity="${o * .3}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`, el: `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/>` }; };
  const stars = (n, c = "#FFF6DA", maxY = 170) => { let s = ""; for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * maxY, r = .6 + rnd() * 1.4; s += `<circle class="tw" style="animation-delay:${(rnd() * 3).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${c}"/>`; } return s; };
  const hill = (d, c) => `<path d="${d}" fill="${c}"/>`;
  const star8 = (x, y, r, c) => `<path d="M${x} ${y - r} L${x + r * .16} ${y - r * .16} L${x + r} ${y} L${x + r * .16} ${y + r * .16} L${x} ${y + r} L${x - r * .16} ${y + r * .16} L${x - r} ${y} L${x - r * .16} ${y - r * .16}Z" fill="${c}"/>`;
  // dayanan insan siluyeti (baseY = ayaq)
  const person = (x, b, h, c, o = {}) => {
    const r = h * .11, top = b - h, sh = top + r * 2.2;
    let s = `<g class="${o.cls || ""}" style="${o.delay ? "animation-delay:" + o.delay + "s" : ""}">`;
    if (o.halo) s += `<circle cx="${x}" cy="${top + r}" r="${r * 2.2}" fill="${o.halo}" opacity=".35"/>`;
    s += `<circle cx="${x}" cy="${top + r}" r="${r}" fill="${c}"/>`;
    s += `<path d="M${x - h * .12} ${sh} Q${x} ${sh - r * .6} ${x + h * .12} ${sh} L${x + h * .2} ${b} L${x - h * .2} ${b}Z" fill="${c}"/>`;
    if (o.staff) s += `<line x1="${x + h * .24}" y1="${top + h * .05}" x2="${x + h * .24}" y2="${b}" stroke="${c}" stroke-width="${Math.max(1.5, h * .025)}" stroke-linecap="round"/>`;
    if (o.headcloth) s += `<path d="M${x - r * 1.2} ${top + r * 1.1} Q${x} ${top - r * .6} ${x + r * 1.2} ${top + r * 1.1} L${x + r * 1.3} ${top + r * 2.6} L${x - r * 1.3} ${top + r * 2.6}Z" fill="${c}"/>`;
    return s + "</g>";
  };
  // oturan insan
  const sitter = (x, b, h, c) => `<circle cx="${x}" cy="${b - h + h * .12}" r="${h * .12}" fill="${c}"/><path d="M${x - h * .16} ${b - h * .7} Q${x} ${b - h * .8} ${x + h * .16} ${b - h * .7} L${x + h * .34} ${b} L${x - h * .3} ${b}Z" fill="${c}"/>`;
  const crowd = (x0, x1, b, h, c, n) => { let s = ""; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i / (n - 1)) + (rnd() - .5) * 10, hh = h * (.8 + rnd() * .35); s += person(x.toFixed(0) * 1, b + (rnd() * 6) | 0, hh, c); } return s; };
  const camel = (x, b, s, c, rider) => {
    const k = s / 100;
    let p = `<g transform="translate(${x} ${b}) scale(${k})">`;
    p += `<path d="M-48 -60 Q-40 -96 -14 -82 Q0 -112 22 -84 Q38 -80 40 -62 L52 -78 Q58 -104 70 -104 Q84 -104 82 -94 L70 -88 L62 -60 Q56 -46 40 -46 L-40 -46 Q-52 -48 -48 -60Z" fill="${c}"/>`;
    p += `<rect x="-40" y="-50" width="7" height="50" rx="3" fill="${c}"/><rect x="-26" y="-50" width="7" height="50" rx="3" fill="${c}"/><rect x="22" y="-50" width="7" height="50" rx="3" fill="${c}"/><rect x="34" y="-50" width="7" height="50" rx="3" fill="${c}"/>`;
    if (rider) p += `<circle cx="-2" cy="-122" r="9" fill="${c}"/><path d="M-14 -88 Q-2 -118 12 -88Z" fill="${c}"/><path d="M-12 -112 Q-2 -126 10 -112 L12 -104 L-14 -104Z" fill="${rider}"/>`;
    return p + "</g>";
  };
  const house = (x, b, w, h, c, lit) => {
    let s = `<rect x="${x}" y="${b - h}" width="${w}" height="${h}" rx="2" fill="${c}"/><rect x="${x - 2}" y="${b - h - 4}" width="${w + 4}" height="6" rx="2" fill="${c}"/>`;
    if (lit) s += `<rect class="tw slow" x="${x + w * .3}" y="${b - h * .62}" width="${w * .18}" height="${h * .26}" rx="1.5" fill="${lit}"/>`;
    return s;
  };
  const palm = (x, b, h, c) => {
    const tx = x + h * .12, ty = b - h;
    let s = `<path d="M${x} ${b} Q${x + h * .02} ${b - h * .5} ${tx} ${ty}" stroke="${c}" stroke-width="${h * .06}" fill="none" stroke-linecap="round"/>`;
    s += `<g class="sway" style="transform-origin:${tx}px ${ty}px">`;
    [[-1, -.2], [-1, .25], [1, -.25], [1, .2], [-.3, -.5], [.4, -.48]].forEach(([dx, dy]) => {
      s += `<path d="M${tx} ${ty} Q${tx + dx * h * .3} ${ty + dy * h * .3 - h * .12} ${tx + dx * h * .45} ${ty + dy * h * .4 + h * .08}" stroke="${c}" stroke-width="${h * .045}" fill="none" stroke-linecap="round"/>`;
    });
    return s + "</g>";
  };
  const tree = (x, b, h, c, c2) => `<rect x="${x - h * .04}" y="${b - h * .45}" width="${h * .08}" height="${h * .45}" fill="${c}"/><g class="sway slow" style="transform-origin:${x}px ${b - h * .4}px"><circle cx="${x}" cy="${b - h * .7}" r="${h * .3}" fill="${c2}"/><circle cx="${x - h * .2}" cy="${b - h * .55}" r="${h * .2}" fill="${c2}"/><circle cx="${x + h * .2}" cy="${b - h * .55}" r="${h * .2}" fill="${c2}"/></g>`;
  const bird = (x, y, s, c, delay = 0) => `<g class="fly" style="animation-delay:${delay}s"><path class="flap" style="transform-origin:${x}px ${y}px;animation-delay:${delay}s" d="M${x - s} ${y - s * .3} Q${x - s * .5} ${y - s * .7} ${x} ${y} Q${x + s * .5} ${y - s * .7} ${x + s} ${y - s * .3}" stroke="${c}" stroke-width="${Math.max(1.6, s * .18)}" fill="none" stroke-linecap="round"/></g>`;
  const dove = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 40})"><path d="M-30 6 Q-10 -2 6 4 Q20 -2 30 -4 Q24 4 14 8 Q4 16 -14 12 Q-24 12 -30 6Z" fill="#FFFFFF"/><path class="flap2" style="transform-origin:0px 4px" d="M-4 4 Q-14 -26 -38 -30 Q-22 -10 -16 6Z M6 4 Q18 -24 40 -26 Q24 -8 16 6Z" fill="#F4F7FF"/><circle cx="24" cy="-2" r="1.6" fill="#33405E"/></g>`;
  const cloud = (x, y, s, c, cls = "drift") => `<g class="${cls}"><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * .38}" fill="${c}"/><ellipse cx="${x - s * .45}" cy="${y + s * .05}" rx="${s * .5}" ry="${s * .3}" fill="${c}"/><ellipse cx="${x + s * .2}" cy="${y - s * .22}" rx="${s * .5}" ry="${s * .38}" fill="${c}"/></g>`;
  const waves = (y, c, amp = 6, cls = "wave", op = 1) => { let d = `M-80 ${y}`; for (let x = -80; x < W + 120; x += 40) d += ` q10 ${-amp} 20 0 q10 ${amp} 20 0`; d += ` V${H} H-80Z`; return `<path class="${cls}" d="${d}" fill="${c}" opacity="${op}"/>`; };
  const rain = (c = "#E6EEFF") => { let s = `<g class="rain" opacity=".55">`; for (let i = 0; i < 70; i++) { const x = rnd() * (W + 200) - 100, y = rnd() * H - 40; s += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 8).toFixed(0)}" y2="${(y + 22).toFixed(0)}" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`; } return s + "</g>"; };
  const boat = (x, b, s, c, sail) => `<g class="rock" style="transform-origin:${x}px ${b}px"><path d="M${x - s} ${b - s * .25} L${x + s} ${b - s * .25} Q${x + s * .8} ${b + s * .18} ${x + s * .55} ${b + s * .2} L${x - s * .6} ${b + s * .2} Q${x - s * .85} ${b + s * .15} ${x - s} ${b - s * .25}Z" fill="${c}"/><line x1="${x}" y1="${b - s * .25}" x2="${x}" y2="${b - s * 1.4}" stroke="${c}" stroke-width="${s * .05}"/><path d="M${x + s * .04} ${b - s * 1.35} Q${x + s * .7} ${b - s * .8} ${x + s * .06} ${b - s * .35}Z" fill="${sail}"/>${sitter(x - s * .45, b - s * .25, s * .45, c)}${sitter(x - s * .1, b - s * .25, s * .42, c)}</g>`;
  const flower = (x, b, h, stem, petal, delay) => `<g class="sway" style="transform-origin:${x}px ${b}px;animation-delay:${delay}s"><path d="M${x} ${b} Q${x - 3} ${b - h * .5} ${x} ${b - h}" stroke="${stem}" stroke-width="2" fill="none"/><g fill="${petal}">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="${b - h - 6}" rx="3.4" ry="7" transform="rotate(${a} ${x} ${b - h})"/>`).join("")}</g><circle cx="${x}" cy="${b - h}" r="2.8" fill="#F6C445"/></g>`;
  const sheep = (x, b, s, c = "#FBFAF5", head = "#3B3A44") => `<g class="bob" style="animation-delay:${(rnd() * 2).toFixed(1)}s"><rect x="${x - s * .35}" y="${b - s * .3}" width="${s * .1}" height="${s * .3}" fill="${head}"/><rect x="${x + s * .2}" y="${b - s * .3}" width="${s * .1}" height="${s * .3}" fill="${head}"/><ellipse cx="${x}" cy="${b - s * .45}" rx="${s * .55}" ry="${s * .32}" fill="${c}"/><circle cx="${x - s * .35}" cy="${b - s * .62}" r="${s * .2}" fill="${c}"/><circle cx="${x + s * .3}" cy="${b - s * .62}" r="${s * .2}" fill="${c}"/><ellipse cx="${x + s * .62}" cy="${b - s * .52}" rx="${s * .16}" ry="${s * .12}" fill="${head}"/></g>`;
  const rays = (x, y, r, c) => { let s = `<g class="spin" style="transform-origin:${x}px ${y}px" opacity=".35">`; for (let a = 0; a < 360; a += 20) s += `<path d="M${x} ${y} L${x + Math.cos(a * Math.PI / 180) * r} ${y + Math.sin(a * Math.PI / 180) * r} L${x + Math.cos((a + 7) * Math.PI / 180) * r} ${y + Math.sin((a + 7) * Math.PI / 180) * r}Z" fill="${c}"/>`; return s + "</g>"; };
  const coin = (x, y, d) => `<g class="tw" style="animation-delay:${d}s"><circle cx="${x}" cy="${y}" r="5" fill="#F2C14E"/><circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#C99520" stroke-width="1"/></g>`;

  const svg = (label, defs, body) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}"><defs>${defs.join("")}</defs>${body}</svg>`;
  const build = (label, parts) => { const defs = [], els = []; parts.forEach(p => { if (typeof p === "string") els.push(p); else { if (p.def) defs.push(p.def); els.push(p.el); } }); return svg(label, defs, els.join("")); };

  /* ---------- səhnələr ---------- */
  const S = {};
  // 1: ailə ağacı, sübh, Yusif və mələk
  S[1] = () => {
    let branches = "", dots = "";
    const pts = [[400, 70], [330, 92], [470, 92], [280, 128], [360, 120], [440, 120], [520, 128], [300, 165], [500, 165], [400, 150], [250, 170], [550, 170]];
    pts.forEach(([x, y], i) => { branches += `<path d="M400 248 Q${(400 + x) / 2} ${(248 + y) / 2 + 20} ${x} ${y}" stroke="#6B4A3A" stroke-width="${i < 3 ? 6 : 3.5}" fill="none" stroke-linecap="round"/>`; dots += `<g class="tw" style="animation-delay:${(i * .27).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="13" fill="#F6E3A6"/><circle cx="${x}" cy="${y}" r="7" fill="#E9B44C"/></g>`; });
    return build("Ailə ağacı və mələk", [
      sky([[0, "#2A2F66"], [.45, "#B76E8E"], [.8, "#F5B78E"], [1, "#FBD9A8"]]),
      glow(400, 250, 260, "#FFE2A8", .7),
      stars(26, "#FFF6DA", 90),
      hill("M0 250 Q200 220 400 240 T800 232 V320 H0Z", "#5C7A55"),
      `<path d="M386 300 Q392 250 396 248 L404 248 Q408 250 414 300Z" fill="#6B4A3A"/>`, branches, dots,
      glow(660, 120, 90, "#FFFFFF", .9, "pulse"),
      person(660, 190, 96, "#FFF8EA", { halo: "#FFFFFF", cls: "bob" }),
      `<path class="sway slow" style="transform-origin:660px 140px" d="M648 140 Q600 110 584 150 Q612 150 646 156Z M672 140 Q720 110 736 150 Q708 150 674 156Z" fill="#FFFFFF" opacity=".85"/>`,
      `<path d="M90 284 Q140 262 210 270 L230 284Z" fill="#3E4E3A"/>`, `<circle cx="96" cy="270" r="10" fill="#3E4E3A"/>`,
      `<text class="tw" x="120" y="246" font-size="18" fill="#FFF3D6" font-family="sans-serif">z</text><text class="tw" style="animation-delay:.6s" x="134" y="230" font-size="14" fill="#FFF3D6" font-family="sans-serif">z</text>`,
      hill("M0 290 Q260 270 520 290 T800 284 V320 H0Z", "#3E5A3A")
    ]);
  };
  // 2: ulduz, Bet-Lexem, dəvələr
  S[2] = () => build("Ulduz Bet-Lexem üzərində", [
    sky([[0, "#0B1230"], [.6, "#22336B"], [1, "#4B5C96"]]),
    stars(70),
    `<g class="travel">`, glow(560, 70, 120, "#FFF1C4", .85), `<polygon points="556,80 564,80 640,250 480,250" fill="#FFF1C4" opacity=".12"/>`, star8(560, 70, 26, "#FFF6DA"), `</g>`,
    hill("M0 236 Q180 206 360 220 T800 210 V320 H0Z", "#2E3F78"),
    house(470, 218, 34, 30, "#22305F", "#F6C766"), house(504, 222, 42, 40, "#22305F", "#F6C766"), house(548, 216, 30, 26, "#22305F"), house(580, 220, 46, 36, "#22305F", "#F6C766"), house(628, 214, 30, 28, "#22305F"),
    palm(690, 230, 70, "#1A2550"), palm(430, 236, 56, "#1A2550"),
    hill("M0 270 Q200 246 420 262 T800 252 V320 H0Z", "#1B2752"),
    `<g class="walk">`, camel(120, 282, 56, "#0F1736", "#7A4B8C"), camel(200, 286, 52, "#0F1736", "#3E6E9C"), camel(276, 290, 48, "#0F1736", "#9C6A3E"), `</g>`,
    hill("M0 300 Q300 288 800 296 V320 H0Z", "#121B40")
  ]);
  // 3: İordan, vəftiz, göyərçin
  S[3] = () => build("İordan çayında vəftiz", [
    sky([[0, "#9FD3F2"], [.7, "#DFF1FA"], [1, "#F3F8F2"]]),
    `<polygon points="360,0 440,0 470,210 330,210" fill="#FFF7D6" opacity=".45"/>`,
    glow(400, 30, 160, "#FFF6CF", .9),
    cloud(160, 60, 70, "#FFFFFF"), cloud(640, 50, 80, "#FFFFFF"),
    hill("M0 180 Q160 150 320 168 T640 160 T800 166 V320 H0Z", "#9CC48A"),
    hill("M0 200 Q200 182 400 196 T800 190 V320 H0Z", "#7BAE6E"),
    `<path d="M0 222 Q200 206 400 218 T800 214 V320 H0Z" fill="#4F9AC8"/>`,
    waves(236, "#6FB6DE", 4, "wave", .9), waves(256, "#4F9AC8", 5, "wave2", 1),
    `<g fill="#5F8A4E">${[30, 44, 58, 730, 746, 762, 776].map((x, i) => `<path class="sway" style="transform-origin:${x}px 236px;animation-delay:${i * .3}s" d="M${x} 236 Q${x - 4} 200 ${x + 2} 170" stroke="#5F8A4E" stroke-width="3" fill="none"/>`).join("")}</g>`,
    person(350, 262, 84, "#3F3A52", { headcloth: true }), person(420, 266, 90, "#5B4E6E"),
    `<ellipse cx="385" cy="262" rx="90" ry="8" fill="#3E86B6" opacity=".7"/>`,
    `<g class="descend">${dove(418, 120, 46)}</g>`
  ]);
  // 4: səhra, sınaq
  S[4] = () => build("Səhrada sınaq", [
    sky([[0, "#F3A15F"], [.55, "#F7C98A"], [1, "#FBE6C2"]]),
    glow(620, 110, 200, "#FFF0C2", .9), `<circle class="pulse" cx="620" cy="110" r="44" fill="#FFE7A6"/>`,
    hill("M0 200 Q200 160 420 190 T800 176 V320 H0Z", "#E2A86A"),
    hill("M0 236 Q260 200 520 230 T800 220 V320 H0Z", "#D18F52"),
    `<g fill="#9B6A3F"><ellipse cx="150" cy="272" rx="18" ry="10"/><ellipse cx="178" cy="276" rx="12" ry="8"/><ellipse cx="560" cy="268" rx="14" ry="8"/></g>`,
    person(400, 238, 92, "#4A2E2A", { staff: true, headcloth: true }),
    `<path d="M392 238 L360 300 L440 300 L408 238Z" fill="#000" opacity=".08"/>`,
    hill("M0 270 Q300 248 600 268 T800 262 V320 H0Z", "#B9773E"),
    bird(220, 70, 9, "#7A4A2E", 0), bird(250, 84, 7, "#7A4A2E", .6)
  ]);
  // 5: dağ, vəz
  S[5] = () => build("Dağüstü vəz", [
    sky([[0, "#7CC4F0"], [.7, "#CFEAFA"], [1, "#EAF6F1"]]),
    rays(400, 60, 420, "#FFFFFF"), glow(400, 60, 140, "#FFF8D8", .9),
    cloud(120, 70, 60, "#FFFFFF"), cloud(700, 90, 54, "#FFFFFF"),
    house(640, 150, 18, 16, "#C9B8A0", "#FFD77A"), house(660, 150, 22, 22, "#BBA88F"), house(684, 150, 16, 14, "#C9B8A0", "#FFD77A"),
    hill("M0 230 Q200 210 300 150 Q400 90 500 150 Q600 210 800 220 V320 H0Z", "#6FAE64"),
    hill("M0 250 Q240 230 400 240 T800 236 V320 H0Z", "#5B9852"),
    sitter(400, 112, 46, "#F7F2E6"), glow(400, 92, 34, "#FFFFFF", .6),
    crowd(170, 630, 300, 40, "#3D5A3A", 22),
    hill("M0 300 Q400 290 800 300 V320 H0Z", "#3D6A3A")
  ]);
  // 6: zanbaqlar və quşlar
  S[6] = () => {
    let fl = ""; for (let i = 0; i < 26; i++) { const x = 10 + i * 31 + rnd() * 10, h = 28 + rnd() * 34; fl += flower(x.toFixed(0) * 1, 300, h, "#4E8A4A", ["#FFFFFF", "#F3C1D6", "#C9B6F2", "#FFE38A"][i % 4], (rnd() * 2).toFixed(1)); }
    return build("Quşlar və çöl zanbaqları", [
      sky([[0, "#F6C9A9"], [.5, "#F9E2C4"], [1, "#F4F1DC"]]),
      glow(640, 230, 220, "#FFE6A8", .8), `<circle cx="640" cy="230" r="40" fill="#FFE2A0"/>`,
      cloud(180, 80, 60, "#FFFFFF", "drift"), cloud(520, 60, 46, "#FFF6EE", "drift slow"),
      hill("M0 240 Q200 210 400 230 T800 220 V320 H0Z", "#9CC27E"),
      hill("M0 270 Q300 250 600 266 T800 262 V320 H0Z", "#7FAE68"),
      fl,
      bird(140, 120, 12, "#4B3E5A", 0), bird(180, 104, 9, "#4B3E5A", .4), bird(214, 128, 10, "#4B3E5A", .9)
    ]);
  };
  // 7: qaya və qum üzərində ev
  S[7] = () => build("Qaya üzərində ev", [
    sky([[0, "#4D5878"], [.6, "#8592AE"], [1, "#B8C2D4"]]),
    `<path class="flash" d="M560 20 L530 90 L556 90 L520 170 L590 76 L562 76 L590 20Z" fill="#FFF3B0"/>`,
    cloud(150, 50, 90, "#5F6A88", ""), cloud(420, 40, 110, "#56607E", ""), cloud(690, 60, 90, "#606C8A", ""),
    rain(),
    `<path d="M80 300 L120 214 Q200 196 280 214 L320 300Z" fill="#6B6F7A"/><path d="M120 214 Q200 200 280 214 L270 230 Q200 216 130 230Z" fill="#82868F"/>`,
    house(150, 214, 100, 66, "#E8DCC6", "#F6C766"), `<path d="M144 152 L200 120 L256 152Z" fill="#9C5B43"/><rect x="148" y="148" width="104" height="8" fill="#9C5B43"/>`,
    `<g transform="rotate(14 600 280)"><rect x="550" y="206" width="96" height="60" fill="#D8C9AE"/><path d="M544 208 L598 176 L652 208Z" fill="#8A5A47"/><rect x="590" y="230" width="18" height="36" fill="#7A6A52"/></g>`,
    `<path d="M440 300 Q560 262 760 286 L800 320 H420Z" fill="#D9C08C"/>`,
    waves(286, "#6F8FB0", 7, "wave", .9), waves(300, "#587A9E", 6, "wave2", 1)
  ]);
  // 8: tufan, qayıq
  S[8] = () => build("Göldə tufan", [
    sky([[0, "#1E2740"], [.6, "#3E4D6E"], [1, "#5D6F8E"]]),
    `<path class="flash" d="M610 10 L580 80 L604 80 L570 150 L640 66 L612 66 L640 10Z" fill="#FFF3B0"/>`,
    cloud(200, 40, 110, "#2B3552", ""), cloud(520, 30, 120, "#2A3450", ""),
    rain("#C9D6EE"),
    waves(200, "#2E5F8A", 14, "wave", .8),
    boat(400, 222, 70, "#2B1F1A", "#E8DCC6"),
    waves(236, "#244E78", 16, "wave2", .95), waves(270, "#1C3F63", 12, "wave", 1),
    `<g class="spray" opacity=".7"><circle cx="300" cy="214" r="4" fill="#E6F0FF"/><circle cx="312" cy="206" r="3" fill="#E6F0FF"/><circle cx="500" cy="210" r="4" fill="#E6F0FF"/></g>`
  ]);
  // 9: Mattanın evi, süfrə, vergi masası
  S[9] = () => build("Mattanın evində süfrə", [
    sky([[0, "#F2A86B"], [.55, "#F7CF98"], [1, "#FBE9C8"]]),
    glow(160, 120, 160, "#FFE7B0", .8),
    house(40, 230, 90, 80, "#D9B48A"), house(130, 230, 70, 100, "#CDA67C", "#FFD77A"), house(600, 230, 80, 90, "#D9B48A", "#FFD77A"), house(680, 230, 100, 70, "#CDA67C"),
    palm(560, 236, 80, "#7A5A3E"),
    hill("M0 232 Q400 220 800 232 V320 H0Z", "#C99A66"),
    `<path d="M250 210 Q400 196 560 210" stroke="#8A5A3E" stroke-width="2" fill="none"/>`,
    [270, 330, 390, 450, 510].map((x, i) => `<g class="tw slow" style="animation-delay:${i * .4}s"><circle cx="${x}" cy="${204 - (i % 2) * 4}" r="7" fill="#FFD77A"/><circle cx="${x}" cy="${204 - (i % 2) * 4}" r="14" fill="#FFD77A" opacity=".25"/></g>`).join(""),
    `<rect x="250" y="264" width="300" height="12" rx="4" fill="#7A4E32"/><rect x="270" y="276" width="8" height="26" fill="#6A4430"/><rect x="522" y="276" width="8" height="26" fill="#6A4430"/>`,
    sitter(280, 266, 52, "#5A3B4E"), sitter(340, 266, 56, "#2F4E5E"), person(400, 266, 70, "#F6EEDC", { headcloth: false }), sitter(460, 266, 54, "#6E4A2E"), sitter(520, 266, 52, "#3E3E5E"),
    `<path d="M320 258 Q330 252 340 258 M450 258 Q460 252 470 258" stroke="#E8D3A8" stroke-width="3" fill="none"/>`,
    `<rect x="640" y="268" width="80" height="10" rx="3" fill="#7A4E32"/>`, coin(660, 262, 0), coin(676, 262, .5), coin(692, 262, 1), coin(706, 262, 1.5),
    hill("M0 300 Q400 290 800 300 V320 H0Z", "#B9874F")
  ]);
  // 10: yol, On İki, sərçələr, qoyunlar
  S[10] = () => {
    let walkers = ""; for (let i = 0; i < 12; i++) { const t = i / 11, x = 250 + t * 360, b = 300 - t * 70, h = 64 - t * 30; walkers += person(x, b, h, ["#3E3A5E", "#5A3B3B", "#2F4E5E", "#4E3E2E"][i % 4], { cls: "bob", delay: (i * .15).toFixed(2), staff: i % 3 === 0 }); }
    return build("On İki həvari yolda", [
      sky([[0, "#A9D8F2"], [.6, "#E2F2F6"], [1, "#F1F6E4"]]),
      glow(120, 70, 120, "#FFF6D0", .9), `<circle cx="120" cy="70" r="30" fill="#FFF0B8"/>`,
      cloud(380, 60, 54, "#FFFFFF"), cloud(640, 80, 70, "#FFFFFF"),
      hill("M0 220 Q200 190 400 210 T800 196 V320 H0Z", "#A6CB8A"),
      hill("M0 250 Q300 226 600 246 T800 240 V320 H0Z", "#8DBB74"),
      `<path d="M120 320 Q300 280 480 260 Q600 246 760 228 L800 230 Q620 256 520 270 Q360 292 260 320Z" fill="#D9BE8E"/>`,
      walkers,
      sheep(90, 268, 34), sheep(140, 278, 28), sheep(60, 290, 30),
      bird(520, 110, 8, "#5A4A3A", 0), bird(548, 98, 6, "#5A4A3A", .5), bird(572, 116, 7, "#5A4A3A", 1),
      `<g transform="translate(700 220) scale(.9)"><path d="M0 0 Q10 -24 30 -22 L44 -34 L44 -18 Q54 -10 50 0Z" fill="#6A6470"/><rect x="6" y="-2" width="5" height="16" fill="#6A6470"/><rect x="36" y="-2" width="5" height="16" fill="#6A6470"/></g>`
    ]);
  };

  window.OXU_SEHNE = { Matta: S };
})();
