// Emirati & Gulf Arabic dialect fingerprinting heuristics

const EMIRATI_MARKERS = [
  "وايد", "جذي", "جدي", "شلونك", "شلونج", "شلوني",
  "يبيلك", "يبيلج", "عيل", "ماكو", "ماكوا", "مو",
  "هيه", "هاي", "كيفك", "كيفج", "شو", "ليش",
  "خوش", "تعال", "تعالي", "يالله", "زين",
  "هالـ", "هذولا", "ذولا", "هاذا", "هاذي",
  "چذي", "ايه والله", "لا والله", "بعدين",
  "عشان", "الحين", "دقيقة", "ولا ايه",
];

const GULF_MARKERS = [
  "شلونك", "كيفك", "وش", "وين", "ليش",
  "ماكو", "مافي", "جذي", "كذا", "هكذا",
  "خلاص", "تعال", "يبي", "ابي", "راح",
  "قاعد", "قاعدة", "جالس", "يلا", "يالله",
  "صح", "غلط", "بس", "لكن", "بعد",
];

const MSA_MARKERS = [
  "إن", "أن", "لأن", "حيث", "إذ", "إذا",
  "الذي", "التي", "الذين", "اللواتي",
  "يجب", "ينبغي", "يمكن", "سوف", "قد",
  "ومع ذلك", "علاوة على", "بالإضافة إلى",
  "من خلال", "على الرغم", "في حين",
  "أولاً", "ثانياً", "ثالثاً", "أخيراً",
  "خلاصة القول", "في الختام", "وفي هذا السياق",
];

const AI_ARABIC_PATTERNS = [
  // Overly formal transitions common in AI-generated Arabic
  "من الجدير بالذكر",
  "تجدر الإشارة إلى",
  "في هذا الصدد",
  "وفي هذا الإطار",
  "على صعيد آخر",
  "في سياق متصل",
  "ومما سبق يتضح",
  "وانطلاقاً من ذلك",
  "وخلاصة القول",
  "في ضوء ما سبق",
  "لا يخفى على أحد",
  "من المعلوم أن",
  "من الثابت أن",
  "لا شك في أن",
];

const CODE_SWITCH_PATTERNS = [
  /[a-zA-Z]+.*[\u0600-\u06FF]/,
  /[\u0600-\u06FF].*[a-zA-Z]+/,
];

export type DialectResult = "emirati" | "gulf" | "msa" | "mixed" | "other";

export function detectDialect(text: string): {
  dialect: DialectResult;
  confidence: "high" | "medium" | "low";
  markers_found: string[];
} {
  const emaratiHits = EMIRATI_MARKERS.filter((m) => text.includes(m));
  const gulfHits = GULF_MARKERS.filter((m) => text.includes(m));
  const msaHits = MSA_MARKERS.filter((m) => text.includes(m));
  const hasCodeSwitch = CODE_SWITCH_PATTERNS.some((p) => p.test(text));

  const total = emaratiHits.length + gulfHits.length + msaHits.length;

  let dialect: DialectResult = "other";
  let confidence: "high" | "medium" | "low" = "low";
  let markers_found: string[] = [];

  if (emaratiHits.length >= 2) {
    dialect = "emirati";
    confidence = emaratiHits.length >= 4 ? "high" : "medium";
    markers_found = emaratiHits;
  } else if (gulfHits.length >= 2) {
    dialect = "gulf";
    confidence = gulfHits.length >= 4 ? "high" : "medium";
    markers_found = gulfHits;
  } else if (msaHits.length >= 3) {
    dialect = "msa";
    confidence = msaHits.length >= 6 ? "high" : "medium";
    markers_found = msaHits;
  } else if (total > 0) {
    dialect = hasCodeSwitch ? "mixed" : "other";
    confidence = "low";
    markers_found = [...emaratiHits, ...gulfHits, ...msaHits];
  } else if (hasCodeSwitch) {
    dialect = "mixed";
    confidence = "medium";
  }

  return { dialect, confidence, markers_found };
}

export function computeAIPatternScore(text: string): number {
  // Returns a 0–1 score where higher = more AI-like based on heuristics
  const aiHits = AI_ARABIC_PATTERNS.filter((p) => text.includes(p)).length;
  const sentences = text.split(/[.!؟\n]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  // Check for uniform sentence length (AI tends to be consistent)
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((acc, l) => acc + Math.pow(l - avgLen, 2), 0) /
    lengths.length;
  const stdDev = Math.sqrt(variance);
  const uniformityScore = stdDev < 5 ? 0.2 : 0; // low variance = more AI-like

  const aiPatternScore = Math.min(aiHits / 3, 1) * 0.4;

  return aiPatternScore + uniformityScore;
}
