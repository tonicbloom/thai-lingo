"use strict";

/* =========================================================
   Thai Lingo — "Spell it in Thai": syllable-by-syllable speller
   Follows how Thai spelling is taught: build each syllable in the order you HEAR it
   (starting consonant → vowel → ending → tone mark) and learn where each vowel is
   WRITTEN. The app places every piece in its written position as you go.
   Loaded after app.js and letters.js (uses their helpers and LETTER_BY).
   ========================================================= */

/* ---------- Syllables ---------- */
const COMB_START = /^[ัิ-ฺ็]*/; // vowel marks that sit on the consonant

function parseSyl(s) {
  const [start, vowel, ending = "", tone = "", note = ""] = s.split("|");
  return { start, vowel, ending, tone, note };
}
// Put the pieces in written order, e.g. ม + ไ◌ + ่ → ไม่ ; ท + เ◌า + ่ → เท่า
function assemble(start, vkey, ending = "", tone = "") {
  if (!vkey) return start + tone;
  const [pre, post] = SPELL_VOWELS[vkey].form.split("◌");
  const comb = post.match(COMB_START)[0];
  return pre + start + comb + tone + post.slice(comb.length) + ending;
}
const sylText = (s) => assemble(s.start, s.vowel, s.ending, s.tone);
const spellSyls = (word) => (SPELLINGS[word.th] || []).map(parseSyl);
const canSpell = (word) => !!SPELLINGS[word.th];

// Sanity check (run in the console): every breakdown must rebuild the exact word.
function checkSpellings() {
  return WORDS.filter((w) => canSpell(w) && spellSyls(w).map(sylText).join("") !== w.th).map((w) => w.th);
}

/* ---------- Sounds ---------- */
const FINAL_SOUND = {};
[["k", "กขคฆ"], ["t", "ดตถทธฎฏฐฑฒจชซศษส"], ["p", "บปพฟภ"], ["n", "นณญรลฬ"], ["m", "ม"], ["ng", "ง"], ["i", "ย"], ["o", "ว"]]
  .forEach(([snd, chars]) => [...chars].forEach((c) => (FINAL_SOUND[c] = snd)));
const startSound = (start) => {
  if (start === "อ") return "(silent — the syllable starts with its vowel)";
  if (start.length > 1 && start[0] === "ห") return LETTER_BY[start[1]].sound; // ห is silent
  if (start.length > 1) return [...start].map((c) => LETTER_BY[c].sound).join(""); // e.g. คร → khr
  return LETTER_BY[start] ? LETTER_BY[start].sound : start;
};
const SAME_SOUND = (() => {
  const by = {};
  LETTERS.forEach((l) => (by[l.sound] = by[l.sound] || []).push(l.ch));
  return (ch) => (LETTER_BY[ch] ? by[LETTER_BY[ch].sound].filter((c) => c !== ch) : []);
})();
// Common letters first: used for "easy" wrong answers
const COMMON = "กคงดตนบปมยรลวอหสชทขจผพฟ".split("");
const TONE_NAME = { "่": "mái èek", "้": "mái thoo", "๊": "mái dtrii", "๋": "mái jàt-dtà-waa" };

