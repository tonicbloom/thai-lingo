"use strict";

/* =========================================================
   Thai Lingo — characters, stories, Legendary, guidebooks, phrase cards
   Loaded after app.js (uses its helpers). Content lives in content.js.
   ========================================================= */

/* ---------- Characters ---------- */
const SENT_UNIT = new Map();
COURSE.forEach((unit, u) => unit.sentences.forEach((s) => SENT_UNIT.set(s, u)));

// Which character hosts an exercise: the unit's host, Chang for letters
function hostKey(ex) {
  if (!ex) return "chang";
  if (ex.type === "storyStep" && L && L.story != null) return UNIT_HOST[L.story];
  if (ex.type === "card") return UNIT_HOST[ex.p.u];
  if (ex.word && ex.word.kind) return "chang";           // letters, vowels, tone marks
  const u = ex.word && ex.word.unit != null ? ex.word.unit : ex.sent ? SENT_UNIT.get(ex.sent) : null;
  return u != null ? UNIT_HOST[u] : "chang";
}
function speakerFor(ex) {
  const c = CAST[hostKey(ex)];
  return `<div class="mascot char"><span class="char-av">${c.avatar}</span><small>${c.name}</small></div>`;
}

/* =========================================================
   Stories
   ========================================================= */
function startStory(u) {
  const items = STORIES[u].lines;
  L = { u: null, l: null, story: u, queue: items.map((item) => ({ type: "storyStep", item })), i: 0, total: items.length,
    progress: 0, mistakes: 0, answered: 0, practice: true, drill: null, speakScores: [], started: Date.now() };
  renderExercise();
}

function storyBubble(line, idx, firstSpeaker, isNew) {
  const [who, th, rom, en] = line;
  const c = CAST[who];
  const side = who === firstSpeaker ? "left" : "right";
  return `<div class="st-line ${side} ${isNew ? "new" : ""}">
    <div class="st-av">${c.avatar}<small>${c.name}</small></div>
    <button class="st-bubble" data-line="${idx}">
      <span class="thai">${th}</span>
      ${romOn() ? `<span class="rom">${rom}</span>` : ""}
      <span class="st-en hidden">${esc(en)}</span>
      <span class="st-play">🔊</span>
    </button>
  </div>`;
}

function renderStoryStep(ex) {
  const st = STORIES[L.story];
  const lines = st.lines;
  const firstSpeaker = lines.find((x) => Array.isArray(x))[0];
  let chat = `<div class="st-scene">${esc(st.scene)}</div>`;
  for (let k = 0; k <= L.i; k++) {
    const it = L.queue[k].item;
    if (Array.isArray(it)) chat += storyBubble(it, k, firstSpeaker, k === L.i);
  }
  const item = ex.item;
  const isQ = !Array.isArray(item);
  let question = "";
  if (isQ) {
    const opts = shuffle(item.options.map((o, i) => ({ o, right: i === 0 })));
    ex.opts = opts;
    question = `<div class="st-q"><b>❓ ${esc(item.q)}</b>
      <div class="choices">${opts.map((x, i) => `<button class="choice" data-i="${i}">${esc(x.o)}</button>`).join("")}</div></div>`;
  }
  lessonShell(`
    <div class="prompt-title">📖 ${esc(st.title)}</div>
    <div class="st-chat" id="chat">${chat}</div>
    ${question}
    <p class="st-tip">Tap a bubble to hear it again and see the English.</p>`,
    isQ ? `<button class="btn" disabled>Choose an answer</button>` : `<button class="btn" id="next">Continue</button>`);

  app.querySelectorAll(".st-bubble").forEach((b) => b.onclick = () => {
    const it = L.queue[+b.dataset.line].item;
    speak(it[1]);
    b.querySelector(".st-en").classList.remove("hidden");
  });
  const chatEl = $("#chat");
  chatEl.scrollTop = chatEl.scrollHeight;
  if (isQ) {
    const btns = [...app.querySelectorAll(".st-q .choice")];
    btns.forEach((b) => b.onclick = () => {
      const pickd = ex.opts[+b.dataset.i];
      btns.forEach((x) => (x.disabled = true));
      b.classList.add(pickd.right ? "correct" : "wrong");
      if (!pickd.right) btns[ex.opts.findIndex((x) => x.right)].classList.add("correct");
      feedback(pickd.right, ex, esc(item.options[0]), false, { noPenalty: true, noRetry: true });
    });
    window.scrollTo(0, document.body.scrollHeight);
  } else {
    speak(item[1]);
    $("#next").onclick = () => { L.progress++; L.i++; renderExercise(); };
  }
}

/* =========================================================
   Legendary: replay a finished unit with no help
   ========================================================= */
function confirmLegendary(u) {
  const m = modal(`<h2>👑 Legendary: ${esc(COURSE[u].title)}</h2>
    <p>Prove you've mastered this unit: <b>no romanization, no hints, and only 3 lives</b>. Pass it and the unit turns gold.</p>
    <button class="btn" id="go-legend">I'm ready</button><button class="btn ghost" data-close>Not yet</button>`);
  $("#go-legend", m).onclick = () => { m.remove(); startLegendary(u); };
}

