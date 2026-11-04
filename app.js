"use strict";

/* =========================================================
   Thai Lingo — a small Duolingo-style app for learning Thai
   ========================================================= */

const MAX_HEARTS = 5;
const HEART_REFILL_MS = 30 * 60 * 1000; // one heart every 30 minutes
const DAILY_GOAL = 30;
const LESSONS_PER_UNIT = 3;
const STORE_KEY = "thai-lingo-v1";
const APP_VERSION = "1.4"; // shown in Profile; bump with CACHE in sw.js

/* ---------- Content index ---------- */
const WORDS = [];
const ROM = { ...EXTRA_ROM };
COURSE.forEach((unit, u) => {
  unit.words.forEach((w, i) => {
    w.id = `${unit.id}:${i}`;
    w.unit = u;
    WORDS.push(w);
    ROM[w.th] = w.rom;
  });
});

/* ---------- Persistent state ---------- */
const DEFAULT_STATE = {
  xp: 0,
  streak: 0,
  lastDay: null,
  todayXp: 0,
  todayDate: null,
  hearts: MAX_HEARTS,
  heartTime: Date.now(),
  done: {},   // "unitIdx-lessonIdx": true
  seen: {},   // word id: true
  gender: "m",
  showRom: true,
  sound: true,
  speakOn: true,       // speaking exercises enabled
  speakOffUntil: 0,    // "Can't speak now" pauses them until this time
  lessonsCompleted: 0,
};
let S = load();

function load() {
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }

const today = () => new Date().toLocaleDateString("en-CA");
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString("en-CA"); };

function refreshDaily() {
  if (S.todayDate !== today()) { S.todayDate = today(); S.todayXp = 0; }
  if (S.lastDay && S.lastDay !== today() && S.lastDay !== yesterday()) S.streak = 0;
  // heart regeneration
  if (S.hearts < MAX_HEARTS) {
    const gained = Math.floor((Date.now() - S.heartTime) / HEART_REFILL_MS);
    if (gained > 0) {
      S.hearts = Math.min(MAX_HEARTS, S.hearts + gained);
      S.heartTime += gained * HEART_REFILL_MS;
    }
  } else {
    S.heartTime = Date.now();
  }
  save();
}

/* ---------- Helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const normEn = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, "").replace(/\s+/g, " ").trim();
const PARTICLES = ["ครับ", "ค่ะ", "นะ"];

// Swap male sentence forms for female ones when needed.
function genderize(tokens) {
  if (S.gender !== "f") return tokens;
  return tokens.map((t) => (t === "ผม" ? "ฉัน" : t === "ครับ" ? "ค่ะ" : t));
}
const romOf = (t) => ROM[t] || "";
const romLine = (tokens) => tokens.map(romOf).join(" ");

/* ---------- Speech ---------- */
let thaiVoice = null;
function findVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  thaiVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("th")) || null;
}
if ("speechSynthesis" in window) {
  findVoice();
}
const hasAudio = () => !!thaiVoice;

function speak(text, slow = false) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH";
  if (thaiVoice) u.voice = thaiVoice;
  u.rate = slow ? 0.5 : 0.85;
  speechSynthesis.speak(u);
}

/* ---------- Speech recognition (pronunciation check) ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const speakSupported = () => !!SR;
const canSpeak = () => speakSupported() && S.speakOn && Date.now() > (S.speakOffUntil || 0);
let rec = null;

// Listen once in Thai. Calls onInterim(text) while talking and onDone(alternatives) at the end.
function recognize({ onInterim, onDone, onError }) {
  stopRecognizing();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const r = new SR();
  rec = r;
  r.lang = "th-TH";
  r.interimResults = true;
  r.maxAlternatives = 5;
  r.continuous = false;
  let results = null, errored = false;
  const safety = setTimeout(() => { try { r.stop(); } catch {} }, 8000);
  r.onresult = (e) => {
    results = e.results;
    onInterim && onInterim([...e.results].map((x) => x[0].transcript).join(""));
  };
  r.onerror = (e) => { errored = true; clearTimeout(safety); if (e.error !== "aborted") onError && onError(e.error); };
  r.onend = () => {
    clearTimeout(safety);
    if (rec === r) rec = null;
    if (errored) return;
    const alts = new Set();
    if (results) {
      const n = Math.max(...[...results].map((x) => x.length));
      for (let k = 0; k < n; k++) alts.add([...results].map((x) => x[Math.min(k, x.length - 1)].transcript).join(""));
    }
    onDone([...alts].filter(Boolean));
  };
  try { r.start(); } catch (err) { errored = true; onError && onError("start-failed"); }
}
function stopRecognizing() { if (rec) { const r = rec; rec = null; try { r.abort(); } catch {} } }

// Normalize Thai text so recognizer output can be compared with the lesson text.
const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
const ONES = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
function numToThai(str) {
  const n = parseInt(str.replace(/[๐-๙]/g, (d) => THAI_DIGITS.indexOf(d)), 10);
  if (isNaN(n) || n > 99) return str;
  if (n === 0) return "ศูนย์";
  if (n < 10) return ONES[n];
  const t = Math.floor(n / 10), u = n % 10;
  return (t === 1 ? "" : t === 2 ? "ยี่" : ONES[t]) + "สิบ" + (u === 1 ? "เอ็ด" : ONES[u]);
}
const normTh = (s) => s.replace(/[0-9๐-๙]+/g, numToThai).replace(/[\s​.,!?'"ๆ-]/g, "");

function lev(a, b) {
  a = [...a]; b = [...b];
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const similarity = (a, b) => (!a.length && !b.length ? 1 : 1 - lev(a, b) / Math.max([...a].length, [...b].length));

// Best match between what was heard and any accepted form of the target.
function scoreSpeech(targets, heardAlts) {
  let best = { score: 0, heard: heardAlts[0] || "" };
  const forms = new Set();
  targets.forEach((t) => {
    forms.add(normTh(t.join("")));
    forms.add(normTh(t.filter((x) => !PARTICLES.includes(x)).join("")));
  });
  heardAlts.forEach((h) => forms.forEach((f) => {
    const sc = similarity(normTh(h), f);
    if (sc > best.score) best = { score: sc, heard: h };
  }));
  return best;
}

const SPEECH_ERRORS = {
  "not-allowed": "Microphone access was blocked. iPhone: Settings → Safari → Microphone → Allow (or tap “aA” in the address bar → Website Settings). Computer: allow the mic from the icon in the address bar. If you opened index.html as a file, use the “Start Thai Lingo” launcher instead.",
  "service-not-allowed": "Speech recognition isn't allowed here. iPhone: Settings → General → Keyboard → turn on Enable Dictation (and allow the microphone for Safari). Mac Safari: System Settings → Keyboard → Dictation. If you opened Thai Lingo from the Home Screen, try it in Safari instead.",
  "no-speech": "I didn't hear anything. Tap the mic and speak a little louder.",
  "audio-capture": "No microphone found. Check that your Mac's microphone is working.",
  "network": "Speech recognition needs an internet connection. Check your connection and try again.",
  "language-not-supported": "This browser can't recognize Thai. Try Google Chrome.",
  "start-failed": "Couldn't start the microphone. Try again.",
};

/* ---------- Sound effects ---------- */
let audioCtx = null;
function audio() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
// One note with a soft attack and decay.
function tone(ctx, out, freq, start, dur, type = "sine", vol = 0.15) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + dur + 0.05);
}
function beep(type) {
  if (!S.sound) return;
  try {
    const ctx = audio();
    const out = ctx.createDynamicsCompressor();
    out.connect(ctx.destination);
    const t = ctx.currentTime + 0.03;
    if (type === "good") {
      tone(ctx, out, 660, t, 0.15);
      tone(ctx, out, 880, t + 0.09, 0.25);
    } else if (type === "bad") {
      tone(ctx, out, 220, t, 0.18, "sawtooth", 0.05);
      tone(ctx, out, 180, t + 0.1, 0.22, "sawtooth", 0.05);
    } else {
      // Reward fanfare: rising arpeggio, a big major chord, then sparkles
      const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
      [C5, E5, G5].forEach((f, i) => tone(ctx, out, f, t + i * 0.11, 0.22, "triangle", 0.22));
      const chord = t + 0.36;
      [C5, E5, G5, C6].forEach((f) => tone(ctx, out, f, chord, 1.2, "triangle", 0.13));
      tone(ctx, out, C5 / 2, chord, 1.2, "sine", 0.18);
      const sparkle = type === "perfect" ? [2093, 2637, 3136, 4186, 3136, 4186] : [2093, 2637, 3136];
      sparkle.forEach((f, i) => tone(ctx, out, f, chord + 0.15 + i * 0.08, 0.3, "sine", 0.06));
    }
  } catch { /* ignore */ }
}