/* ---------- Explanations (shown as you build) ---------- */
function stepNotes(s, step) {
  const v = SPELL_VOWELS[s.vowel];
  const out = [];
  if (step === "start") {
    if (s.start.length > 1 && s.start[0] === "ห") out.push(`<b>ห is silent here</b> — written in front of <span class="thai">${s.start[1]}</span>, it only changes the tone.`);
    else if (s.start.length > 1) out.push(`<b>Two consonants together</b> (<span class="thai">${s.start}</span>) — say them as one sound.`);
    if (s.start === "อ") out.push(`<b>อ is silent</b> at the start — it holds the vowel when a syllable begins with a vowel sound.`);
  }
  if (step === "vowel") {
    if (v.hidden) out.push(v.sound === "a"
      ? `<b>No vowel is written!</b> A lone consonant in front of another syllable gets a short “a” sound.`
      : `<b>No vowel is written!</b> Between two consonants, Thai adds a short “o” sound.`);
    if (/^[เแโไใ]/.test(v.form)) out.push(`<b>${v.form[0]} is written before the consonant</b>, but you say it after.`);
    if (s.vowel === "◌ั") out.push(`Short “a” is <span class="thai">ะ</span> at the end of a syllable, but <span class="thai">◌ั</span> when an ending consonant follows.`);
    if (s.vowel === "◌ะ") out.push(`Short “a” at the end of a syllable is written <span class="thai">ะ</span>.`);
    if (s.vowel === "เ◌็") out.push(`Short “e” with an ending consonant: <span class="thai">เ</span> plus the little mark <span class="thai">็</span> on top.`);
    if (s.vowel === "◌ว") out.push(`<span class="thai">◌ัว</span> drops its <span class="thai">ั</span> when an ending consonant follows.`);
    if (s.vowel === "ใ◌") out.push(`<span class="thai">ใ</span> and <span class="thai">ไ</span> sound the same — only about 20 words use <span class="thai">ใ</span>, so they're learned by heart.`);
    if (["◌ิ", "◌ี", "◌ึ", "◌ือ", "◌ั", "◌ัว", "เ◌็"].includes(s.vowel)) out.push(`This vowel sits <b>on top</b> of the consonant.`);
    if (["◌ุ", "◌ู"].includes(s.vowel)) out.push(`This vowel sits <b>under</b> the consonant.`);
    if (s.note === "AM") out.push(`<span class="thai">น้ำ</span> is an exception: it's said long — “náam”.`);
  }
  if (step === "ending") {
    const fs = FINAL_SOUND[s.ending], start = LETTER_BY[s.ending] && LETTER_BY[s.ending].sound;
    if (s.note === "YSIL") out.push(`<b>This ย is silent</b> — it's just part of how ไทย is spelled.`);
    else if (fs && start && fs !== start && !(fs === "i" || fs === "o"))
      out.push(`<span class="thai">${s.ending}</span> sounds like <b>“${fs}”</b> at the end of a syllable (not “${start}”).`);
  }
  if (step === "tone") out.push(`<span class="thai">${s.tone}</span> is <b>${TONE_NAME[s.tone]}</b>. Tone marks go above the consonant (and above any vowel on top).`);
  return out;
}

// How tricky a word is to spell — used to teach simple words first
function spellDifficulty(word) {
  const syls = spellSyls(word);
  let d = syls.length;
  syls.forEach((s) => {
    d += ["start", "vowel", "ending"].reduce((n, st) => n + stepNotes(s, st).length * 0.6, 0);
    if (s.tone) d += 0.3;
  });
  return d;
}
const easiestFirst = (words) => [...words].sort((a, b) => spellDifficulty(a) - spellDifficulty(b));

function spellExercise(word) {
  return { type: "spell", word };
}

/* ---------- Choices for each step ---------- */
const VOWEL_PARTNERS = {
  "-a": ["◌ะ", "◌า"], "-o": ["โ◌", "◌อ"], "◌ะ": ["◌ั", "◌า"], "◌ั": ["◌ะ", "◌า"], "◌า": ["◌ะ", "◌ำ"],
  "◌ิ": ["◌ี", "◌ึ"], "◌ี": ["◌ิ", "◌ือ"], "◌ึ": ["◌ือ", "◌ิ"], "◌ือ": ["◌ึ", "◌ี"], "◌ุ": ["◌ู", "◌ิ"], "◌ู": ["◌ุ", "◌ี"],
  "เ◌็": ["เ◌", "แ◌"], "เ◌": ["เ◌็", "แ◌"], "แ◌": ["เ◌", "◌า"], "โ◌": ["◌อ", "เ◌"], "◌อ": ["โ◌", "เ◌อ"],
  "เ◌อ": ["เ◌", "◌อ"], "เ◌ือ": ["เ◌ีย", "◌ัว"], "◌ัว": ["เ◌ือ", "◌ู"], "◌ว": ["◌ัว", "◌อ"], "ไ◌": ["ใ◌", "เ◌า"],
  "ใ◌": ["ไ◌", "เ◌า"], "◌ำ": ["◌า", "◌ั"], "เ◌า": ["ไ◌", "◌า"], "เ◌ีย": ["เ◌ือ", "◌ี"],
};
const ALL_VOWEL_KEYS = Object.keys(SPELL_VOWELS);

function uniq(list, n) {
  const out = [];
  for (const x of list) if (x && !out.includes(x)) { out.push(x); if (out.length >= n) break; }
  return out;
}

