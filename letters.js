"use strict";

/* =========================================================
   Thai Lingo — Letters: alphabet lessons + handwriting
   Loaded after app.js (uses its helpers: shuffle, pick, speak,
   lessonShell, feedback, choiceExercise, modal, toast, ...).
   ========================================================= */

// The 42 Thai consonants in use today (ฃ and ฅ are obsolete).
// [letter, picture word, romanized name, sound at start of a syllable, meaning, class]
const LETTER_ROWS = [
  ["ก", "ไก่", "gaw gài", "g", "chicken", "mid"],
  ["ข", "ไข่", "khǎw khài", "kh", "egg", "high"],
  ["ค", "ควาย", "khaw khwaai", "kh", "buffalo", "low"],
  ["ฆ", "ระฆัง", "khaw rá-khang", "kh", "bell", "low"],
  ["ง", "งู", "ngaw nguu", "ng", "snake", "low"],
  ["จ", "จาน", "jaw jaan", "j", "plate", "mid"],
  ["ฉ", "ฉิ่ง", "chǎw chìng", "ch", "small cymbals", "high"],
  ["ช", "ช้าง", "chaw cháang", "ch", "elephant", "low"],
  ["ซ", "โซ่", "saw sôo", "s", "chain", "low"],
  ["ฌ", "เฌอ", "chaw chəə", "ch", "tree", "low"],
  ["ญ", "หญิง", "yaw yǐng", "y", "woman", "low"],
  ["ฎ", "ชฎา", "daw chá-daa", "d", "headdress", "mid"],
  ["ฏ", "ปฏัก", "dtaw bpà-dtàk", "dt", "spear", "mid"],
  ["ฐ", "ฐาน", "thǎw thǎan", "th", "pedestal", "high"],
  ["ฑ", "มณโฑ", "thaw mon-thoo", "th", "Montho (a queen)", "low"],
  ["ฒ", "ผู้เฒ่า", "thaw phûu-thâo", "th", "elder", "low"],
  ["ณ", "เณร", "naw neen", "n", "novice monk", "low"],
  ["ด", "เด็ก", "daw dèk", "d", "child", "mid"],
  ["ต", "เต่า", "dtaw dtào", "dt", "turtle", "mid"],
  ["ถ", "ถุง", "thǎw thǔng", "th", "bag", "high"],
  ["ท", "ทหาร", "thaw thá-hǎan", "th", "soldier", "low"],
  ["ธ", "ธง", "thaw thong", "th", "flag", "low"],
  ["น", "หนู", "naw nǔu", "n", "mouse", "low"],
  ["บ", "ใบไม้", "baw bai-máai", "b", "leaf", "mid"],
  ["ป", "ปลา", "bpaw bplaa", "bp", "fish", "mid"],
  ["ผ", "ผึ้ง", "phǎw phʉ̂ng", "ph", "bee", "high"],
  ["ฝ", "ฝา", "fǎw fǎa", "f", "lid", "high"],
  ["พ", "พาน", "phaw phaan", "ph", "offering tray", "low"],
  ["ฟ", "ฟัน", "faw fan", "f", "teeth", "low"],
  ["ภ", "สำเภา", "phaw sǎm-phao", "ph", "sailing ship", "low"],
  ["ม", "ม้า", "maw máa", "m", "horse", "low"],
  ["ย", "ยักษ์", "yaw yák", "y", "giant", "low"],
  ["ร", "เรือ", "raw rʉa", "r", "boat", "low"],
  ["ล", "ลิง", "law ling", "l", "monkey", "low"],
  ["ว", "แหวน", "waw wǎen", "w", "ring", "low"],
  ["ศ", "ศาลา", "sǎw sǎa-laa", "s", "pavilion", "high"],
  ["ษ", "ฤๅษี", "sǎw rʉʉ-sǐi", "s", "hermit", "high"],
  ["ส", "เสือ", "sǎw sʉ̌a", "s", "tiger", "high"],
  ["ห", "หีบ", "hǎw hìip", "h", "chest (box)", "high"],
  ["ฬ", "จุฬา", "law jù-laa", "l", "kite", "low"],
  ["อ", "อ่าง", "aw àang", "silent / a vowel holder", "basin", "mid"],
  ["ฮ", "นกฮูก", "haw nók-hûuk", "h", "owl", "low"],
];

const LETTERS = LETTER_ROWS.map(([ch, word, rom, sound, meaning, cls]) => {
  const snd = sound === "silent / a vowel holder" ? "silent" : `“${sound}”`;
  return {
    id: "L:" + ch, kind: "consonant",
    ch, word, rom, sound, meaning, cls,
    // fields so the shared choice/feedback code can display letters like words
    th: ch,
    en: `${snd} sound · ${meaning}`,
    say: `${ch}อ ${word}`, // e.g. "กอ ไก่" — how Thais say the letter's name
    optLabel: `<b>${sound === "silent / a vowel holder" ? "silent" : sound}</b> <span class="rom">${rom}</span> · ${meaning}`,
    question: `Which letter is ${snd} as in ${meaning}?`,
    traceLabel: `<b>${rom}</b> · ${snd} · ${meaning}`,
  };
});