// Confetti burst for finishing a lesson
function confetti() {
  const colors = ["#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899", "#22c55e", "#0ea5e9"];
  const box = document.createElement("div");
  box.className = "confetti";
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = pick(colors);
    p.style.animationDelay = Math.random() * 0.4 + "s";
    p.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
    p.style.setProperty("--drift", (Math.random() * 160 - 80) + "px");
    p.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3500);
}

/* ---------- Progress helpers ---------- */
const isDone = (u, l) => !!S.done[`${u}-${l}`];
const unitComplete = (u) => [...Array(LESSONS_PER_UNIT).keys()].every((l) => isDone(u, l));
function isUnlocked(u, l) {
  if (u === 0 && l === 0) return true;
  if (l > 0) return isDone(u, l - 1);
  return unitComplete(u - 1);
}
function currentLesson() {
  for (let u = 0; u < COURSE.length; u++)
    for (let l = 0; l < LESSONS_PER_UNIT; l++)
      if (!isDone(u, l)) return [u, l];
  return null;
}

/* =========================================================
   Lesson generation
   ========================================================= */
function distractors(word, n, pool) {
  const out = [];
  const used = new Set([word.en, word.th]);
  for (const w of shuffle(pool)) {
    if (out.length >= n) break;
    if (used.has(w.en) || used.has(w.th)) continue;
    used.add(w.en); used.add(w.th);
    out.push(w);
  }
  return out;
}

