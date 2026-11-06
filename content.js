// Thai Lingo — characters, stories and phrase cards (original content).
// Characters always speak in their own voice: women use ค่ะ/คะ, men use ครับ.

const CAST = {
  chang: { name: "Chang", thai: "ช้าง", avatar: "🐘", bio: "Your guide. A cheerful elephant from Chiang Mai." },
  mali: { name: "Mali", thai: "มะลิ", avatar: "👩🏻‍🍳", bio: "Runs a noodle stall in Bangkok. Named after the jasmine flower." },
  fah: { name: "Fah", thai: "ฟ้า", avatar: "👧🏻", bio: "Mali's little sister. A university student. Her name means “sky”." },
  tor: { name: "Tor", thai: "ต่อ", avatar: "🧑🏻", bio: "Fah's friend. Plays guitar, loves spicy food." },
  daeng: { name: "Uncle Daeng", thai: "ลุงแดง", avatar: "👨🏻‍🦳", bio: "A tuk-tuk driver who knows every street in Bangkok." },
};

// Who hosts each unit (speaks its sentences and appears on the path)
const UNIT_HOST = ["mali", "fah", "mali", "daeng", "fah", "tor"];

// Quick reactions after an answer
const REACT_GOOD = [
  ["เก่งมาก!", "gèng mâak", "Great job!"],
  ["ถูกต้อง!", "thùuk-dtâwng", "Correct!"],
  ["เยี่ยม!", "yîam", "Excellent!"],
  ["สุดยอด!", "sùt-yâwt", "Awesome!"],
];
const REACT_BAD = [
  ["ไม่เป็นไร", "mâi-bpen-rai", "No worries!"],
  ["สู้ๆ!", "sûu sûu", "Keep going!"],
  ["เกือบแล้ว!", "gʉ̀ap láew", "Almost!"],
];

// One short story per unit. Lines: [speaker, Thai, romanization, English].
// Questions ("q") appear after the line they follow; the first answer is correct.
const STORIES = [
  {
    title: "At Mali's noodle stall",
    scene: "🍜 A busy street in Bangkok, early morning.",
    lines: [
      ["daeng", "สวัสดีครับ", "sà-wàt-dii khráp", "Hello!"],
      ["mali", "สวัสดีค่ะ ลุงแดง สบายดีไหมคะ", "sà-wàt-dii khâ lung daeng, sà-baai-dii mǎi khá", "Hello, Uncle Daeng! How are you?"],
      ["daeng", "สบายดีครับ ขอบคุณครับ", "sà-baai-dii khráp, khàwp-khun khráp", "I'm fine, thank you."],
      { q: "How is Uncle Daeng?", options: ["He's fine", "He's hungry", "He's sorry"] },
      ["daeng", "ขอโทษครับ", "khǎw-thôot khráp", "Oops — sorry! (he bumps a chair)"],
      ["mali", "ไม่เป็นไรค่ะ", "mâi-bpen-rai khâ", "No problem!"],
      { q: "What does Mali say after he apologizes?", options: ["No problem", "Thank you", "Hello"] },
    ],
  },
  {
    title: "Fah meets Tor",
    scene: "🎓 A café near the university.",
    lines: [
      ["tor", "สวัสดีครับ ผมชื่อต่อครับ", "sà-wàt-dii khráp, phǒm chʉ̂ʉ dtàw khráp", "Hello, my name is Tor."],
      ["fah", "สวัสดีค่ะ ฉันชื่อฟ้าค่ะ", "sà-wàt-dii khâ, chǎn chʉ̂ʉ fáa khâ", "Hello, my name is Fah."],
      { q: "What is the boy's name?", options: ["Tor", "Fah", "Mali"] },
      ["tor", "ยินดีที่ได้รู้จักครับ", "yin-dii thîi dâai rúu-jàk khráp", "Nice to meet you."],
      ["fah", "ยินดีที่ได้รู้จักค่ะ คุณเป็นคนไทยไหมคะ", "yin-dii thîi dâai rúu-jàk khâ, khun bpen khon-thai mǎi khá", "Nice to meet you. Are you Thai?"],
      ["tor", "ใช่ครับ ผมเป็นคนไทย", "châi khráp, phǒm bpen khon-thai", "Yes, I'm Thai."],
      { q: "Is Tor Thai?", options: ["Yes", "No", "We don't know"] },
    ],
  },
  {
    title: "Not too spicy!",
    scene: "🌶️ Lunchtime at Mali's stall.",
    lines: [
      ["daeng", "หิวมาก ขอผัดไทยครับ", "hǐw mâak, khǎw phàt-thai khráp", "I'm so hungry. Pad thai, please."],
      ["mali", "เผ็ดไหมคะ", "phèt mǎi khá", "Spicy?"],
      ["daeng", "ไม่เผ็ดครับ", "mâi phèt khráp", "Not spicy, please."],
      { q: "What does Uncle Daeng order?", options: ["Pad thai", "Papaya salad", "Coffee"] },
      ["mali", "ได้ค่ะ", "dâai khâ", "Sure!"],
      ["daeng", "อร่อยมากครับ", "à-ròi mâak khráp", "It's really delicious!"],
      { q: "How does he like the food?", options: ["Very delicious", "Too spicy", "Not hungry"] },
    ],
  },
  {
    title: "How much is it?",
    scene: "🛒 Fah shopping at a market.",
    lines: [
      ["fah", "ส้มตำเท่าไหร่คะ", "sôm-dtam thâo-rài khá", "How much is the papaya salad?"],
      ["mali", "ห้าสิบบาทค่ะ", "hâa-sìp bàat khâ", "Fifty baht."],
      { q: "How much is the papaya salad?", options: ["50 baht", "5 baht", "15 baht"] },
      ["fah", "กาแฟเท่าไหร่คะ", "gaa-fae thâo-rài khá", "How much is the coffee?"],
      ["mali", "สามสิบบาทค่ะ", "sǎam-sìp bàat khâ", "Thirty baht."],
      { q: "How much is the coffee?", options: ["30 baht", "3 baht", "13 baht"] },
    ],
  },
  {
    title: "Fah's family",
    scene: "☕ Tor and Fah chatting after class.",
    lines: [
      ["tor", "ฟ้ามีพี่ไหมครับ", "fáa mii phîi mǎi khráp", "Fah, do you have an older sibling?"],
      ["fah", "มีค่ะ พี่มะลิค่ะ", "mii khâ, phîi má-lí khâ", "Yes — my big sister, Mali."],
      { q: "Who is Fah's older sister?", options: ["Mali", "Tor", "Uncle Daeng"] },
      ["tor", "แม่ของฟ้าสบายดีไหมครับ", "mâe khǎwng fáa sà-baai-dii mǎi khráp", "Is your mom doing well?"],
      ["fah", "สบายดีค่ะ แม่อยู่บ้านค่ะ", "sà-baai-dii khâ, mâe yùu bâan khâ", "She's well. Mom is at home."],
      { q: "Where is Fah's mom?", options: ["At home", "At the market", "At the café"] },
    ],
  },
  {
    title: "Sweet dreams",
    scene: "🌙 Tor calls Fah in the evening.",
    lines: [
      ["tor", "กินข้าวหรือยังครับ", "gin khâao rʉ̌ʉ-yang khráp", "Have you eaten yet?"],
      ["fah", "กินแล้วค่ะ", "gin láew khâ", "I've eaten already."],
      { q: "Has Fah eaten?", options: ["Yes", "No", "Not yet"] },
      ["tor", "ฟ้าสวยมากครับ", "fáa sǔai mâak khráp", "Fah, you look really beautiful."],
      ["fah", "ขอบคุณค่ะ ต่อน่ารักนะ", "khàwp-khun khâ, dtàw nâa-rák ná", "Thank you! Tor, you're sweet."],
      ["tor", "ฝันดีนะครับ", "fǎn-dii ná khráp", "Sweet dreams!"],
      { q: "What does Tor say Fah is?", options: ["Beautiful", "Hungry", "Spicy"] },
    ],
  },
];