// Vowels, written around the placeholder อ to show where they sit.
// [form, sound, length, example word, example romanization, meaning, pronunciation hint]
const VOWEL_ROWS = [
  ["อา", "aa", "long", "ตา", "dtaa", "eye", "like “a” in father"],
  ["อี", "ii", "long", "ดี", "dii", "good", "like “ee” in see"],
  ["อู", "uu", "long", "งู", "nguu", "snake", "like “oo” in moon"],
  ["โอ", "oo", "long", "โต", "dtoo", "big", "like “o” in go (no w at the end)"],
  ["เอ", "ee", "long", "เท", "thee", "to pour", "like “ay” in say (no y at the end)"],
  ["แอ", "ae", "long", "แม่", "mâe", "mother", "like “a” in cat, held long"],
  ["อะ", "a", "short", "จะ", "jà", "will (future)", "short “a” as in but"],
  ["อิ", "i", "short", "กิน", "gin", "to eat", "short “i” as in sit"],
  ["อุ", "u", "short", "ทุก", "thúk", "every", "short “u” as in put"],
  ["โอะ", "o", "short", "โต๊ะ", "dtó", "table", "short “o”, clipped"],
  ["เอะ", "e", "short", "เตะ", "dtè", "to kick", "short “e” as in bet"],
  ["แอะ", "ae", "short", "แกะ", "gàe", "sheep", "short “a” as in cat"],
  ["ออ", "aw", "long", "พอ", "phaw", "enough", "like “aw” in saw"],
  ["เอาะ", "aw", "short", "เกาะ", "gàw", "island", "short “aw”, clipped"],
  ["อือ", "ʉʉ", "long", "มือ", "mʉʉ", "hand", "say “ee” but with your tongue pulled back — no English match"],
  ["อึ", "ʉ", "short", "ดึก", "dʉ̀k", "late at night", "short version of ʉʉ"],
  ["เออ", "əə", "long", "เธอ", "thəə", "you / she", "like “ur” in burn (no r)"],
  ["เออะ", "ə", "short", "เลอะ", "lə́", "messy", "short “uh”"],
  ["ไอ", "ai", "special", "ไป", "bpai", "to go", "like “i” in bike — the most common way to write ai"],
  ["ใอ", "ai", "special", "ใจ", "jai", "heart / mind", "same sound as ไ — used in only 20 words"],
  ["อำ", "am", "special", "ทำ", "tham", "to do", "like “um” in drum"],
  ["เอา", "ao", "special", "เขา", "khǎo", "he / she", "like “ow” in cow"],
  ["เอีย", "ia", "special", "เรียน", "rian", "to study", "“ee-ah” glided together"],
  ["เอือ", "ʉa", "special", "เรือ", "rʉa", "boat", "ʉʉ gliding into “ah”"],
  ["อัว", "ua", "special", "ตัว", "dtua", "body", "“oo-ah” glided together"],
];
const VOWELS = VOWEL_ROWS.map(([ch, sound, length, word, wordRom, meaning, hint]) => {
  const len = length === "special" ? "" : ` (${length})`;
  return {
    id: "V:" + ch, kind: "vowel",
    ch, sound, length, word, wordRom, meaning, hint, rom: sound,
    th: ch,
    en: `“${sound}”${len} · as in ${word} ${wordRom} (${meaning})`,
    say: ch,
    optLabel: `<b>${sound}</b>${len}`,
    question: `Which vowel sounds like “${sound}”${len}?`,
    traceLabel: `<b>${sound}</b>${len} · as in <span class="thai">${word}</span> ${wordRom}`,
  };
});

// Tone marks. Their effect shown here is for mid-class consonants (like อ, ก, ป, ต).
const TONE_ROWS = [
  ["อ่", "mái èek", "low", "ป่า", "bpàa", "forest"],
  ["อ้", "mái thoo", "falling", "ป้า", "bpâa", "aunt (older)"],
  ["อ๊", "mái dtrii", "high", "โต๊ะ", "dtó", "table"],
  ["อ๋", "mái jàt-dtà-waa", "rising", "ตั๋ว", "dtǔa", "ticket"],
];
const TONES = TONE_ROWS.map(([ch, rom, tone, word, wordRom, meaning]) => ({
  id: "T:" + ch, kind: "tone",
  ch, rom, sound: `${tone} tone`, tone, word, wordRom, meaning,
  th: ch,
  en: `${tone} tone (on mid-class letters) · as in ${word} ${wordRom} (${meaning})`,
  say: word,
  optLabel: `<b>${tone} tone</b> <span class="rom">${rom}</span>`,
  question: `Which mark gives a mid-class letter a ${tone} tone?`,
  traceLabel: `<b>${rom}</b> · ${tone} tone · <span class="thai">${word}</span> ${wordRom}`,
}));

const ALL_LETTERS = [...LETTERS, ...VOWELS, ...TONES];
const LETTER_BY = Object.fromEntries(ALL_LETTERS.map((l) => [l.ch, l]));