// Split Thai into letter clusters (a consonant plus its above/below vowel and tone marks).
const COMBINING = /[ัิ-ฺ็-๎]/;
function thaiClusters(s) {
  const out = [];
  for (const ch of s) {
    if (COMBINING.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}
// Words with a plain meaning (not grammar particles like “polite ending (male)”)
const plainMeaning = (w) => !/\((?!\d)/.test(w.en);
const canSpell = (w) => { const n = thaiClusters(w.th).length; return n >= 2 && n <= 7; };

function spellExercise(word) {
  const letters = thaiClusters(word.th);
  const others = shuffle(WORDS.filter((w) => w !== word).flatMap((w) => thaiClusters(w.th)).filter((c) => !letters.includes(c)));
  const extra = [...new Set(others)].slice(0, Math.min(4, Math.max(2, 8 - letters.length)));
  return { type: "spell", word, letters, bank: shuffle([...letters, ...extra]) };
}

function speakWordExercise(word) {
  return { type: "speak", word, tokens: [word.th], en: word.en, targets: [[word.th]] };
}
function speakSentenceExercise(sent) {
  const tokens = genderize(sent.th.split(" "));
  const targets = [tokens, ...(sent.altTh || []).map((a) => genderize(a.split(" ")))];
  return { type: "speak", sent, tokens, en: sent.en, targets };
}

function wordExercise(word, pool, forceType) {
  const types = ["meaning", "pickThai"];
  if (hasAudio()) types.push("listen");
  if (S.seen[word.id] && plainMeaning(word)) types.push("typeEn");
  if (S.seen[word.id] && canSpell(word)) types.push("spell");
  const type = forceType || pick(types);
  if (type === "spell") return spellExercise(word);
  if (type === "typeEn") return { type, word };
  // Prefer distractors from same unit, then fall back to whole course
  let ds = distractors(word, 3, pool);
  if (ds.length < 3) ds = ds.concat(distractors(word, 3 - ds.length, WORDS.filter((w) => !ds.includes(w))));
  return { type, word, options: shuffle([word, ...ds]) };
}

function sentenceExercise(sent, unitIdx, forceType) {
  const tokens = genderize(sent.th.split(" "));
  const enWords = sent.en.split(" ");
  const canEn = enWords.length >= 2;
  const type = forceType || (canEn && Math.random() < 0.5 ? "buildEn" : "buildTh");
  if (type === "buildTh") {
    // distractor tiles: Thai words from this unit not in the answer
    const extra = shuffle(COURSE[unitIdx].words.map((w) => w.th).filter((t) => !tokens.includes(t))).slice(0, Math.max(2, 6 - tokens.length));
    return { type, sent, tokens, bank: shuffle([...tokens, ...extra]) };
  }
  const pool = new Set();
  COURSE.forEach((u) => u.sentences.forEach((s) => s.en.toLowerCase().split(" ").forEach((w) => pool.add(w))));
  const lower = enWords.map((w) => w.toLowerCase());
  const extra = shuffle([...pool].filter((w) => !lower.includes(w))).slice(0, Math.max(3, 7 - lower.length));
  return { type, sent, tokens, answer: lower, bank: shuffle([...lower, ...extra]) };
}

function matchExercise(words) {
  const ws = shuffle(words).slice(0, 5);
  return { type: "match", words: ws };
}

function buildLesson(u, l) {
  const unit = COURSE[u];
  const words = unit.words.map((w, i) => WORDS.find((x) => x.id === `${unit.id}:${i}`));
  const half = Math.ceil(words.length / 2);
  const queue = [];
  let focus, sentences;

  if (l === 0) { focus = words.slice(0, half); sentences = []; }
  else if (l === 1) { focus = words.slice(half); sentences = unit.sentences.slice(0, Math.ceil(unit.sentences.length / 2)); }
  else { focus = shuffle(words).slice(0, 6); sentences = unit.sentences; }

  // Introduce new words first, interleaved with a quick check
  focus.forEach((w) => {
    if (!S.seen[w.id]) {
      queue.push({ type: "intro", word: w });
      queue.push(wordExercise(w, words, "meaning"));
    }
  });
  // Mixed practice
  const practice = [];
  focus.forEach((w) => practice.push(wordExercise(w, words)));
  if (l > 0) shuffle(words).slice(0, 3).forEach((w) => practice.push(wordExercise(w, words)));
  sentences.forEach((s) => practice.push(sentenceExercise(s, u)));
  // Writing: every lesson spells at least one word in Thai letters
  const spellable = focus.filter(canSpell);
  if (spellable.length) practice.push(spellExercise(pick(spellable)));
  // Speaking: say 2 words out loud, plus a sentence after the first lesson
  if (canSpeak()) {
    shuffle(focus.filter(plainMeaning)).slice(0, 2).forEach((w) => practice.push(speakWordExercise(w)));
    if (sentences.length) practice.push(speakSentenceExercise(pick(sentences)));
  }
  queue.push(...shuffle(practice));
  // Match pairs near the end
  const matchPool = l === 0 ? focus : words;
  if (matchPool.length >= 4) queue.splice(queue.length - 1, 0, matchExercise(matchPool));
  return queue;
}

// Writing-only drill: spell words in Thai letters, type meanings, build Thai sentences
function buildWriteDrill() {
  const learned = WORDS.filter((w) => S.seen[w.id]);
  if (learned.length < 3) return null;
  const queue = [];
  shuffle(learned.filter(canSpell)).slice(0, 4).forEach((w) => queue.push(spellExercise(w)));
  shuffle(learned.filter(plainMeaning)).slice(0, 3).forEach((w) => queue.push({ type: "typeEn", word: w }));
  const units = [...new Set(learned.map((w) => w.unit))];
  shuffle(units.flatMap((u) => COURSE[u].sentences.map((s) => [s, u]))).slice(0, 3)
    .forEach(([s, u]) => queue.push(sentenceExercise(s, u, "buildTh")));
  return shuffle(queue);
}

// Speaking-only drill from words and sentences already learned
function buildSpeakDrill() {
  const learned = WORDS.filter((w) => S.seen[w.id] && plainMeaning(w));
  if (!learned.length) return null;
  const queue = shuffle(learned).slice(0, 6).map(speakWordExercise);
  const units = [...new Set(learned.map((w) => w.unit))];
  shuffle(units.flatMap((u) => COURSE[u].sentences)).slice(0, 3).forEach((s) => queue.push(speakSentenceExercise(s)));
  return shuffle(queue);
}

function buildPractice() {
  const learned = WORDS.filter((w) => S.seen[w.id]);
  if (learned.length < 4) return null;
  const queue = shuffle(learned).slice(0, 8).map((w) => wordExercise(w, learned));
  const unitsStarted = [...new Set(learned.map((w) => w.unit))];
  const sents = [];
  unitsStarted.forEach((u) => COURSE[u].sentences.forEach((s) => sents.push([s, u])));
  shuffle(sents).slice(0, 3).forEach(([s, u]) => queue.push(sentenceExercise(s, u)));
  if (canSpeak()) shuffle(learned.filter(plainMeaning)).slice(0, 2).forEach((w) => queue.push(speakWordExercise(w)));
  queue.push(matchExercise(learned));
  return shuffle(queue);
}

/* =========================================================
   Rendering — home, words, profile
   ========================================================= */
let tab = "learn";
const app = $("#app");

function topbar() {
  return `
    <div class="topbar">
      <div class="brand">🐘 Thai Lingo</div>
      <div class="stats">
        <div class="stat streak" title="Day streak">🔥 ${S.streak}</div>
        <div class="stat xp" title="Total XP">⭐ ${S.xp}</div>
        <div class="stat hearts" title="Hearts">❤️ ${S.hearts}</div>
      </div>
    </div>`;
}

function nav() {
  const b = (id, ico, label) => `<button class="${tab === id ? "active" : ""}" data-tab="${id}"><span>${ico}</span>${label}</button>`;
  return `<nav class="nav">${b("learn", "🏠", "Learn")}${b("practice", "💪", "Practice")}${b("words", "📖", "Words")}${b("profile", "🐘", "Profile")}</nav>`;
}

function renderHome() {
  refreshDaily();
  let body = "";
  if (tab === "learn") body = learnView();
  else if (tab === "words") body = wordsView();
  else if (tab === "profile") body = profileView();
  app.innerHTML = topbar() + `<div class="main">${body}</div>` + nav();

  app.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => {
    if (b.dataset.tab === "practice") return startPractice();
    tab = b.dataset.tab; renderHome(); window.scrollTo(0, 0);
  });
  app.querySelectorAll("[data-lesson]").forEach((b) => b.onclick = () => {
    const [u, l] = b.dataset.lesson.split("-").map(Number);
    if (!isUnlocked(u, l)) return toast("🔒 Finish the previous lesson first!");
    startLesson(u, l);
  });
  app.querySelectorAll("[data-tip]").forEach((b) => b.onclick = () => showTip(+b.dataset.tip));
  app.querySelectorAll("[data-say]").forEach((b) => b.onclick = () => speak(b.dataset.say));
  app.querySelectorAll("[data-set]").forEach((b) => b.onclick = () => {
    const [k, v] = b.dataset.set.split("=");
    S[k] = v === "true" ? true : v === "false" ? false : v;
    if (k === "speakOn") S.speakOffUntil = 0;
    save(); renderHome();
  });
  const drill = $("#drill");
  if (drill) drill.onclick = startSpeakDrill;
  const wdrill = $("#wdrill");
  if (wdrill) wdrill.onclick = startWriteDrill;
  const upd = $("#update");
  if (upd) upd.onclick = () => forceUpdate(upd);
  const reset = $("#reset");
  if (reset) reset.onclick = () => {
    if (confirm("Reset ALL progress? This cannot be undone.")) { S = { ...DEFAULT_STATE, heartTime: Date.now() }; save(); tab = "learn"; renderHome(); }
  };
  const cur = $(".node.current");
  if (cur && tab === "learn" && !renderHome.scrolled) {
    renderHome.scrolled = true;
    if (cur.getBoundingClientRect().bottom > window.innerHeight - 90) cur.scrollIntoView({ block: "center" });
  }
}

function learnView() {
  const cur = currentLesson();
  const pct = Math.min(100, Math.round((S.todayXp / DAILY_GOAL) * 100));
  let html = `
    <div class="goal-card">
      <div class="mascot">🐘</div>
      <div class="goal-text">
        <b>Daily goal: ${Math.min(S.todayXp, DAILY_GOAL)} / ${DAILY_GOAL} XP ${S.todayXp >= DAILY_GOAL ? "✅" : ""}</b>
        <div class="bar"><div style="width:${pct}%"></div></div>
      </div>
    </div>`;
  if (!hasAudio()) html += audioWarning();
  const offsets = [0, 50, 0];
  COURSE.forEach((unit, u) => {
    const locked = !isUnlocked(u, 0);
    html += `<section class="unit ${locked ? "locked" : ""}">
      <div class="unit-header" style="background:${unit.color}">
        <div><small>UNIT ${u + 1}</small><h2>${unit.emoji} ${unit.title}</h2></div>
        <button class="tip-btn" data-tip="${u}">📒 Tips</button>
      </div>
      <div class="path">`;
    for (let l = 0; l < LESSONS_PER_UNIT; l++) {
      const done = isDone(u, l);
      const unlocked = isUnlocked(u, l);
      const isCur = cur && cur[0] === u && cur[1] === l;
      const icon = done ? "✓" : !unlocked ? "🔒" : l === LESSONS_PER_UNIT - 1 ? "🏆" : "★";
      const label = l === LESSONS_PER_UNIT - 1 ? "Review" : `Lesson ${l + 1}`;
      const shift = (u % 2 ? -1 : 1) * offsets[l];
      html += `<div class="node-wrap" style="transform:translateX(${shift}px)">
        <button class="node ${done ? "done" : ""} ${!unlocked ? "locked" : ""} ${isCur ? "current" : ""}" style="background:${unit.color}" data-lesson="${u}-${l}">${icon}</button>
        <div class="node-label">${label}</div>
      </div>`;
    }
    html += `</div></section>`;
  });
  if (!cur) html += `<div class="empty">🎉 You finished the whole course! Keep your streak alive with Practice, or ask for more units.</div>`;
  return html;
}

function audioWarning() {
  return `<div class="warn">🔇 <b>No Thai voice found.</b> Listening exercises are turned off. On Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → add a Thai voice (e.g. Kanya), then reload. On iPhone: Settings → Accessibility → Spoken Content → Voices → Thai.</div>`;
}

function wordsView() {
  const learned = WORDS.filter((w) => S.seen[w.id]);
  if (!learned.length) return `<div class="section-title">📖 My Words</div><div class="empty">Words you learn will show up here.<br/>Start your first lesson! 🐘</div>`;
  let html = `<div class="section-title">📖 My Words <span class="rom">(${learned.length} learned)</span></div>
    <div class="drills">
      <button class="drill-card speak" id="drill"><span>🎤</span><b>Speaking drill</b><small>Say your words, get a pronunciation score</small></button>
      <button class="drill-card write" id="wdrill"><span>✍️</span><b>Writing drill</b><small>Spell in Thai letters and build sentences</small></button>
    </div>`;
  COURSE.forEach((unit, u) => {
    const ws = learned.filter((w) => w.unit === u);
    if (!ws.length) return;
    html += `<div class="word-group"><h3>${unit.emoji} ${unit.title}</h3>`;
    ws.forEach((w) => {
      html += `<div class="word-row">
        <div class="w"><span class="thai">${w.th}</span> <span class="rom">${w.rom}</span><div class="en">${esc(w.en)}</div></div>
        <button class="speak-btn" data-say="${w.th}">🔊</button>
      </div>`;
    });
    html += `</div>`;
  });
  return html;
}

function profileView() {
  const learned = WORDS.filter((w) => S.seen[w.id]).length;
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, label]) => `<button class="${String(S[key]) === v ? "on" : ""}" data-set="${key}=${v}">${label}</button>`).join("")}</div>`;
  return `
    <div class="profile-head"><div class="mascot">🐘</div><div class="section-title">My Progress</div></div>
    <div class="profile-stats">
      <div class="pstat"><span class="ico">🔥</span><div><b>${S.streak}</b><small>Day streak</small></div></div>
      <div class="pstat"><span class="ico">⭐</span><div><b>${S.xp}</b><small>Total XP</small></div></div>
      <div class="pstat"><span class="ico">📖</span><div><b>${learned}</b><small>Words learned</small></div></div>
      <div class="pstat"><span class="ico">🏅</span><div><b>${S.lessonsCompleted}</b><small>Lessons done</small></div></div>
    </div>
    <div class="section-title">⚙️ Settings</div>
    <div class="setting"><div><b>I speak as…</b><small>Sets ผม/ครับ (male) or ฉัน/ค่ะ (female) in sentences</small></div>${seg("gender", [["m", "Male"], ["f", "Female"]])}</div>
    <div class="setting"><div><b>Romanization</b><small>Show pronunciation under Thai script</small></div>${seg("showRom", [["true", "On"], ["false", "Off"]])}</div>
    <div class="setting"><div><b>Speaking exercises</b><small>${!speakSupported() ? "Not supported in this browser — use Chrome or Safari" : S.speakOffUntil > Date.now() ? `Paused for ${Math.ceil((S.speakOffUntil - Date.now()) / 60000)} more min (“Can't speak now”)` : "Say words out loud and get your pronunciation checked"}</small></div>${seg("speakOn", [["true", "On"], ["false", "Off"]])}</div>
    <div class="setting"><div><b>Sound effects</b><small>Correct/wrong sounds and the lesson-complete fanfare. On iPhone, Silent mode mutes these.</small></div>${seg("sound", [["true", "On"], ["false", "Off"]])}</div>
    <div class="setting"><div><b>Thai voice</b><small>${hasAudio() ? `Using: ${esc(thaiVoice.name)}` : "Not found — listening exercises off"}</small></div><button class="speak-btn" data-say="สวัสดีครับ">🔊</button></div>
    <div class="setting"><div><b>App version ${APP_VERSION}</b><small>Updates install automatically. Tap if something looks out of date — your progress is kept.</small></div><button id="update" class="btn" style="width:auto;padding:8px 12px;font-size:13px">Check for updates</button></div>
    <div class="setting"><div><b>Reset progress</b><small>Start the course over</small></div><button id="reset" class="btn bad" style="width:auto;padding:8px 14px;font-size:13px">Reset</button></div>
    <p class="rom" style="text-align:center;margin-top:20px">Tone marks: à low · â falling · á high · ǎ rising · no mark = mid</p>`;
}

function showTip(u) {
  const unit = COURSE[u];
  const words = unit.words.map((w) => `<div class="word-row"><div class="w"><span class="thai">${w.th}</span> <span class="rom">${w.rom}</span><div class="en">${esc(w.en)}</div></div><button class="speak-btn" data-say="${w.th}">🔊</button></div>`).join("");
  modal(`<h2>${unit.emoji} ${unit.title}</h2><p>${unit.tip}</p><div style="max-height:45vh;overflow:auto">${words}</div><button class="btn" data-close>Got it</button>`);
}

function modal(html) {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(bg);
  bg.onclick = (e) => { if (e.target === bg || e.target.hasAttribute("data-close")) bg.remove(); };
  bg.querySelectorAll("[data-say]").forEach((b) => b.onclick = () => speak(b.dataset.say));
  return bg;
}

function toast(msg) {
  const m = modal(`<h2>${msg}</h2><button class="btn" data-close>OK</button>`);
  return m;
}

/* =========================================================
   Lesson runner
   ========================================================= */
let L = null;

function startLesson(u, l) {
  refreshDaily();
  if (S.hearts <= 0) return outOfHearts();
  const queue = buildLesson(u, l);
  L = { u, l, queue, i: 0, total: queue.length, progress: 0, mistakes: 0, answered: 0, practice: false, drill: false, speakScores: [], started: Date.now() };
  renderExercise();
}

function startPractice() {
  refreshDaily();
  const queue = buildPractice();
  if (!queue) return toast("Learn at least 4 words first, then come back to practice! 💪");
  L = { u: null, l: null, queue, i: 0, total: queue.length, progress: 0, mistakes: 0, answered: 0, practice: true, drill: false, speakScores: [], started: Date.now() };
  renderExercise();
}

function startSpeakDrill() {
  if (!speakSupported()) return toast("🎤 This browser can't do speech recognition. Open Thai Lingo in Google Chrome or Safari.");
  const queue = buildSpeakDrill();
  if (!queue) return toast("Learn a few words first, then come back to practice speaking! 🎤");
  L = { u: null, l: null, queue, i: 0, total: queue.length, progress: 0, mistakes: 0, answered: 0, practice: true, drill: "speak", speakScores: [], started: Date.now() };
  renderExercise();
}

function startWriteDrill() {
  const queue = buildWriteDrill();
  if (!queue) return toast("Learn a few words first, then come back to practice writing! ✍️");
  L = { u: null, l: null, queue, i: 0, total: queue.length, progress: 0, mistakes: 0, answered: 0, practice: true, drill: "write", speakScores: [], started: Date.now() };
  renderExercise();
}

function outOfHearts() {
  const mins = Math.ceil((HEART_REFILL_MS - (Date.now() - S.heartTime)) / 60000);
  const m = modal(`<h2>💔 Out of hearts</h2><p>You get a new heart every 30 minutes (next one in ~${mins} min). Or earn one now by doing a <b>Practice</b> session — practice never costs hearts!</p><button class="btn" id="go-practice">💪 Practice to earn hearts</button><button class="btn ghost" data-close>Later</button>`);
  $("#go-practice", m).onclick = () => { m.remove(); startPractice(); };
}

function quitLesson() {
  const m = modal(`<h2>Wait, don't go! 🐘</h2><p>You'll lose your progress in this lesson if you quit now.</p><button class="btn" data-close>Keep learning</button><button class="btn ghost" id="quit">Quit lesson</button>`);
  $("#quit", m).onclick = () => { m.remove(); stopRecognizing(); speechSynthesis?.cancel(); L = null; renderHome(); applyUpdateIfIdle(); };
}

function lessonShell(inner, footer) {
  const pct = Math.round((L.progress / L.total) * 100);
  app.innerHTML = `
    <div class="lesson">
      <div class="lesson-top">
        <button class="close" id="close">✕</button>
        <div class="bar"><div style="width:${pct}%"></div></div>
        ${L.practice ? `<div class="stat xp">💪</div>` : `<div class="stat hearts">❤️ ${S.hearts}</div>`}
      </div>
      <div class="lesson-body">${inner}</div>
      <div class="lesson-foot" id="foot">${footer}</div>
    </div>`;
  $("#close").onclick = quitLesson;
}

const romHtml = (r) => (S.showRom && r ? `<span class="rom">${r}</span>` : "");

function renderExercise() {
  if (L.i >= L.queue.length) return finishLesson();
  const ex = L.queue[L.i];
  keyHandler = null;
  stopRecognizing();
  const R = {
    intro: renderIntro, meaning: renderMeaning, pickThai: renderPickThai, listen: renderListen, match: renderMatch,
    buildTh: renderBuild, buildEn: renderBuild, speak: renderSpeak, spell: renderSpell, typeEn: renderTypeEn,
  }[ex.type];
  R(ex);
  window.scrollTo(0, 0);
}

function checkFooter() { return `<button class="btn" id="check" disabled>Check</button>`; }

/* ----- Intro card ----- */
function renderIntro(ex) {
  const w = ex.word;
  lessonShell(`
    <div class="prompt-title">New word!</div>
    <div class="intro">
      <span class="badge">NEW WORD</span>
      <div class="big thai">${w.th}</div>
      <span class="rom">${w.rom}</span>
      <div class="en">${esc(w.en)}</div>
      <div class="speak-row">
        <button class="speak-btn speak-big" id="say">🔊</button>
        <button class="speak-btn slow speak-big" id="slow" style="width:80px">🐢</button>
        ${canSpeak() ? `<button class="speak-btn mic speak-big" id="try" style="width:80px" title="Try saying it">🎤</button>` : ""}
      </div>
      <div class="try-result" id="try-result">${canSpeak() ? "Tap 🎤 to try saying it" : ""}</div>
    </div>`, `<button class="btn" id="next">Continue</button>`);
  $("#say").onclick = () => speak(w.th);
  $("#slow").onclick = () => speak(w.th, true);
  if (canSpeak()) {
    const out = $("#try-result"), btn = $("#try");
    btn.onclick = () => {
      btn.classList.add("listening");
      out.textContent = "Listening… say it now";
      recognize({
        onInterim: (t) => (out.textContent = `Hearing: ${t}`),
        onDone: (alts) => {
          btn.classList.remove("listening");
          if (!alts.length) { out.textContent = "I didn't catch that. Tap 🎤 to try again."; return; }
          const { score, heard } = scoreSpeech([[w.th]], alts);
          const pct = Math.round(score * 100);
          out.innerHTML = `${score >= 0.85 ? "✅ Great!" : score >= 0.6 ? "👍 Close!" : "🔁 Try again"} I heard <span class="thai">${esc(heard)}</span> (${pct}% match)`;
        },
        onError: (err) => { btn.classList.remove("listening"); out.textContent = SPEECH_ERRORS[err] || `Mic error: ${err}`; },
      });
    };
  }
  speak(w.th);
  $("#next").onclick = () => {
    S.seen[w.id] = true; save();
    L.progress++; L.i++; renderExercise();
  };
}

/* ----- Choice exercises ----- */
function choiceExercise(ex, { title, prompt, optionHtml, grid, onRender }) {
  lessonShell(`
    <div class="prompt-title">${title}</div>
    ${prompt}
    <div class="choices ${grid ? "grid2" : ""}">
      ${ex.options.map((o, i) => `<button class="choice ${grid ? "center" : ""}" data-i="${i}">${grid ? "" : `<span class="num">${i + 1}</span>`}${optionHtml(o)}</button>`).join("")}
    </div>`, checkFooter());
  let sel = null;
  const btns = [...app.querySelectorAll(".choice")];
  btns.forEach((b) => b.onclick = () => {
    btns.forEach((x) => x.classList.remove("selected"));
    b.classList.add("selected");
    sel = +b.dataset.i;
    if (ex.type === "pickThai") speak(ex.options[sel].th);
    $("#check").disabled = false;
  });
  onRender && onRender();
  keyHandler = (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= btns.length && !btns[n - 1].disabled) btns[n - 1].click();
  };
  $("#check").onclick = () => {
    const right = ex.options[sel] === ex.word;
    btns.forEach((b) => (b.disabled = true));
    btns[sel].classList.remove("selected");
    btns[sel].classList.add(right ? "correct" : "wrong");
    if (!right) btns[ex.options.indexOf(ex.word)].classList.add("correct");
    S.seen[ex.word.id] = true;
    feedback(right, ex, `<span class="thai">${ex.word.th}</span> ${romHtml(ex.word.rom)} = ${esc(ex.word.en)}`);
  };
}

function renderMeaning(ex) {
  const w = ex.word;
  choiceExercise(ex, {
    title: "What does this mean?",
    prompt: `<div class="speech"><div class="mascot">🐘</div><div class="bubble">
      <button class="speak-btn" id="say">🔊</button>
      <div><span class="big-thai thai">${w.th}</span>${romHtml(w.rom)}</div></div></div>`,
    optionHtml: (o) => `<span>${esc(o.en)}</span>`,
    onRender: () => { $("#say").onclick = () => speak(w.th); speak(w.th); },
  });
}

function renderPickThai(ex) {
  choiceExercise(ex, {
    title: `Which one means “${esc(ex.word.en)}”?`,
    prompt: "",
    grid: true,
    optionHtml: (o) => `<span class="thai">${o.th}</span>${romHtml(o.rom)}`,
  });
}

function renderListen(ex) {
  const w = ex.word;
  choiceExercise(ex, {
    title: "What do you hear?",
    prompt: `<div class="listen-row"><button class="speak-btn speak-big" id="say">🔊</button><button class="speak-btn slow" id="slow">🐢</button></div>`,
    grid: true,
    optionHtml: (o) => `<span class="thai">${o.th}</span>`,
    onRender: () => {
      $("#say").onclick = () => speak(w.th);
      $("#slow").onclick = () => speak(w.th, true);
      setTimeout(() => speak(w.th), 250);
    },
  });
}

/* ----- Match pairs ----- */
function renderMatch(ex) {
  const left = shuffle(ex.words), right = shuffle(ex.words);
  lessonShell(`
    <div class="prompt-title">Tap the matching pairs</div>
    <div class="match">
      <div class="col">${left.map((w) => `<button class="choice" data-side="L" data-id="${w.id}"><div><span class="thai">${w.th}</span>${romHtml(w.rom)}</div></button>`).join("")}</div>
      <div class="col">${right.map((w) => `<button class="choice" data-side="R" data-id="${w.id}">${esc(w.en)}</button>`).join("")}</div>
    </div>`, `<button class="btn" id="check" disabled>Check</button>`);
  let selL = null, selR = null, matched = 0, slip = false;
  const all = [...app.querySelectorAll(".match .choice")];
  all.forEach((b) => b.onclick = () => {
    const side = b.dataset.side;
    if (side === "L") { speak(WORDS.find((w) => w.id === b.dataset.id).th); }
    all.filter((x) => x.dataset.side === side && !x.disabled).forEach((x) => x.classList.remove("selected"));
    b.classList.add("selected");
    if (side === "L") selL = b; else selR = b;
    if (selL && selR) {
      const a = selL, c = selR;
      selL = selR = null;
      if (a.dataset.id === c.dataset.id) {
        [a, c].forEach((x) => { x.classList.remove("selected"); x.classList.add("correct"); x.disabled = true; });
        setTimeout(() => [a, c].forEach((x) => { x.classList.remove("correct"); x.classList.add("matched"); }), 350);
        matched++;
        beep("good");
        if (matched === ex.words.length) {
          ex.words.forEach((w) => (S.seen[w.id] = true));
          setTimeout(() => feedback(true, ex, slip ? "All matched — nice recovery!" : "All pairs matched!", true), 400);
        }
      } else {
        slip = true;
        [a, c].forEach((x) => { x.classList.remove("selected"); x.classList.add("wrong"); });
        beep("bad");
        setTimeout(() => [a, c].forEach((x) => x.classList.remove("wrong")), 450);
      }
    }
  });
}

/* ----- Sentence builder ----- */
function renderBuild(ex) {
  const isTh = ex.type === "buildTh";
  const promptText = isTh ? esc(ex.sent.en) : ex.tokens.join("");
  const tileInner = (t) => (isTh ? `<span class="thai">${t}</span>${romHtml(romOf(t))}` : esc(t));
  lessonShell(`
    <div class="prompt-title">${isTh ? "Write this in Thai" : "Translate this sentence"}</div>
    <div class="speech"><div class="mascot">🐘</div><div class="bubble">
      ${isTh ? "" : `<button class="speak-btn" id="say">🔊</button>`}
      <div>${isTh ? `<b style="font-size:20px">${promptText}</b>` : `<span class="big-thai thai">${promptText}</span>${romHtml(romLine(ex.tokens))}`}</div>
    </div></div>
    <div class="answer-line" id="answer"></div>
    <div class="bank" id="bank">${ex.bank.map((t, i) => `<button class="tile" data-i="${i}">${tileInner(t)}</button>`).join("")}</div>`, checkFooter());
  const full = ex.tokens.join(" ");
  if (!isTh) { $("#say").onclick = () => speak(ex.tokens.join("")); speak(ex.tokens.join("")); }
  const chosen = [];
  const answerEl = $("#answer");
  const bankTiles = [...app.querySelectorAll("#bank .tile")];
  const redraw = () => {
    answerEl.innerHTML = chosen.map((i, k) => `<button class="tile" data-k="${k}">${tileInner(ex.bank[i])}</button>`).join("");
    answerEl.querySelectorAll(".tile").forEach((t) => t.onclick = () => {
      const k = +t.dataset.k;
      bankTiles[chosen[k]].classList.remove("used");
      chosen.splice(k, 1);
      redraw();
    });
    $("#check").disabled = chosen.length === 0;
  };
  bankTiles.forEach((t) => t.onclick = () => {
    const i = +t.dataset.i;
    if (isTh) speak(ex.bank[i]);
    t.classList.add("used");
    chosen.push(i);
    redraw();
  });
  $("#check").onclick = () => {
    const given = chosen.map((i) => ex.bank[i]);
    let right;
    if (isTh) {
      const g = given.join(" ");
      const accepted = [full, ...(ex.sent.altTh || []).map((a) => genderize(a.split(" ")).join(" "))];
      // Be lenient about polite/softening particles at the end
      const strip = (s) => s.split(" ").filter((t) => !PARTICLES.includes(t)).join(" ");
      right = accepted.some((a) => a === g || strip(a) === strip(g));
    } else {
      const g = normEn(given.join(" "));
      right = [ex.sent.en, ...(ex.sent.altEn || [])].some((a) => normEn(a) === g);
    }
    app.querySelectorAll(".tile").forEach((t) => (t.disabled = true));
    const ans = isTh
      ? `<span class="thai">${ex.tokens.join("")}</span> ${romHtml(romLine(ex.tokens))}<br/>${esc(ex.sent.en)}`
      : `${esc(ex.sent.en)}`;
    speak(ex.tokens.join(""));
    feedback(right, ex, ans);
  };
}

/* ----- Speaking (pronunciation check) ----- */
const SPEAK_PASS = 0.8;
const SPEAK_TRIES = 3;

function renderSpeak(ex) {
  const text = ex.tokens.join("");
  lessonShell(`
    <div class="prompt-title">Speak this out loud</div>
    <div class="speech"><div class="mascot">🐘</div><div class="bubble">
      <button class="speak-btn" id="say">🔊</button>
      <button class="speak-btn slow" id="slow">🐢</button>
      <div><span class="big-thai thai">${text}</span>${romHtml(romLine(ex.tokens))}<span class="en-hint">${esc(ex.en)}</span></div>
    </div></div>
    <button class="mic-btn" id="mic"><span class="mic-ico">🎤</span><span id="mic-label">Tap to speak</span></button>
    <div class="heard" id="heard">Listen first with 🔊, then tap the mic and say it.</div>
    <div class="tries" id="tries"></div>`,
    `<button class="btn ghost" id="skip">${L.drill ? "Skip" : "Can't speak now"}</button>`);

  $("#say").onclick = () => speak(text);
  $("#slow").onclick = () => speak(text, true);
  const mic = $("#mic"), label = $("#mic-label"), heard = $("#heard"), tries = $("#tries");
  let attempts = 0, listening = false, finished = false;
  const showTries = () => (tries.innerHTML = attempts ? `Attempt ${attempts} of ${SPEAK_TRIES}` : "");

  const done = (right, best) => {
    finished = true;
    mic.disabled = true;
    L.speakScores.push(best.score);
    const pct = Math.round(best.score * 100);
    const heardHtml = best.heard ? `You said: <span class="thai">${esc(best.heard)}</span> (${pct}% match)` : "";
    feedback(right, ex, right
      ? heardHtml
      : `<span class="thai">${text}</span> ${romHtml(romLine(ex.tokens))}<br/>${heardHtml}<br/><small>No hearts lost — speaking takes practice!</small>`,
      false, { noPenalty: true, noRetry: true });
  };

  mic.onclick = () => {
    if (finished) return;
    if (listening) { try { rec && rec.stop(); } catch {} return; }
    listening = true;
    mic.classList.add("listening");
    label.textContent = "Listening… (tap to stop)";
    heard.className = "heard";
    heard.textContent = "🎙️ Speak now…";
    recognize({
      onInterim: (t) => (heard.innerHTML = `Hearing: <span class="thai">${esc(t)}</span>`),
      onDone: (alts) => {
        listening = false;
        mic.classList.remove("listening");
        label.textContent = "Tap to speak";
        if (!alts.length) { heard.textContent = "I didn't catch that — tap the mic and try again."; return; }
        const best = scoreSpeech(ex.targets, alts);
        attempts++;
        showTries();
        if (best.score >= SPEAK_PASS) return done(true, best);
        if (attempts >= SPEAK_TRIES) return done(false, best);
        const pct = Math.round(best.score * 100);
        heard.className = `heard ${best.score >= 0.6 ? "close" : "off"}`;
        heard.innerHTML = `${best.score >= 0.6 ? "👍 Almost!" : "🔁 Not quite."} I heard <span class="thai">${esc(best.heard)}</span> (${pct}% match). Listen again and try once more.`;
      },
      onError: (err) => {
        listening = false;
        mic.classList.remove("listening");
        label.textContent = "Tap to speak";
        heard.className = "heard off";
        heard.textContent = SPEECH_ERRORS[err] || `Microphone error: ${err}`;
      },
    });
  };

  $("#skip").onclick = () => {
    stopRecognizing();
    if (!L.drill) {
      // Pause speaking exercises for 15 minutes and drop the rest from this lesson
      S.speakOffUntil = Date.now() + 15 * 60 * 1000;
      save();
      L.queue = L.queue.filter((e, k) => k <= L.i || e.type !== "speak");
    }
    L.progress++;
    L.i++;
    L.total = L.progress + (L.queue.length - L.i);
    renderExercise();
  };
}

/* ----- Writing: spell the Thai word from letters ----- */
function renderSpell(ex) {
  const w = ex.word;
  lessonShell(`
    <div class="prompt-title">Spell it in Thai</div>
    <div class="speech"><div class="mascot">🐘</div><div class="bubble">
      <button class="speak-btn" id="say">🔊</button>
      <div><b style="font-size:20px">${esc(w.en)}</b>${romHtml(w.rom)}</div>
    </div></div>
    <div class="spell-line" id="answer"></div>
    <div class="bank letters" id="bank">${ex.bank.map((t, i) => `<button class="tile letter" data-i="${i}"><span class="thai">${t}</span></button>`).join("")}</div>`, checkFooter());
  $("#say").onclick = () => speak(w.th);
  speak(w.th);
  const chosen = [];
  const answerEl = $("#answer");
  const bankTiles = [...app.querySelectorAll("#bank .tile")];
  const redraw = () => {
    answerEl.innerHTML = chosen.length
      ? chosen.map((i, k) => `<button class="tile letter" data-k="${k}"><span class="thai">${ex.bank[i]}</span></button>`).join("")
      : `<span class="spell-hint">Tap the letters in order</span>`;
    answerEl.querySelectorAll(".tile").forEach((t) => t.onclick = () => {
      const k = +t.dataset.k;
      bankTiles[chosen[k]].classList.remove("used");
      chosen.splice(k, 1);
      redraw();
    });
    $("#check").disabled = chosen.length === 0;
  };
  redraw();
  bankTiles.forEach((t) => t.onclick = () => {
    t.classList.add("used");
    chosen.push(+t.dataset.i);
    redraw();
  });
  $("#check").onclick = () => {
    const given = chosen.map((i) => ex.bank[i]).join("");
    const right = given === w.th;
    app.querySelectorAll(".tile").forEach((t) => (t.disabled = true));
    speak(w.th);
    feedback(right, ex, `${right ? "" : `You wrote: <span class="thai">${given}</span><br/>`}<span class="thai">${w.th}</span> ${romHtml(w.rom)} = ${esc(w.en)}`);
  };
}

/* ----- Writing: type the meaning in English ----- */
function meaningsOf(en) {
  const out = new Set();
  en.split("/").forEach((part) => {
    const nums = part.match(/\((\d+)\)/);
    if (nums) out.add(nums[1]);
    const clean = normEn(part.replace(/\(.*?\)/g, ""));
    if (clean) { out.add(clean); out.add(clean.replace(/^(to|a|an|the) /, "")); }
  });
  return [...out];
}

function renderTypeEn(ex) {
  const w = ex.word;
  lessonShell(`
    <div class="prompt-title">Type this in English</div>
    <div class="speech"><div class="mascot">🐘</div><div class="bubble">
      <button class="speak-btn" id="say">🔊</button>
      <div><span class="big-thai thai">${w.th}</span>${romHtml(w.rom)}</div>
    </div></div>
    <input id="typed" class="type-box" type="text" placeholder="Type in English…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />`, checkFooter());
  $("#say").onclick = () => speak(w.th);
  speak(w.th);
  const input = $("#typed");
  input.focus();
  input.oninput = () => ($("#check").disabled = !input.value.trim());
  $("#check").onclick = () => {
    const given = normEn(input.value).replace(/^(to|a|an|the) /, "");
    const accepted = meaningsOf(w.en);
    const exact = accepted.includes(given);
    const typo = !exact && given.length >= 4 && accepted.some((a) => a.length >= 4 && lev(a, given) <= 1);
    input.disabled = true;
    const ans = `<span class="thai">${w.th}</span> ${romHtml(w.rom)} = ${esc(w.en)}${typo ? `<br/><small>Watch the spelling — you typed “${esc(input.value.trim())}”</small>` : ""}`;
    feedback(exact || typo, ex, ans);
  };
}