function startLegendary(u) {
  const words = WORDS.filter((w) => w.unit === u);
  const q = [];
  shuffle(words).slice(0, 8).forEach((w) => q.push(wordExercise(w, words)));
  COURSE[u].sentences.forEach((s) => q.push(sentenceExercise(s, u)));
  const queue = shuffle(q).slice(0, 13);
  queue.splice(queue.length - 1, 0, matchExercise(words));
  L = { u, l: null, legendary: true, lives: 3, queue, i: 0, total: queue.length, progress: 0, mistakes: 0, answered: 0,
    practice: true, drill: null, speakScores: [], started: Date.now() };
  renderExercise();
}

function legendaryFailed() {
  const u = L.u;
  L = null;
  renderHome();
  const m = modal(`<h2>💔 Out of lives</h2><p>Legendary allows only 2 mistakes. Review the unit and try again — you've got this!</p>
    <button class="btn" id="again">Try again</button><button class="btn ghost" data-close>Later</button>`);
  $("#again", m).onclick = () => { m.remove(); startLegendary(u); };
}

/* =========================================================
   Guidebook (per unit)
   ========================================================= */
function showGuidebook(u) {
  const unit = COURSE[u];
  const host = CAST[UNIT_HOST[u]];
  const phrases = unit.sentences.map((s) => {
    const tokens = genderize(s.th.split(" "));
    const th = tokens.join("");
    return `<div class="word-row"><div class="w"><span class="thai">${th}</span> <span class="rom">${romLine(tokens)}</span><div class="en">${esc(s.en)}</div></div><button class="speak-btn" data-say="${th}">🔊</button></div>`;
  }).join("");
  const words = unit.words.map((w) => `<div class="word-row"><div class="w"><span class="thai">${w.th}</span> <span class="rom">${w.rom}</span><div class="en">${esc(w.en)}</div></div><button class="speak-btn" data-say="${w.th}">🔊</button></div>`).join("");
  const m = modal(`
    <div class="gb-head" style="background:${unit.color}"><small>UNIT ${u + 1} GUIDEBOOK</small><h2>${unit.emoji} ${esc(unit.title)}</h2></div>
    <div class="gb-host"><span class="char-av">${host.avatar}</span><div><b>${host.name}</b> <span class="thai">${host.thai}</span><br/><small>${esc(host.bio)}</small></div></div>
    <div class="gb-body">
      <p class="gb-tip">💡 ${unit.tip}</p>
      <h3>Key phrases</h3>${phrases}
      <h3>Words</h3>${words}
    </div>
    <button class="btn" id="gb-cards">🃏 Practice these phrases</button>
    <button class="btn ghost" data-close>Close</button>`);
  $("#gb-cards", m).onclick = () => { m.remove(); startCards(u); };
}

/* =========================================================
   Phrase cards (spaced repetition)
   ========================================================= */
const CARD_DAYS = [0, 1, 3, 7, 14, 30]; // wait after box 1..5
const genderStr = (th) => (S.gender === "f" ? th.replace(/ผม/g, "ฉัน").replace(/ครับ/g, "ค่ะ") : th);
const genderRom = (r) => (S.gender === "f" ? r.replace(/phǒm/g, "chǎn").replace(/khráp/g, "khâ") : r);

function allPhrases() {
  const out = [];
  COURSE.forEach((unit, u) => {
    unit.sentences.forEach((s, i) => {
      const tokens = genderize(s.th.split(" "));
      out.push({ id: `P:${u}:s${i}`, u, th: tokens.join(""), rom: romLine(tokens), en: s.en, sit: `${unit.emoji} ${unit.title}` });
    });
    (EXTRA_PHRASES[u] || []).forEach(([th, rom, en, sit], i) =>
      out.push({ id: `P:${u}:x${i}`, u, th: genderStr(th), rom: genderRom(rom), en, sit }));
  });
  return out;
}
const cardUnlocked = (p) => isUnlocked(p.u, 0);
const cardDue = (p) => S.cards[p.id] && S.cards[p.id].due <= Date.now();

function cardsDueLabel() {
  const ps = allPhrases().filter(cardUnlocked);
  const due = ps.filter(cardDue).length, fresh = ps.filter((p) => !S.cards[p.id]).length;
  if (due) return `${due} due for review${fresh ? ` · ${fresh} new` : ""}`;
  if (fresh) return `${fresh} new phrases to learn`;
  return "All caught up! Practice anyway";
}

function buildCardQueue(unit) {
  const ps = allPhrases();
  if (unit != null) return shuffle(ps.filter((p) => p.u === unit));
  const open = ps.filter(cardUnlocked);
  const due = shuffle(open.filter(cardDue)).slice(0, 8);
  const fresh = open.filter((p) => !S.cards[p.id]).slice(0, Math.max(2, 10 - due.length));
  let q = [...due, ...fresh].slice(0, 10);
  if (!q.length) q = shuffle(open).slice(0, 8);   // nothing due: practice anyway
  return q;
}

