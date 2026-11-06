// How each vocabulary word is spelled, one syllable at a time.
// This follows the way Thai spelling is taught in schools: every syllable is
//   starting consonant + vowel (written around it) + ending consonant + tone mark.
//
// Each syllable: "start|vowel|ending|tone|note"
//   start  – the consonant(s) you hear first (e.g. ส, คร, หน)
//   vowel  – a key from SPELL_VOWELS below (◌ marks where the consonant goes)
//   ending – final consonant, if any
//   tone   – tone mark (่ ้ ๊ ๋), if any
//   note   – optional special case: AM = ำ said long, YSIL = final ย is silent
// The app checks that the pieces rebuild the exact word, so a typo here can't
// teach a wrong spelling (see checkSpellings() in spelling.js).

const SPELL_VOWELS = {
  "-a": { form: "◌", sound: "a", hidden: true },   // short a, not written
  "-o": { form: "◌", sound: "o", hidden: true },   // short o, not written
  "◌ะ": { form: "◌ะ", sound: "a" },
  "◌ั": { form: "◌ั", sound: "a" },                // short a when an ending follows
  "◌า": { form: "◌า", sound: "aa" },
  "◌ิ": { form: "◌ิ", sound: "i" },
  "◌ี": { form: "◌ี", sound: "ii" },
  "◌ึ": { form: "◌ึ", sound: "ʉ" },
  "◌ือ": { form: "◌ือ", sound: "ʉʉ" },
  "◌ุ": { form: "◌ุ", sound: "u" },
  "◌ู": { form: "◌ู", sound: "uu" },
  "เ◌็": { form: "เ◌็", sound: "e" },              // short e when an ending follows
  "เ◌": { form: "เ◌", sound: "ee" },
  "แ◌": { form: "แ◌", sound: "ae" },
  "โ◌": { form: "โ◌", sound: "oo" },
  "◌อ": { form: "◌อ", sound: "aw" },
  "เ◌อ": { form: "เ◌อ", sound: "əə" },
  "เ◌ือ": { form: "เ◌ือ", sound: "ʉa" },
  "◌ัว": { form: "◌ัว", sound: "ua" },
  "◌ว": { form: "◌ว", sound: "ua" },               // ัว loses its ั before an ending
  "ไ◌": { form: "ไ◌", sound: "ai" },
  "ใ◌": { form: "ใ◌", sound: "ai" },
  "◌ำ": { form: "◌ำ", sound: "am" },
  "เ◌า": { form: "เ◌า", sound: "ao" },
  "เ◌ีย": { form: "เ◌ีย", sound: "ia" },
};

const SPELLINGS = {
  // Greetings
  "สวัสดี": ["ส|-a", "ว|◌ั|ส", "ด|◌ี"],
  "ขอบคุณ": ["ข|◌อ|บ", "ค|◌ุ|ณ"],
  "ครับ": ["คร|◌ั|บ"],
  "ค่ะ": ["ค|◌ะ||่"],
  "ใช่": ["ช|ใ◌||่"],
  "ไม่": ["ม|ไ◌||่"],
  "ขอโทษ": ["ข|◌อ", "ท|โ◌|ษ"],
  "ไม่เป็นไร": ["ม|ไ◌||่", "ป|เ◌็|น", "ร|ไ◌"],
  "สบายดี": ["ส|-a", "บ|◌า|ย", "ด|◌ี"],
  "ไหม": ["หม|ไ◌"],
  // People
  "ผม": ["ผ|-o|ม"],
  "ฉัน": ["ฉ|◌ั|น"],
  "คุณ": ["ค|◌ุ|ณ"],
  "เขา": ["ข|เ◌า"],
  "ชื่อ": ["ช|◌ือ||่"],
  "อะไร": ["อ|◌ะ", "ร|ไ◌"],
  "เป็น": ["ป|เ◌็|น"],
  "เพื่อน": ["พ|เ◌ือ|น|่"],
  "แฟน": ["ฟ|แ◌|น"],
  "คนไทย": ["ค|-o|น", "ท|ไ◌|ย||YSIL"],
  "ยินดีที่ได้รู้จัก": ["ย|◌ิ|น", "ด|◌ี", "ท|◌ี||่", "ด|ไ◌||้", "ร|◌ู||้", "จ|◌ั|ก"],
  // Food
  "กิน": ["ก|◌ิ|น"],
  "ข้าว": ["ข|◌า|ว|้"],
  "น้ำ": ["น|◌ำ||้|AM"],
  "กาแฟ": ["ก|◌า", "ฟ|แ◌"],
  "อร่อย": ["อ|-a", "ร|◌อ|ย|่"],
  "มาก": ["ม|◌า|ก"],
  "เผ็ด": ["ผ|เ◌็|ด"],
  "หิว": ["ห|◌ิ|ว"],
  "ผัดไทย": ["ผ|◌ั|ด", "ท|ไ◌|ย||YSIL"],
  "ส้มตำ": ["ส|-o|ม|้", "ต|◌ำ"],
  // Numbers
  "หนึ่ง": ["หน|◌ึ|ง|่"],
  "สอง": ["ส|◌อ|ง"],
  "สาม": ["ส|◌า|ม"],
  "สี่": ["ส|◌ี||่"],
  "ห้า": ["ห|◌า||้"],
  "หก": ["ห|-o|ก"],
  "เจ็ด": ["จ|เ◌็|ด"],
  "แปด": ["ป|แ◌|ด"],
  "เก้า": ["ก|เ◌า||้"],
  "สิบ": ["ส|◌ิ|บ"],
  "บาท": ["บ|◌า|ท"],
  "เท่าไหร่": ["ท|เ◌า||่", "หร|ไ◌||่"],
  // Family
  "พ่อ": ["พ|◌อ||่"],
  "แม่": ["ม|แ◌||่"],
  "พี่": ["พ|◌ี||่"],
  "น้อง": ["น|◌อ|ง|้"],
  "ครอบครัว": ["คร|◌อ|บ", "คร|◌ัว"],
  "บ้าน": ["บ|◌า|น|้"],
  "ของ": ["ข|◌อ|ง"],
  "มี": ["ม|◌ี"],
  "ไป": ["ป|ไ◌"],
  "คน": ["ค|-o|น"],
  // Sweet talk
  "รัก": ["ร|◌ั|ก"],
  "ที่รัก": ["ท|◌ี||่", "ร|◌ั|ก"],
  "คิดถึง": ["ค|◌ิ|ด", "ถ|◌ึ|ง"],
  "สวย": ["ส|◌ว|ย"],
  "น่ารัก": ["น|◌า||่", "ร|◌ั|ก"],
  "นะ": ["น|◌ะ"],
  "ฝันดี": ["ฝ|◌ั|น", "ด|◌ี"],
  "หรือยัง": ["หร|◌ือ", "ย|◌ั|ง"],
  "เธอ": ["ธ|เ◌อ"],
};