/* ----- Feedback ----- */
const PRAISE = ["Great job!", "Awesome!", "Nice!", "Excellent!", "You got it!", "เก่งมาก! (Very good!)", "Perfect!"];

function feedback(right, ex, answerHtml, noAnswer, opts = {}) {
  L.answered++;
  const foot = $("#foot");
  if (right) {
    L.progress++;
    beep("good");
  } else {
    L.mistakes++;
    beep("bad");
    if (!L.practice && !opts.noPenalty) {
      if (S.hearts === MAX_HEARTS) S.heartTime = Date.now();
      S.hearts = Math.max(0, S.hearts - 1);
    }
    if (opts.noRetry) {
      L.progress++;
    } else {
      // Retry this exercise later in the lesson
      const retry = { ...ex };
      if (ex.options) retry.options = shuffle(ex.options);
      if (ex.bank) retry.bank = shuffle(ex.bank);
      L.queue.push(retry);
      L.total = Math.max(L.total, L.progress + (L.queue.length - L.i - 1));
    }
  }
  save();
  foot.className = `lesson-foot ${right ? "good" : "bad"}`;
  foot.innerHTML = `
    <div class="feedback">
      <div class="icon">${right ? "✅" : "❌"}</div>
      <div>
        <h3>${right ? pick(PRAISE) : "Not quite…"}</h3>
        ${noAnswer ? "" : `<div class="answer">${right ? "" : "Correct answer:<br/>"}${answerHtml}</div>`}
      </div>
    </div>
    <button class="btn ${right ? "good" : "bad"}" id="next">Continue</button>`;
  $("#next").focus();
  $("#next").onclick = () => {
    if (!L.practice && S.hearts <= 0) {
      L = null; renderHome();
      return outOfHearts();
    }
    L.i++;
    renderExercise();
  };
  // update hearts display
  const h = app.querySelector(".lesson-top .hearts");
  if (h) h.textContent = `❤️ ${S.hearts}`;
}