// Extra useful phrases for phrase cards (the unit's sentences are included too).
// [Thai, romanization, English, situation]. Written in the male form; swapped
// to ฉัน/ค่ะ automatically when you choose the female speaker in Profile.
const EXTRA_PHRASES = [
  [
    ["แล้วเจอกันนะ", "láew jəə gan ná", "See you later!", "Saying goodbye to a friend"],
    ["ลาก่อน", "laa-gàwn", "Goodbye", "A more final goodbye"],
    ["ยินดีด้วย", "yin-dii dûai", "Congratulations!", "When someone shares good news"],
  ],
  [
    ["คุณมาจากไหน", "khun maa jàak nǎi", "Where are you from?", "Getting to know someone"],
    ["ผมพูดไทยได้นิดหน่อย", "phǒm phûut thai dâai nít-nòi", "I speak a little Thai", "When someone starts talking fast"],
    ["พูดช้าๆ ได้ไหม", "phûut cháa-cháa dâai mǎi", "Can you speak slowly?", "When you didn't catch that"],
  ],
  [
    ["ขอน้ำเปล่าหน่อย", "khǎw náam-bplàao nòi", "Can I have some water, please?", "At a restaurant"],
    ["เช็คบิลด้วย", "chék bin dûai", "The bill, please", "When you're ready to pay"],
    ["ไม่ใส่ผักชี", "mâi sài phàk-chii", "No coriander, please", "Ordering food your way"],
  ],
  [
    ["ลดได้ไหม", "lót dâai mǎi", "Can you give me a discount?", "Bargaining at a market"],
    ["แพงไป", "phaeng bpai", "It's too expensive", "Bargaining at a market"],
  ],
  [
    ["พ่อแม่สบายดีไหม", "phâw mâe sà-baai-dii mǎi", "Are your parents well?", "Asking about family"],
    ["คิดถึงบ้าน", "khít-thʉ̌ng bâan", "I miss home", "Feeling homesick"],
  ],
  [
    ["รักนะ", "rák ná", "Love you", "Saying goodbye to your partner"],
    ["ไปเที่ยวกันไหม", "bpai thîao gan mǎi", "Shall we go out?", "Asking someone on a date"],
    ["ดูแลตัวเองด้วยนะ", "duu-lae dtua-eeng dûai ná", "Take care of yourself", "Before a trip, or when they're sick"],
  ],
];