// easy = beginners: never two answers that sound identical (they can't be told apart by ear)
function stepChoices(s, step, easy) {
  if (step === "start") {
    let wrong;
    if (s.start.length > 1) {
      const first = s.start[0], rest = s.start.slice(1);
      wrong = [first === "ห" ? rest : first, (SAME_SOUND(first)[0] || pick(COMMON)) + rest, pick(COMMON)];
    } else {
      const same = easy ? [] : shuffle(SAME_SOUND(s.start)).slice(0, 2);
      const myS = LETTER_BY[s.start] ? LETTER_BY[s.start].sound : "";
      const diff = shuffle(COMMON.filter((c) => c !== s.start && LETTER_BY[c].sound !== myS));
      wrong = [...same, ...diff];
    }
    return shuffle([s.start, ...uniq(wrong.filter((c) => c !== s.start), 3)]).map((c) => ({ value: c, show: c, label: startSound(c) }));
  }
  if (step === "vowel") {
    const mySound = SPELL_VOWELS[s.vowel].sound;
    const NEEDS_ENDING = ["◌ั", "เ◌็", "◌ว"], NO_ENDING = ["◌ะ"];
    const ok = (k) => k !== s.vowel && SPELL_VOWELS[k] && (!easy || SPELL_VOWELS[k].sound !== mySound)
      && !(s.ending === "" && NEEDS_ENDING.includes(k)) && !(s.ending && NO_ENDING.includes(k)) // only shapes that fit
      && !SPELL_VOWELS[k].hidden;                    // never two "not written" options (they'd look identical)
    const wrong = uniq([...(VOWEL_PARTNERS[s.vowel] || []).filter(ok), ...shuffle(ALL_VOWEL_KEYS).filter(ok)], 3);
    return shuffle([s.vowel, ...wrong]).map((k) => {
      const v = SPELL_VOWELS[k];
      return { value: k, show: assemble(s.start, k), label: v.hidden ? `${v.sound} (not written)` : v.sound };
    });
  }
  if (step === "ending") {
    const fs = FINAL_SOUND[s.ending];
    const sameEnd = easy ? [] : shuffle(Object.keys(FINAL_SOUND).filter((c) => FINAL_SOUND[c] === fs && c !== s.ending)).slice(0, 2);
    const otherEnd = shuffle(["น", "ม", "ง", "ก", "ด", "บ", "ย", "ว"].filter((c) => FINAL_SOUND[c] !== fs));
    return shuffle([s.ending, ...uniq([...sameEnd, ...otherEnd], 3)])
      .map((c) => ({ value: c, show: assemble(s.start, s.vowel, c), label: `ends “${FINAL_SOUND[c]}”` }));
  }
  // tone
  return shuffle(["่", "้", "๊", "๋"]).map((t) => ({ value: t, show: assemble(s.start, s.vowel, s.ending, t), label: TONE_NAME[t] }));
}

function stepQuestion(s, step, rom) {
  if (step === "start") return `Which letter makes the first sound of “${rom}”?`;
  if (step === "vowel") return `Which vowel makes “${SPELL_VOWELS[s.vowel].sound}”?`;
  if (step === "ending" && s.note === "YSIL") return `“${rom}” is spelled with a silent letter at the end. Which one?`;
  if (step === "ending") return `Which letter makes the ending “${FINAL_SOUND[s.ending]}”?`;
  return `Which tone mark? Listen to “${rom}”.`;
}
const STEP_TITLE = { start: "First sound", vowel: "Vowel", ending: "Ending", tone: "Tone mark" };