/* ----- Finish ----- */
function finishLesson() {
  const accuracy = L.answered ? Math.round(((L.answered - L.mistakes) / L.answered) * 100) : 100;
  let xp = L.practice ? 10 : 15;
  if (L.mistakes === 0) xp += 5;
  const prevDay = S.lastDay;
  if (prevDay !== today()) { S.streak = prevDay === yesterday() ? S.streak + 1 : 1; S.lastDay = today(); }
  S.xp += xp;
  S.todayXp += xp;
  S.lessonsCompleted++;
  let extra = "";
  if (L.practice) {
    if (S.hearts < MAX_HEARTS) { S.hearts++; extra = "+1 ❤️ for practicing!"; }
  } else {
    const firstTime = !isDone(L.u, L.l);
    S.done[`${L.u}-${L.l}`] = true;
    if (firstTime && L.l === LESSONS_PER_UNIT - 1) extra = `🎉 Unit “${COURSE[L.u].title}” complete!`;
  }
  save();
  beep(L.mistakes === 0 ? "perfect" : "win");
  confetti();
  const speakAvg = L.speakScores.length ? Math.round((L.speakScores.reduce((a, b) => a + b, 0) / L.speakScores.length) * 100) : null;
  const msgs = ["Lesson complete!", "เยี่ยมมาก! Amazing!", "You're on fire!", "Keep it up!"];
  app.innerHTML = `
    <div class="result">
      <div class="mascot">🐘</div>
      <h1>${L.drill === "write" ? "Writing drill complete!" : L.drill ? "Speaking drill complete!" : L.practice ? "Practice complete!" : pick(msgs)}</h1>
      ${extra ? `<b>${extra}</b>` : ""}
      <div class="result-stats">
        <div class="result-stat"><div class="label">Total XP</div><div class="value">⭐ ${xp}</div></div>
        <div class="result-stat acc"><div class="label">Accuracy</div><div class="value">🎯 ${accuracy}%</div></div>
        <div class="result-stat streak-s"><div class="label">Streak</div><div class="value">🔥 ${S.streak}</div></div>
        ${speakAvg !== null ? `<div class="result-stat speak-s"><div class="label">Speaking</div><div class="value">🎤 ${speakAvg}%</div></div>` : ""}
      </div>
      <button class="btn" id="cont">Continue</button>
    </div>`;
  $("#cont").onclick = () => { L = null; renderHome.scrolled = false; tab = "learn"; renderHome(); applyUpdateIfIdle(); };
}