function startCards(unit = null) {
  const q = buildCardQueue(unit);
  if (!q.length) return toast("Start Unit 1 to unlock your first phrase cards! 🃏");
  L = { u: null, l: null, cards: true, cardsSeen: 0, queue: q.map((p) => ({ type: "card", p })), i: 0, total: q.length,
    progress: 0, mistakes: 0, answered: 0, practice: true, drill: null, speakScores: [], started: Date.now() };
  renderExercise();
}

function gradeCard(p, good) {
  const c = S.cards[p.id] || { box: 0, due: 0 };
  c.box = good ? Math.min(5, c.box + 1) : 1;
  c.due = Date.now() + CARD_DAYS[good ? c.box : 0] * 86400000;
  S.cards[p.id] = c;
  save();
}

function renderCard(ex) {
  const p = ex.p;
  const box = (S.cards[p.id] || {}).box || 0;
  lessonShell(`
    <div class="prompt-title">🃏 Phrase cards</div>
    <div class="card-stage">
      <div class="flashcard" id="card">
        <div class="face front">
          <span class="card-tag">${box ? `Review · level ${box}` : "New phrase"}</span>
          <small class="card-sit">${esc(p.sit)}</small>
          <div class="card-en">${esc(p.en)}</div>
          <span class="card-hint">How would you say it in Thai? Tap to flip</span>
        </div>
        <div class="face back">
          <small class="card-sit">${esc(p.en)}</small>
          <div class="card-th thai">${p.th}</div>
          <div class="card-rom">${p.rom}</div>
          <div class="card-btns">
            <button class="speak-btn" id="c-say">🔊</button>
            <button class="speak-btn slow" id="c-slow">🐢</button>
            ${canSpeak() ? `<button class="speak-btn mic" id="c-mic">🎤</button>` : ""}
          </div>
          <div class="card-heard" id="c-heard">${canSpeak() ? "Tap 🎤 and say it out loud" : ""}</div>
        </div>
      </div>
    </div>`,
    `<div class="card-grade"><button class="btn bad" id="again" disabled>↺ Again</button><button class="btn good" id="got" disabled>✓ Got it</button></div>
     <p class="card-swipe">Flip, then swipe → if you knew it, ← to see it again</p>`);

  const card = $("#card");
  let flipped = false;
  const flip = () => {
    if (flipped) return;
    flipped = true;
    card.classList.add("flipped");
    $("#again").disabled = $("#got").disabled = false;
    speak(p.th);
  };
  $("#c-say").onclick = (e) => { e.stopPropagation(); speak(p.th); };
  $("#c-slow").onclick = (e) => { e.stopPropagation(); speak(p.th, true); };
  const mic = $("#c-mic");
  if (mic) mic.onclick = (e) => {
    e.stopPropagation();
    const out = $("#c-heard");
    mic.classList.add("listening");
    out.textContent = "Listening… say it now";
    recognize({
      onInterim: (t) => (out.textContent = `Hearing: ${t}`),
      onDone: (alts) => {
        mic.classList.remove("listening");
        if (!alts.length) { out.textContent = "I didn't catch that — tap 🎤 to try again."; return; }
        const { score, heard } = scoreSpeech([[p.th]], alts);
        L.speakScores.push(score);
        out.innerHTML = `${score >= 0.8 ? "✅ Great pronunciation!" : score >= 0.6 ? "👍 Close!" : "🔁 Try again"} <span class="thai">${esc(heard)}</span> (${Math.round(score * 100)}%)`;
      },
      onError: (err) => { mic.classList.remove("listening"); out.textContent = SPEECH_ERRORS[err] || `Mic error: ${err}`; },
    });
  };

  const grade = (good) => {
    if (!flipped || card.dataset.done) return;
    card.dataset.done = "1";
    card.style.transform = "";
    stopRecognizing();
    gradeCard(p, good);
    L.answered++; L.cardsSeen++;
    if (good) { L.progress++; beep("good"); }
    else {
      L.mistakes++;
      if (!ex.again) { L.queue.push({ ...ex, again: true }); L.total++; } else L.progress++;
    }
    card.classList.add(good ? "fly-right" : "fly-left");
    setTimeout(() => { L.i++; renderExercise(); }, 280);
  };
  $("#again").onclick = () => grade(false);
  $("#got").onclick = () => grade(true);

  // Tap to flip; once flipped, drag sideways to grade
  let startX = null, dx = 0, moved = false;
  card.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    startX = e.clientX; dx = 0; moved = false;
    card.setPointerCapture(e.pointerId);
    card.style.transition = "none";
  });
  card.addEventListener("pointermove", (e) => {
    if (startX == null || !flipped) return;
    dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg) rotateY(180deg)`;
    card.classList.toggle("lean-right", dx > 40);
    card.classList.toggle("lean-left", dx < -40);
  });
  const release = () => {
    if (startX == null) return;
    startX = null;
    card.style.transition = "";
    card.classList.remove("lean-right", "lean-left");
    if (!flipped) { if (!moved) flip(); return; }
    if (dx > 90) return grade(true);
    if (dx < -90) return grade(false);
    card.style.transform = "";
  };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
}
