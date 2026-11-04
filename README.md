# 🐘 Thai Lingo

A small Duolingo-style app for learning Thai. Plain HTML/CSS/JavaScript: no install, no build step.

## Run it
- **Recommended:** double-click **`Start Thai Lingo.command`**. It opens the app at http://localhost:8765, where the microphone works reliably. Keep the Terminal window open while you practice.
- **Without speaking:** double-click `index.html`. Everything works, but the browser may block the microphone or ask for it every time.

Your progress is saved in the browser (localStorage), so it stays on the device and browser you use.

## Install on iPhone
1. Open the app's web address in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**.
3. Turn on dictation for speaking exercises: Settings → General → Keyboard → **Enable Dictation**.

It then opens full-screen like a normal app and works offline. If the microphone doesn't work from the Home Screen icon, open the same address in Safari instead. Progress in the Home Screen app is saved separately from Safari.

## Audio
Thai pronunciation uses your device's built-in text-to-speech.
- **Mac:** System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → add **Kanya** (Thai).
- **iPhone:** Settings → Accessibility → Spoken Content → Voices → Thai.

## Speaking (pronunciation check)
The app listens through your microphone using the browser's Thai speech recognition and scores how closely what it heard matches the target. Use **Google Chrome** (best Thai support) or **Safari** (turn on Dictation in System Settings → Keyboard). Speech recognition can't grade tones precisely, but if it understands you, a Thai person most likely will too.

## Features
- 6 units, 18 lessons: Greetings, People & Me, Food & Drink, Numbers & Money, Family, Sweet Talk 💕
- Exercises: new-word cards, multiple choice, listening, match pairs, sentence building (Thai → English and English → Thai)
- **Speaking:** say words and sentences out loud and get a % match (3 tries, no hearts lost), plus a 🎤 Speaking drill in the Words tab
- **Writing:** spell Thai words from letter tiles, and type the meaning in English
- XP, a daily goal, a day streak, and hearts (a new heart every 30 minutes, and practice earns one)
- Practice mode, a list of the words you've learned, and per-unit tips
- A male/female setting that switches ผม/ครับ ↔ ฉัน/ค่ะ, plus a romanization on/off toggle

## Contributing
Pull requests are welcome, especially from native Thai speakers checking or adding content.

## Adding content
Everything lives in `data.js`. Add words or sentences to a unit, or add a whole new unit object.
Sentences are space-separated Thai words, written in the male form.

## License
MIT