// Learning order: most useful letters first, rare ones last.
// (Order matters: progress is saved by position, so add new sets at the end.)
const LETTER_SETS = [
  { group: "consonant", title: "Set 1", letters: "ก ค ง ด ต น" },
  { group: "consonant", title: "Set 2", letters: "บ ป ม ย ร ล" },
  { group: "consonant", title: "Set 3", letters: "ว อ ห ส ช ท" },
  { group: "consonant", title: "Set 4", letters: "ข จ ผ ฝ พ ฟ" },
  { group: "consonant", title: "Set 5", letters: "ถ ซ ฉ ญ ภ ศ" },
  { group: "consonant", title: "Set 6", letters: "ษ ธ ฆ ณ ฮ ฬ" },
  { group: "consonant", title: "Set 7", letters: "ฎ ฏ ฐ ฑ ฒ ฌ" },
  { group: "vowel", title: "Long vowels", letters: "อา อี อู โอ เอ แอ" },
  { group: "vowel", title: "Short vowels", letters: "อะ อิ อุ โอะ เอะ แอะ" },
  { group: "vowel", title: "More vowels", letters: "ออ เอาะ อือ อึ เออ เออะ" },
  { group: "vowel", title: "Combo vowels", letters: "ไอ ใอ อำ เอา เอีย เอือ อัว" },
  { group: "tone", title: "Tone marks", letters: "อ่ อ้ อ๊ อ๋" },
].map((s) => ({ ...s, letters: s.letters.split(" ").map((c) => LETTER_BY[c]) }));

// Letters that are easy to confuse — used as tricky wrong answers.
const LOOKALIKES = ["ก ถ ภ ฦ", "ข ช ซ", "ค ด ศ ต", "บ ป ษ ย", "ผ ฝ พ ฟ", "ม น ฆ", "ว ร ธ", "ท ฑ ห", "อ ฮ ฮ", "ฎ ฏ ฐ ฎ", "ล ส ฬ", "ง จ", "ญ ฌ ณ",
  // vowels: short/long partners and similar shapes
  "อะ อา อำ", "อิ อี อึ อือ", "อุ อู", "เอะ เอ เออ", "แอะ แอ", "โอะ โอ", "เอาะ ออ เอา", "เออะ เออ", "ไอ ใอ", "เอีย เอือ อัว"]
  .map((g) => g.split(" "));

const CLASS_NOTE = {
  mid: "Mid class",
  high: "High class",
  low: "Low class",
};

/* ---------- Progress ---------- */
const letterSeen = (l) => !!(S.lseen && S.lseen[l.id]);
function markLetterSeen(l) { S.lseen = S.lseen || {}; S.lseen[l.id] = true; save(); }
const setDone = (i) => !!(S.lsets && S.lsets[i]);

/* =========================================================
   Handwriting pad
   ========================================================= */
const GLYPH_FONT = 'Thonburi, "Noto Sans Thai Looped", "Leelawadee UI", "Noto Sans Thai", sans-serif';
const GRID = 48;