/* ---------- The exercise ---------- */
function renderSpell(ex) {
  const w = ex.word;
  const syls = spellSyls(w);
  const roms = w.rom.split(/[- ]/);
  const help = spellHelp(w);          // full | some | light (from app.js)
  const easy = help === "full";
  // the steps for every syllable, in the order you hear them
  const steps = [];
  syls.forEach((s, si) => {
    steps.push({ si, step: "start" }, { si, step: "vowel" });
    if (s.ending) steps.push({ si, step: "ending" });
    if (s.tone) steps.push({ si, step: "tone" });
  });
  let k = 0, slips = 0, stepSlips = 0, current = null; // current = { btns, choices, answer }
  const done = syls.map(() => ({}));   // what's been built per syllable

  lessonShell(`
    <div class="prompt-title">Spell it in Thai</div>
    <div class="speech">${speakerFor(ex)}<div class="bubble">
      <button class="speak-btn" id="say">🔊</button>
      <button class="speak-btn slow" id="slow">🐢</button>
      <div><b style="font-size:20px">${esc(w.en)}</b>${romHtml(w.rom)}</div>
    </div></div>
    <div class="sb-word" id="sb-word"></div>
    <div class="sb-syls" id="sb-syls"></div>
    <div class="sb-step" id="sb-step"></div>
    <div class="choices grid2" id="sb-choices"></div>
    <div class="sb-notes" id="sb-notes"></div>`, L.legendary ? `<p class="card-swipe">👑 Legendary: no hints</p>` : `<button class="btn ghost" id="hint">💡 Hint</button>`);
  $("#say").onclick = () => speak(w.th);
  $("#slow").onclick = () => speak(w.th, true);
  speak(w.th);

  const partial = (si) => {
    const d = done[si], s = syls[si];
    if (!d.start) return "";
    return assemble(d.start, d.vowel || "", d.ending || "", d.tone || "");
  };
  function drawWord() {
    const cur = k < steps.length ? steps[k].si : -1;
    $("#sb-word").innerHTML = syls.map((s, si) => {
      const txt = partial(si);
      const cls = si < cur || cur === -1 ? "sb-done" : si === cur ? "sb-cur" : "sb-todo";
      return `<span class="thai ${cls}">${txt || (si === cur ? "?" : "◌")}</span>`;
    }).join("");
    $("#sb-syls").innerHTML = roms.map((r, si) => `<span class="${si === cur ? "on" : si < cur || cur === -1 ? "done" : ""}">${esc(r)}</span>`).join("<i>·</i>");
  }
  // show the tips for the step you just completed (replacing the previous ones)
  function addNotes(list) {
    $("#sb-notes").innerHTML = list.map((n) => `<div class="sb-note">💡 ${n}</div>`).join("");
  }
  function drawStep() {
    drawWord();
    if (k >= steps.length) return finish();
    const { si, step } = steps[k];
    const s = syls[si];
    stepSlips = 0;
    $("#sb-step").innerHTML = `<span class="sb-badge">${syls.length > 1 ? `Syllable ${si + 1} of ${syls.length} · ` : ""}${STEP_TITLE[step]}</span><b>${esc(stepQuestion(s, step, roms[si]))}</b>`;
    const choices = stepChoices(s, step, easy);
    const box = $("#sb-choices");
    box.innerHTML = choices.map((c, i) => `<button class="choice center sb-choice" data-i="${i}"><span class="thai">${c.show}</span>${help !== "light" ? `<span class="tap-rom rom">${esc(c.label)}</span>` : ""}</button>`).join("");
    const btns = [...box.querySelectorAll(".choice")];
    current = { btns, choices, answer: s[step] };
    btns.forEach((b) => b.onclick = () => {
      const c = choices[+b.dataset.i];
      if (help !== "light") {
        // hear what you picked: a letter by its name, a syllable as it sounds
        if (step === "start") speak(LETTER_BY[c.value[c.value.length - 1]]?.say || c.show);
        else if (!(step === "vowel" && SPELL_VOWELS[c.value].hidden)) speak(c.show);
      }
      if (c.value === s[step]) {
        b.classList.add("correct");
        btns.forEach((x) => (x.disabled = true));
        done[si][step] = c.value;
        addNotes(stepNotes(s, step));
        k++;
        setTimeout(drawStep, 450);
      } else {
        slips++; stepSlips++;
        b.classList.add("wrong");
        b.disabled = true;
        beep("bad");
        if (stepSlips >= 2 && !L.legendary) btns.find((x) => choices[+x.dataset.i].value === s[step])?.classList.add("hint-glow");
      }
    });
  }
  const hintBtn = $("#hint");
  if (hintBtn) hintBtn.onclick = () => {
    if (!current || k >= steps.length) return;
    current.btns.forEach((b) => { if (current.choices[+b.dataset.i].value === current.answer) b.classList.add("hint-glow"); });
    L.hints = (L.hints || 0) + 1;
  };
  function finish() {
    drawWord();
    $("#sb-step").innerHTML = `<b>${slips ? "Done — now you know how it's built!" : "Perfect spelling!"}</b>`;
    $("#sb-choices").innerHTML = "";
    if (hintBtn) hintBtn.disabled = true;
    speak(w.th);
    const breakdown = syls.map((s, i) => `<span class="thai">${sylText(s)}</span> ${esc(roms[i])}`).join(" · ");
    // a slip doesn't cost a heart here, but the word comes back later for practice
    feedback(slips === 0, ex, `<span class="thai">${w.th}</span> = ${breakdown}`, false, slips ? { noPenalty: true } : {});
  }
  drawStep();
}