/* ---------- Keyboard: Enter = check/continue, 1-4 = choose ---------- */
let keyHandler = null;
document.addEventListener("keydown", (e) => {
  if (!L) return;
  if (e.key === "Enter") {
    const next = $("#next"), check = $("#check");
    if (next) { e.preventDefault(); next.click(); }
    else if (check && !check.disabled) { e.preventDefault(); check.click(); }
    return;
  }
  if (e.target.tagName === "INPUT") return;
  if (keyHandler && !$("#next") && /^[1-9]$/.test(e.key)) keyHandler(e);
});

/* ---------- Updates ---------- */
// The service worker checks for a new version whenever the app opens or comes back
// to the screen. When one is installed we reload — right away if you're not in a
// lesson, otherwise as soon as the lesson ends.
let swReg = null;
let updatePending = false;
function applyUpdateIfIdle() {
  if (updatePending && !L) { updatePending = false; location.reload(); }
}
function setupUpdates() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return; // first install, nothing old to replace
    updatePending = true;
    applyUpdateIfIdle();
  });
  navigator.serviceWorker.register("sw.js").then((reg) => {
    swReg = reg;
    const check = () => reg.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    setInterval(check, 30 * 60 * 1000);
  }).catch(() => {});
}

// Manual "Check for updates": ask for a new version, then clear saved files and reload.
async function forceUpdate(btn) {
  if (btn) { btn.disabled = true; btn.textContent = "Updating…"; }
  try { if (swReg) await swReg.update(); } catch {}
  try { if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k); } catch {}
  location.reload();
}

/* ---------- Boot ---------- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
renderHome();
setupUpdates();
// Voices load asynchronously in some browsers — re-render once they arrive
if ("speechSynthesis" in window) {
  speechSynthesis.addEventListener("voiceschanged", () => { findVoice(); if (!L) renderHome(); });
}