// Creates a drawing pad inside `host`. Returns helpers to read, clear, and show answers.
function createPad(host, { guide, ch }) {
  const size = Math.min(host.clientWidth || 320, 340);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  host.innerHTML = `
    <div class="pad" style="width:${size}px;height:${size}px">
      <canvas class="pad-bg"></canvas>
      <canvas class="pad-ink"></canvas>
      <div class="start-dot hidden"><span>Start</span></div>
    </div>`;
  const [bg, ink] = host.querySelectorAll("canvas");
  [bg, ink].forEach((c) => { c.width = size * dpr; c.height = size * dpr; c.style.width = c.style.height = size + "px"; });
  const bctx = bg.getContext("2d"), ictx = ink.getContext("2d");
  bctx.scale(dpr, dpr); ictx.scale(dpr, dpr);
  const lineW = Math.max(7, size * 0.04);
  const strokes = [];
  let cur = null;

  // Pulsing dot on the letter's head = where to start writing
  const dot = host.querySelector(".start-dot");
  const found = findHead(ch, size);
  const head = found && !found.unsure ? found : null;
  function showDot(on) {
    if (!head || !on) return dot.classList.add("hidden");
    const d = Math.max(26, head.r * 2 + 16);
    Object.assign(dot.style, { left: head.x - d / 2 + "px", top: head.y - d / 2 + "px", width: d + "px", height: d + "px" });
    dot.classList.remove("hidden", "dim");
  }
  function drawBackground(showGuide, color = "rgba(20,184,166,.28)") {
    bctx.clearRect(0, 0, size, size);
    // writing lines
    bctx.strokeStyle = "#e5e7eb"; bctx.lineWidth = 1.5; bctx.setLineDash([6, 6]);
    [0.25, 0.5, 0.75].forEach((f) => { bctx.beginPath(); bctx.moveTo(10, size * f); bctx.lineTo(size - 10, size * f); bctx.stroke(); });
    bctx.setLineDash([]);
    if (showGuide) drawGlyph(bctx, ch, size, color);
  }
  function redraw() {
    ictx.clearRect(0, 0, size, size);
    ictx.lineCap = ictx.lineJoin = "round";
    ictx.strokeStyle = "#1f2937";
    ictx.lineWidth = lineW;
    strokes.forEach((s) => {
      ictx.beginPath();
      s.forEach((p, i) => (i ? ictx.lineTo(p.x, p.y) : ictx.moveTo(p.x, p.y)));
      if (s.length === 1) ictx.lineTo(s[0].x + 0.1, s[0].y + 0.1);
      ictx.stroke();
    });
  }
  const pos = (e) => { const r = ink.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  ink.addEventListener("pointerdown", (e) => {
    if (pad.locked) return;
    e.preventDefault();
    ink.setPointerCapture(e.pointerId);
    cur = [pos(e)];
    strokes.push(cur);
    dot.classList.add("dim");
    redraw();
    pad.onchange && pad.onchange();
  });
  ink.addEventListener("pointermove", (e) => {
    if (!cur) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    // draw only the new piece of the line (redrawing everything each move gets slow)
    ictx.lineCap = ictx.lineJoin = "round";
    ictx.strokeStyle = "#1f2937";
    ictx.lineWidth = lineW;
    ictx.beginPath();
    const last = cur[cur.length - 1];
    ictx.moveTo(last.x, last.y);
    evs.forEach((ev) => { const p = pos(ev); cur.push(p); ictx.lineTo(p.x, p.y); });
    ictx.stroke();
  });
  const end = () => { cur = null; };
  ink.addEventListener("pointerup", end);
  ink.addEventListener("pointercancel", end);
  ink.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  drawBackground(guide);
  showDot(guide);
  const pad = {
    hasHead: !!head,
    size, ink, onchange: null, locked: false,
    isEmpty: () => strokes.length === 0,
    clear() { strokes.length = 0; redraw(); dot.classList.remove("dim"); pad.onchange && pad.onchange(); },
    undo() { strokes.pop(); redraw(); pad.onchange && pad.onchange(); },
    showGuide(on) { drawBackground(on); showDot(on); },
    showAnswer(good) { drawBackground(true, good ? "rgba(34,197,94,.35)" : "rgba(239,68,68,.30)"); showDot(false); },
    score() {
      const n = 200, k = n / size;
      const c = document.createElement("canvas");
      c.width = c.height = n;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.lineCap = x.lineJoin = "round";
      x.lineWidth = lineW * k;
      strokes.forEach((st) => {
        x.beginPath();
        st.forEach((p, i) => (i ? x.lineTo(p.x * k, p.y * k) : x.moveTo(p.x * k, p.y * k)));
        if (st.length === 1) x.lineTo(st[0].x * k + 0.1, st[0].y * k + 0.1);
        x.stroke();
      });
      const r = scoreHandwriting(c, ch);
      c.width = c.height = 0;
      return r;
    },
    strokes,
  };
  return pad;
}

// Draw a letter centered in a square box.
// Just the tone mark of e.g. "อ๋": draw it on อ, then erase the อ.
// (Drawing a mark alone makes fonts show a dotted-circle placeholder.)
const markCache = {};
function markOnly(full, color) {
  const key = full + color;
  if (markCache[key]) return markCache[key];
  const W = 600, c = document.createElement("canvas");
  c.width = c.height = W;
  const x = c.getContext("2d");
  x.font = `${W * 0.6}px ${GLYPH_FONT}`;
  x.fillStyle = "#000";
  x.fillText(full, W * 0.2, W * 0.8);
  x.globalCompositeOperation = "destination-out";
  x.lineWidth = 6;
  x.fillText(full[0], W * 0.2, W * 0.8);
  x.strokeText(full[0], W * 0.2, W * 0.8);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = color;
  x.fillRect(0, 0, W, W);
  // find the remaining ink
  const d = x.getImageData(0, 0, W, W).data;
  let x0 = W, y0 = W, x1 = -1, y1 = -1;
  for (let yy = 0; yy < W; yy += 2) for (let xx = 0; xx < W; xx += 2)
    if (d[(yy * W + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
  return (markCache[key] = { canvas: c, box: x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 2, h: y1 - y0 + 2 } });
}

// Where and how big to draw a letter so its ink fills ~60% of the box, centered.
function glyphLayout(ctx, ch, size) {
  const base = size * 0.62;
  ctx.font = `${base}px ${GLYPH_FONT}`;
  let m = ctx.measureText(ch);
  const inkW = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) || base * 0.6;
  const inkH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || base * 0.7;
  const fs = base * Math.min((size * 0.6) / inkH, (size * 0.8) / inkW, 3);
  ctx.font = `${fs}px ${GLYPH_FONT}`;
  m = ctx.measureText(ch);
  return {
    fs,
    x: size / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
    y: size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
  };
}

function drawGlyph(ctx, ch, size, color) {
  if (ch.startsWith("MARK:")) {
    const { canvas, box } = markOnly(ch.slice(5), color);
    if (!box) return;
    const k = Math.min((size * 0.6) / box.h, (size * 0.6) / box.w);
    const w = box.w * k, h = box.h * k;
    ctx.drawImage(canvas, box.x, box.y, box.w, box.h, (size - w) / 2, (size - h) / 2, w, h);
    return;
  }
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const { x, y } = glyphLayout(ctx, ch, size);
  ctx.fillText(ch, x, y);
  ctx.restore();
}

/* ---------- Start point: the "head" ----------
   Thai letters that have a head (the little circle) are written starting at the head.
   We find it from the font itself: the head is the smallest enclosed hole in the shape.
   For a vowel written before the consonant (เ แ โ ไ ใ) that vowel is written first,
   so we look at the first character only. No head found → no start dot (no guessing). */
// Letters with more than one loop where we're not sure which loop is the head.
// They get no dot rather than a guess.
const UNSURE_HEAD = new Set(["ม", "ฆ", "ฌ", "ฎ", "ฏ", "ฐ", "ฒ", "ไ", "ใ"]);

const headCache = {};
function findHead(ch, size) {
  const key = ch + "@" + size;
  if (key in headCache) return headCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (ch.startsWith("MARK:")) {
    drawGlyph(ctx, ch, size, "#000");
  } else {
    // draw only the first character, exactly where it sits in the full shape
    const { x, y } = glyphLayout(ctx, ch, size);
    ctx.fillStyle = "#000";
    ctx.fillText(ch[0], x, y);
  }
  const holes = findHoles(ctx.getImageData(0, 0, size, size).data, size);
  c.width = c.height = 0; // free the memory right away
  let head = null;
  if (holes.length && UNSURE_HEAD.has(ch[0])) head = { unsure: true };
  else if (holes.length === 1) head = holes[0];
  else if (holes.length > 1) head = holes.sort((a, b) => a.x - b.x)[0]; // the head is the left-hand loop
  return (headCache[key] = head);
}

function findHoles(data, n) {
  const ink = new Uint8Array(n * n);
  let x0 = n, y0 = n, x1 = -1, y1 = -1;
  for (let i = 0; i < n * n; i++) if (data[i * 4 + 3] > 100) {
    ink[i] = 1;
    const x = i % n, y = (i / n) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return null;
  const glyphArea = (x1 - x0 + 1) * (y1 - y0 + 1);
  // label background regions; anything not connected to the border is a hole
  const label = new Int32Array(n * n).fill(-1);
  const holes = [];
  const stack = [];
  for (let start = 0; start < n * n; start++) {
    if (ink[start] || label[start] !== -1) continue;
    const id = holes.length;
    let area = 0, sx = 0, sy = 0, border = false;
    stack.push(start); label[start] = id;
    while (stack.length) {
      const i = stack.pop(), x = i % n, y = (i / n) | 0;
      area++; sx += x; sy += y;
      if (x === 0 || y === 0 || x === n - 1 || y === n - 1) border = true;
      const nb = [x > 0 ? i - 1 : -1, x < n - 1 ? i + 1 : -1, y > 0 ? i - n : -1, y < n - 1 ? i + n : -1];
      for (const j of nb) if (j >= 0 && !ink[j] && label[j] === -1) { label[j] = id; stack.push(j); }
    }
    holes.push({ area, cx: sx / area, cy: sy / area, border });
  }
  return holes
    .filter((h) => !h.border && h.area >= glyphArea * 0.002 && h.area <= glyphArea * 0.08)
    .map((h) => ({ x: h.cx, y: h.cy, r: Math.sqrt(h.area / Math.PI) }));
}

// Turn the inked pixels of a canvas into a GRID×GRID map, scaled to fit its own
// bounding box (so where you draw and how big doesn't matter — only the shape).
function inkToGrid(canvas) {
  const w = canvas.width, h = canvas.height;
  const data = canvas.getContext("2d").getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  const step = 2;
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (data[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.max(bw, bh);
  const ox = x0 - (side - bw) / 2, oy = y0 - (side - bh) / 2;
  const grid = new Uint8Array(GRID * GRID);
  for (let y = y0; y <= y1; y += step)
    for (let x = x0; x <= x1; x += step)
      if (data[(y * w + x) * 4 + 3] > 40) {
        const gx = Math.min(GRID - 1, Math.floor(((x - ox) / side) * GRID));
        const gy = Math.min(GRID - 1, Math.floor(((y - oy) / side) * GRID));
        grid[gy * GRID + gx] = 1;
      }
  return { grid, extent: side / Math.max(w, h) };
}

// Distance (in grid cells) from every cell to the nearest inked cell.
function distanceMap(g) {
  const D = new Float32Array(g.length).fill(1e9);
  const q = [];
  for (let i = 0; i < g.length; i++) if (g[i]) { D[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % GRID, y = (i / GRID) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const j = ny * GRID + nx;
      if (D[j] > D[i] + 1) { D[j] = D[i] + 1; q.push(j); }
    }
  }
  return D;
}

const glyphCache = {};
function glyphGrid(ch) {
  if (glyphCache[ch]) return glyphCache[ch];
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  drawGlyph(c.getContext("2d", { willReadFrequently: true }), ch, 256, "#000");
  const grid = inkToGrid(c).grid;
  c.width = c.height = 0; // free the memory right away
  return (glyphCache[ch] = { grid, dist: distanceMap(grid) });
}

// Compare a drawing with the real letter. Measures how far your ink strays from the
// letter AND how much of the letter your ink misses; the worse of the two counts.
// Returns a 0..1 score (1 = perfect).
function scoreHandwriting(canvas, ch) {
  const u = inkToGrid(canvas);
  if (!u) return { score: 0, empty: true };
  if (u.extent < 0.15) return { score: 0, tooSmall: true };
  const g = glyphGrid(ch);
  const uDist = distanceMap(u.grid);
  let stray = 0, nu = 0, miss = 0, ng = 0;
  for (let i = 0; i < u.grid.length; i++) {
    if (u.grid[i]) { stray += g.dist[i]; nu++; }
    if (g.grid[i]) { miss += uDist[i]; ng++; }
  }
  const worst = Math.max(stray / nu, miss / ng); // average cells off
  return { score: Math.max(0, Math.min(1, 1 - worst / 3.2)), stray: stray / nu, miss: miss / ng };
}

/* =========================================================
   Letter exercises
   ========================================================= */
const TRACE_PASS = 0.65; // calibrated: ~99% of correct letters pass, ~13% of wrong ones
const WRITE_PASS = 0.59; // from memory is a little more forgiving

function letterDistractors(letter, n) {
  const group = LOOKALIKES.find((g) => g.includes(letter.ch)) || [];
  const tricky = shuffle(group.filter((c) => c !== letter.ch && LETTER_BY[c])).map((c) => LETTER_BY[c]);
  const others = shuffle(ALL_LETTERS.filter((l) => l.kind === letter.kind && l !== letter && !tricky.includes(l)));
  const out = [];
  for (const l of [...tricky, ...others]) {
    if (out.length >= n) break;
    if (l.sound === letter.sound) continue; // avoid two right answers (e.g. ไ and ใ are both "ai")
    if (!out.includes(l)) out.push(l);
  }
  return out;
}

function letterChoiceExercise(letter, type) {
  return { type, word: letter, options: shuffle([letter, ...letterDistractors(letter, 3)]) };
}

function buildLetterLesson(setIdx) {
  const letters = LETTER_SETS[setIdx].letters;
  const queue = [];
  letters.forEach((l) => {
    queue.push({ type: "letterIntro", word: l });
    queue.push({ type: "trace", word: l, guide: true });
  });
  const practice = [];
  letters.forEach((l) => {
    practice.push(letterChoiceExercise(l, pick(["letterSound", "soundLetter"])));
    practice.push({ type: "trace", word: l, guide: false });
  });
  shuffle(letters).slice(0, 3).forEach((l) => practice.push(letterChoiceExercise(l, "soundLetter")));
  queue.push(...shuffle(practice));
  return queue;
}

function buildHandwritingDrill() {
  const learned = ALL_LETTERS.filter(letterSeen);
  if (!learned.length) return null;
  return shuffle(learned).slice(0, 8).map((l) => ({ type: "trace", word: l, guide: false }));
}

function startLetterLesson(setIdx) {
  L = { u: null, l: null, letterSet: setIdx, queue: buildLetterLesson(setIdx), i: 0, progress: 0, mistakes: 0, answered: 0, practice: true, drill: null, speakScores: [], started: Date.now() };
  L.total = L.queue.length;
  renderExercise();
}
function startHandwritingDrill() {
  const queue = buildHandwritingDrill();
  if (!queue) return toast("Learn a letter set first, then come back to practice writing them! ✍️");
  L = { u: null, l: null, letterSet: null, queue, i: 0, total: queue.length, progress: 0, mistakes: 0, answered: 0, practice: true, drill: "hand", speakScores: [], started: Date.now() };
  renderExercise();
}
function startSingleLetter(letter) {
  L = { u: null, l: null, letterSet: null, queue: [{ type: "trace", word: letter, guide: true }, { type: "trace", word: letter, guide: true }, { type: "trace", word: letter, guide: false }], i: 0, total: 3, progress: 0, mistakes: 0, answered: 0, practice: true, drill: "hand", speakScores: [], started: Date.now() };
  renderExercise();
}

const KIND_NAME = { consonant: "letter", vowel: "vowel", tone: "tone mark" };
// What gets drawn on the pad: lone tone marks are drawn without the อ so the
// mark itself is what you trace (otherwise the อ would do all the work).
const traceTarget = (l) => (l.kind === "tone" ? "MARK:" + l.ch : l.ch);

/* ----- Intro cards ----- */
function letterInfoHtml(l) {
  if (l.kind === "vowel") {
    const len = l.length === "special" ? "combo vowel" : `${l.length} vowel`;
    return `
      <span class="rom">${l.sound}</span>
      <div class="en">Sounds like: <b>${esc(l.sound)}</b> · ${len}</div>
      <div class="letter-hint">${esc(l.hint)}</div>
      <div class="letter-word">e.g. <span class="thai">${l.word}</span> ${l.wordRom} = ${esc(l.meaning)}</div>`;
  }
  if (l.kind === "tone") {
    return `
      <span class="rom">${l.rom}</span>
      <div class="en">Gives a <b>${l.tone} tone</b> on mid-class letters</div>
      <div class="letter-word">e.g. <span class="thai">${l.word}</span> ${l.wordRom} = ${esc(l.meaning)}</div>`;
  }
  return `
    <span class="rom">${l.rom}</span>
    <div class="en">Sound: <b>${esc(l.sound)}</b></div>
    <div class="letter-word"><span class="thai">${l.word}</span> = ${esc(l.meaning)}</div>`;
}
const LETTER_TIPS = {
  consonant: (l) => `Each letter has a picture word, like “A for apple”. Thais say <b>${l.rom}</b> to name it.`,
  vowel: () => `The <span class="thai">อ</span> is just a placeholder showing where the vowel sits. Vowels can go before, after, above or below a consonant — but you always <b>say the consonant first</b>.`,
  tone: () => `Tone marks sit above the consonant. On mid-class letters (teal in the chart): no mark = mid, <span class="thai">่</span> low, <span class="thai">้</span> falling, <span class="thai">๊</span> high, <span class="thai">๋</span> rising. Other classes work a bit differently — that's a later lesson.`,
};

function renderLetterIntro(ex) {
  const l = ex.word;
  const badge = l.kind === "consonant" ? `NEW LETTER · ${CLASS_NOTE[l.cls].toUpperCase()}`
    : l.kind === "vowel" ? `NEW VOWEL · ${l.length === "special" ? "COMBO" : l.length.toUpperCase()}` : "NEW TONE MARK";
  lessonShell(`
    <div class="prompt-title">New ${KIND_NAME[l.kind]}!</div>
    <div class="intro">
      <span class="badge">${badge}</span>
      <div class="big thai letter-big">${l.ch}</div>
      ${letterInfoHtml(l)}
      <div class="speak-row">
        <button class="speak-btn speak-big" id="say">🔊</button>
        <button class="speak-btn slow speak-big" id="slow" style="width:80px">🐢</button>
        ${l.kind === "vowel" ? `<button class="speak-btn slow speak-big word-say" id="sayword"><span class="thai">${l.word}</span></button>` : ""}
      </div>
      <p class="letter-tip">${LETTER_TIPS[l.kind](l)}</p>
    </div>`, `<button class="btn" id="next">Continue</button>`);
  $("#say").onclick = () => speak(l.say);
  $("#slow").onclick = () => speak(l.say, true);
  if (l.kind === "vowel") $("#sayword").onclick = () => speak(l.word);
  speak(l.say);
  $("#next").onclick = () => { markLetterSeen(l); L.progress++; L.i++; renderExercise(); };
}

/* ----- Choice quizzes ----- */
function renderLetterSound(ex) {
  const l = ex.word;
  const title = l.kind === "vowel" ? "What does this vowel sound like?"
    : l.kind === "tone" ? "Which tone does this mark give (on a mid-class letter)?" : "What sound does this letter make?";
  choiceExercise(ex, {
    title,
    prompt: `<div class="letter-prompt thai">${l.ch}</div>`,
    optionHtml: (o) => `<span>${o.optLabel}</span>`,
    onRender: () => {},
  });
}
function renderSoundLetter(ex) {
  const l = ex.word;
  const hint = l.kind === "consonant" ? `<span class="rom" style="font-size:16px">${l.rom}</span><span class="en-hint thai">${l.word}</span>`
    : l.kind === "vowel" ? `<span class="rom" style="font-size:16px">${l.sound}</span>`
    : `<span class="rom" style="font-size:16px">${l.wordRom}</span><span class="en-hint">${esc(l.meaning)}</span>`;
  choiceExercise(ex, {
    title: esc(l.question),
    prompt: `<div class="speech"><div class="mascot">🐘</div><div class="bubble"><button class="speak-btn" id="say">🔊</button><div>${hint}</div></div></div>`,
    grid: true,
    optionHtml: (o) => `<span class="thai letter-option ${o.kind !== "consonant" ? "wide" : ""}">${o.ch}</span>`,
    onRender: () => { $("#say").onclick = () => speak(l.say); speak(l.say); },
  });
}

/* ----- Trace / write from memory ----- */
function renderTrace(ex) {
  const l = ex.word;
  const guide = ex.guide;
  const kind = KIND_NAME[l.kind];
  const headInfo = findHead(traceTarget(l), 300);
  const hasHead = !!headInfo && !headInfo.unsure;
  const dotTip = hasHead ? "Start at the pulsing dot — that's the head (little circle). Thai letters begin at their head."
    : headInfo && headInfo.unsure ? "We're not sure which loop this one starts from, so there's no dot — ask a Thai writer to show you."
    : "This one has no head (little circle), so there's no start dot.";
  const startTip = l.kind === "tone" ? `Draw just the tone mark, nice and big. ${hasHead ? "Start at the dot." : ""}`
    : l.kind === "vowel" ? (!hasHead ? `${dotTip} Trace the อ too — it shows where the vowel sits.`
      : l.ch[0] === "อ" ? "Write the consonant (อ) first, starting at the dot (its head), then add the vowel."
      : "This vowel is written before the consonant, so start with it — at the dot. Then write the อ.")
    : dotTip;
  lessonShell(`
    <div class="prompt-title">${guide ? `Trace the ${kind}` : `Write the ${kind} from memory`}</div>
    <div class="trace-head">
      <button class="speak-btn" id="say">🔊</button>
      <div>${guide ? `<span class="thai trace-ch">${l.ch}</span> ` : ""}${l.traceLabel}</div>
    </div>
    <div class="pad-host" id="pad"></div>
    <div class="pad-tools">
      <button class="btn ghost" id="undo">↩︎ Undo</button>
      <button class="btn ghost" id="clear">✕ Clear</button>
      ${guide ? "" : `<button class="btn ghost" id="hint">💡 Hint</button>`}
    </div>
    <div class="heard" id="pad-msg">${guide ? startTip : `Draw it big in the box. Tap 💡 if you're stuck.${l.kind === "tone" ? " Just the mark — no อ needed." : ""}`}</div>`, checkFooter());
  $("#say").onclick = () => speak(l.say);
  speak(l.say);
  const pad = createPad($("#pad"), { guide, ch: traceTarget(l) });
  const msg = $("#pad-msg");
  let attempts = 0, hinted = false;
  pad.onchange = () => ($("#check").disabled = pad.isEmpty());
  $("#undo").onclick = () => pad.undo();
  $("#clear").onclick = () => pad.clear();
  if (!guide) $("#hint").onclick = () => { hinted = true; pad.showGuide(true); msg.textContent = "Hint on — trace over it, then try it from memory next time."; };
  $("#check").onclick = () => {
    const r = pad.score();
    if (r.empty) return;
    if (r.tooSmall) { msg.className = "heard off"; msg.textContent = "Draw it bigger — fill most of the box."; return; }
    // Tone marks are simple shapes (้ and ๊ look alike once scaled up), so they need a closer match.
    const pass = l.kind === "tone" ? (guide || hinted ? 0.74 : 0.7) : guide || hinted ? TRACE_PASS : WRITE_PASS;
    const pct = Math.round(r.score * 100);
    attempts++;
    if (r.score >= pass) {
      pad.locked = true;
      pad.showAnswer(true);
      markLetterSeen(l);
      return feedback(true, ex, `<span class="thai">${l.ch}</span> ${l.rom} — ${pct}% match`);
    }
    if (attempts >= 3) {
      pad.locked = true;
      pad.showAnswer(false);
      return feedback(false, ex, `<span class="thai">${l.ch}</span> ${l.rom} — compare your drawing with the red ${kind}`, false, { noPenalty: true, noRetry: true });
    }
    msg.className = `heard ${r.score >= pass - 0.15 ? "close" : "off"}`;
    msg.textContent = `${r.score >= pass - 0.15 ? "👍 Close!" : "🔁 Not quite."} ${pct}% match — attempt ${attempts} of 3. Clear and try again${guide ? `, following the faint ${kind}` : ""}.`;
    if (!guide && attempts >= 2 && !hinted) { pad.showGuide(true); hinted = true; msg.textContent += " (Hint shown.)"; }
  };
}

/* =========================================================
   Letters tab
   ========================================================= */
const SECTION_INFO = {
  consonant: ["Consonants", "42 letters in 7 sets — most useful first."],
  vowel: ["Vowels", "Written around the consonant. อ shows where they go."],
  tone: ["Tone marks", "Small marks above a letter that change its pitch."],
};

function lettersView() {
  const learned = ALL_LETTERS.filter(letterSeen).length;
  const pct = Math.round((learned / ALL_LETTERS.length) * 100);
  let html = `
    <div class="goal-card">
      <div class="mascot thai" style="font-size:44px;color:var(--brand)">ก</div>
      <div class="goal-text">
        <b>Thai alphabet: ${learned} / ${ALL_LETTERS.length}</b>
        <div class="bar"><div style="width:${pct}%;background:var(--brand)"></div></div>
      </div>
    </div>
    <div class="drills" style="grid-template-columns:1fr">
      <button class="drill-card write" id="hdrill"><span>✍️</span><b>Handwriting drill</b><small>Write letters, vowels and tone marks you've learned from memory</small></button>
    </div>`;
  ["consonant", "vowel", "tone"].forEach((group) => {
    const [title, sub] = SECTION_INFO[group];
    html += `<div class="section-title" style="margin-top:20px">${title}</div><p class="rom" style="margin-top:-8px">${sub}</p>`;
    LETTER_SETS.forEach((s, i) => {
      if (s.group !== group) return;
      const done = setDone(i);
      html += `<button class="set-card ${done ? "done" : ""}" data-set-idx="${i}">
        <div class="set-letters thai ${group !== "consonant" ? "wide" : ""}">${s.letters.map((l) => `<span class="${letterSeen(l) ? "seen" : ""}">${l.ch}</span>`).join("")}</div>
        <div class="set-meta"><b>${s.title}</b><small>${done ? "✓ Done · review" : "Tap to learn"}</small></div>
      </button>`;
    });
  });
  html += `<div class="section-title" style="margin-top:22px">Alphabet chart</div>
    <p class="rom" style="margin-top:-6px">Tap anything to hear it and practice writing it.</p>
    <div class="letter-grid">${LETTERS.map((l) => `<button class="letter-cell ${letterSeen(l) ? "seen" : ""} cls-${l.cls}" data-letter="${l.ch}"><span class="thai">${l.ch}</span><small>${esc(l.sound.length > 3 ? "–" : l.sound)}</small></button>`).join("")}</div>
    <div class="class-legend"><span class="cls-mid">Mid class</span><span class="cls-high">High class</span><span class="cls-low">Low class</span></div>
    <div class="letter-grid wide" style="margin-top:14px">${[...VOWELS, ...TONES].map((l) => `<button class="letter-cell ${letterSeen(l) ? "seen" : ""} kind-${l.kind}" data-letter="${l.ch}"><span class="thai">${l.ch}</span><small>${esc(l.kind === "tone" ? l.tone : l.sound + (l.length === "short" ? "·" : ""))}</small></button>`).join("")}</div>
    <p class="rom" style="text-align:center">Vowels marked · are short. The class of a consonant affects the tone of a syllable — you'll meet that later.</p>`;
  return html;
}

function bindLettersView() {
  const h = $("#hdrill");
  if (h) h.onclick = startHandwritingDrill;
  app.querySelectorAll("[data-set-idx]").forEach((b) => b.onclick = () => startLetterLesson(+b.dataset.setIdx));
  app.querySelectorAll("[data-letter]").forEach((b) => b.onclick = () => showLetter(LETTER_BY[b.dataset.letter]));
}

function showLetter(l) {
  const sub = l.kind === "consonant" ? ` · ${CLASS_NOTE[l.cls]}` : "";
  const m = modal(`
    <div style="text-align:center" class="letter-modal">
      <div class="thai letter-big">${l.ch}</div>
      ${letterInfoHtml(l)}
      ${sub ? `<div class="rom">${sub.slice(3)}</div>` : ""}
      <div class="speak-row" style="display:flex;gap:10px;justify-content:center;margin:12px 0">
        <button class="speak-btn speak-big" data-say="${l.say}">🔊</button>
        ${l.kind === "vowel" ? `<button class="speak-btn slow speak-big word-say" data-say="${l.word}"><span class="thai">${l.word}</span></button>` : ""}
      </div>
    </div>
    <button class="btn" id="practice-letter">✍️ Practice writing ${l.ch}</button>
    <button class="btn ghost" data-close>Close</button>`);
  speak(l.say);
  $("#practice-letter", m).onclick = () => { m.remove(); startSingleLetter(l); };
}
