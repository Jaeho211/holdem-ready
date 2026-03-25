import type { HoldemQuestion } from "../training-data";

type GlossaryEntry = {
  label: string;
  short: string;
  details: string[];
};

export const GLOSSARY_TERMS = {
  utg: {
    label: "UTG",
    short: "Under the gun, the first seat to act preflop.",
    details: ["UTG opens should be tighter than late-position opens."],
  },
  mp: {
    label: "MP",
    short: "Middle position, between early and late position.",
    details: ["Ranges can widen a bit compared with UTG."],
  },
  hj: {
    label: "HJ",
    short: "Hijack, the seat right before the cutoff.",
    details: ["A late-ish position that can open wider than early seats."],
  },
  co: {
    label: "CO",
    short: "Cutoff, the seat right before the button.",
    details: ["One of the best seats to open and apply pressure from."],
  },
  button: {
    label: "Button",
    short: "Best position postflop because you act last.",
    details: ["This is the classic seat for steals and in-position calls."],
  },
  sb: {
    label: "SB",
    short: "Small blind, forced to post half a blind preflop.",
    details: ["It is the worst postflop seat because you act first."],
  },
  bb: {
    label: "BB",
    short: "Big blind, forced to post one blind preflop.",
    details: ["You close the preflop action but play out of position often."],
  },
  open: {
    label: "Open Raise",
    short: "The first voluntary raise before anyone else enters the pot.",
    details: ["Opening ranges change a lot by position."],
  },
  steal: {
    label: "Steal",
    short: "An open raise aimed at winning the blinds immediately.",
    details: ["Usually happens from the button, cutoff, or small blind."],
  },
  isoRaise: {
    label: "Iso-Raise",
    short: "Raising over limpers to isolate and play heads-up in position.",
    details: ["Calling behind often invites more players into the pot."],
  },
  limp: {
    label: "Limp",
    short: "A preflop call with no raise in front, usually just completing the big blind.",
    details: [
      "A limp is a specific kind of preflop call. Calling after a raise is not a limp.",
      "A limper is the player who entered the pot that way.",
      "Limpers are common iso-raise targets in live low stakes.",
    ],
  },
  blindDefense: {
    label: "Blind Defense",
    short: "Calling or raising from the blinds versus a preflop open.",
    details: ["Price, hand playability, and position all matter here."],
  },
  foldToYou: {
    label: "Folded To You",
    short: "Everyone folded and the action is now on you unopened.",
    details: ["This is a natural spot to widen your opening range."],
  },
  offsuitBroadway: {
    label: "Offsuit Broadway",
    short: "Two broadway cards of different suits, like AJo or KTo.",
    details: ["These hands get dominated more often than suited versions."],
  },
  suitedBroadway: {
    label: "Suited Broadway",
    short: "Two suited broadway cards, like QJs or KTs.",
    details: ["They can make strong top pairs, straights, and flushes."],
  },
  broadway: {
    label: "Broadway",
    short: "High cards Ten through Ace.",
    details: ["Broadway combos often make strong one-pair hands."],
  },
  suitedConnector: {
    label: "Suited Connector",
    short: "Connected suited cards, like 76s or 98s.",
    details: ["These hands play well in position and deep stacks."],
  },
  suitedAce: {
    label: "Suited Ace",
    short: "An ace with a suited side card, like A5s.",
    details: ["Suited aces keep nut-flush potential and wheel equity."],
  },
  smallPair: {
    label: "Small Pair",
    short: "Pocket pairs below the strong overpair zone, like 55.",
    details: ["A common reason to continue is set value at a good price."],
  },
  dominatedHand: {
    label: "Dominated Hand",
    short: "A hand often up against better versions of the same high card.",
    details: ["AJo vs AQ or KJo vs KQ are classic domination spots."],
  },
  board: {
    label: "Board",
    short: "The shared community cards in the middle of the table.",
    details: ["Board texture shapes who has the range and nut advantage."],
  },
  wetBoard: {
    label: "Wet Board",
    short: "A connected or two-tone board with many draw possibilities.",
    details: ["Wet boards increase the value of protection and strong draws."],
  },
  topPair: {
    label: "Top Pair",
    short: "A pair made with the highest card on the board.",
    details: ["Strong, but not strong enough to auto-stack off every time."],
  },
  callDown: {
    label: "Call Down",
    short: "Continuing with calls across streets instead of raising.",
    details: ["Often used when you want weaker hands and bluffs to stay in."],
  },
  madeHand: {
    label: "Made Hand",
    short: "A hand that is already complete, like a pair, two pair, or a set.",
    details: ["Strong made hands often want value and protection on wet boards."],
  },
  weakDraw: {
    label: "Weak Draw",
    short: "A draw with limited outs or poor implied odds.",
    details: ["Gutshots are a common example of a weak draw."],
  },
  strongDraw: {
    label: "Strong Draw",
    short: "A draw with many outs or extra pair/overcard equity.",
    details: ["Flush draws and combo draws often fit this bucket."],
  },
  gutshot: {
    label: "Gutshot",
    short: "Inside straight draw needing one specific rank.",
    details: ["Usually 4 outs.", "Example: 5-6-8-9 needs a 7."],
  },
  flushDraw: {
    label: "Flush Draw",
    short: "Four cards to a flush with one more suited card needed.",
    details: ["A standard flush draw has 9 outs."],
  },
  comboDraw: {
    label: "Combo Draw",
    short: "A draw holding multiple ways to improve at once.",
    details: ["Examples include flush draw plus straight draw or overcards."],
  },
  set: {
    label: "Set",
    short: "Trips made with a pocket pair and one matching board card.",
    details: ["Sets are premium value hands, especially on wet boards."],
  },
  checkRaise: {
    label: "Check-Raise",
    short: "Checking first, then raising after an opponent bets.",
    details: ["It represents strength and pressures capped ranges."],
  },
  cBet: {
    label: "C-Bet",
    short: "Continuation bet made by the preflop aggressor.",
    details: ["Board texture matters more than betting every flop blindly."],
  },
  twoPair: {
    label: "Two Pair",
    short: "A made hand containing two separate pairs.",
    details: ["Strong, but still vulnerable on dynamic boards."],
  },
  donkBet: {
    label: "Donk Bet",
    short: "A lead bet from the out-of-position player into the aggressor.",
    details: ["Small donk bets can cap ranges or set up cheap turns."],
  },
  overpair: {
    label: "Overpair",
    short: "A pocket pair higher than the top card on the board.",
    details: ["Strong one-pair hand, but not invincible versus aggression."],
  },
  multiway: {
    label: "Multiway",
    short: "A pot with more than two players still involved.",
    details: ["Big bets tend to be more honest multiway than heads-up."],
  },
  tptk: {
    label: "TPTK",
    short: "Top pair with top kicker.",
    details: ["A strong one-pair hand, but still foldable in tough spots."],
  },
  overbet: {
    label: "Overbet",
    short: "A bet larger than the current size of the pot.",
    details: ["Overbets polarize ranges toward strong value and bluffs."],
  },
  openEnded: {
    label: "Open-Ended",
    short: "Straight draw that can complete on either end.",
    details: ["Usually 8 outs when both ends are clean."],
  },
  overcards: {
    label: "Overcards",
    short: "Hole cards ranked higher than the current board cards.",
    details: ["They add equity when your hand has not paired yet."],
  },
  outs: {
    label: "Outs",
    short: "Number of unseen cards that improve your hand.",
    details: ["Count only clean outs that really help."],
  },
  turnToRiver: {
    label: "Turn to River",
    short: "Only one card remains to come after the turn.",
    details: ["Use one-card probability.", "4 outs: 4/46 ≈ 8.7% (~9%)."],
  },
  flopToRiver: {
    label: "Flop to River",
    short: "Two cards remain, so draw equity is much higher than on the turn.",
    details: ["The rule of 4 is a fast shortcut from flop to river."],
  },
  potOdds: {
    label: "Pot Odds",
    short: "Call / (Pot + Call). Compare this with your equity.",
    details: ["Example: pot 100, call 50 -> 50/200 = 25%."],
  },
  requiredEquity: {
    label: "Required Equity",
    short: "The minimum winning chance needed to make a call break even.",
    details: ["Pot odds tell you what required equity a call needs."],
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryTermKey = keyof typeof GLOSSARY_TERMS;

const MIN_GLOSSARY_TERMS = 2;
const MAX_GLOSSARY_TERMS = 3;

const TERM_PRIORITY: Record<GlossaryTermKey, number> = {
  utg: 10,
  mp: 10,
  hj: 10,
  co: 10,
  button: 10,
  sb: 10,
  bb: 10,
  open: 6,
  steal: 8,
  isoRaise: 9,
  limp: 9,
  blindDefense: 8,
  foldToYou: 8,
  offsuitBroadway: 8,
  suitedBroadway: 8,
  broadway: 6,
  suitedConnector: 8,
  suitedAce: 8,
  smallPair: 8,
  dominatedHand: 6,
  board: 4,
  wetBoard: 8,
  topPair: 9,
  callDown: 5,
  madeHand: 5,
  weakDraw: 6,
  strongDraw: 6,
  gutshot: 9,
  flushDraw: 8,
  comboDraw: 9,
  set: 10,
  checkRaise: 9,
  cBet: 7,
  twoPair: 9,
  donkBet: 8,
  overpair: 9,
  multiway: 8,
  tptk: 8,
  overbet: 9,
  openEnded: 9,
  overcards: 8,
  outs: 10,
  turnToRiver: 9,
  flopToRiver: 9,
  potOdds: 10,
  requiredEquity: 10,
};

const POSITION_TERM_MAP: Partial<Record<string, GlossaryTermKey>> = {
  UTG: "utg",
  MP: "mp",
  HJ: "hj",
  CO: "co",
  BTN: "button",
  SB: "sb",
  BB: "bb",
};

const TAG_TERM_MAP: Partial<Record<string, readonly GlossaryTermKey[]>> = {
  "오프수트 브로드웨이": ["offsuitBroadway"],
  "버튼 스틸": ["steal"],
  "수딧 커넥터": ["suitedConnector"],
  "SB 디펜스": ["sb", "blindDefense"],
  "컷오프 오픈": ["co", "open"],
  "강한 브로드웨이": ["broadway"],
  "BB 디펜스": ["bb", "blindDefense"],
  "작은 페어": ["smallPair"],
  "수딧 에이스": ["suitedAce"],
  "미들 포지션": ["mp"],
  "지배당하는 핸드": ["dominatedHand"],
  "림퍼 아이솔레이트": ["limp", "isoRaise"],
  "수딧 브로드웨이": ["suitedBroadway"],
  "SB 스틸": ["sb", "steal"],
  "폴드 투 유": ["foldToYou"],
  "탑페어 운영": ["topPair"],
  "플랍 콜다운": ["callDown"],
  "강한 메이드 핸드": ["madeHand"],
  "젖은 보드": ["wetBoard"],
  "젖은 Board": ["wetBoard"],
  "약한 드로우": ["weakDraw"],
  "강한 드로우": ["strongDraw"],
  "오버페어 운영": ["overpair"],
  멀티웨이: ["multiway"],
  "아웃 계산": ["outs"],
  "턴 확률": ["turnToRiver"],
  "플랍 확률": ["flopToRiver"],
  "포트 오즈": ["potOdds"],
  "필요 승률": ["requiredEquity"],
  "콤보 드로우": ["comboDraw"],
};

const TEXT_TERM_PATTERNS: ReadonlyArray<{
  term: GlossaryTermKey;
  patterns: readonly string[];
}> = [
  { term: "open", patterns: [" 오픈", "open"] },
  { term: "steal", patterns: ["스틸", "steal"] },
  { term: "isoRaise", patterns: ["아이솔레이트", "isolate", "iso-raise", "iso raise"] },
  { term: "limp", patterns: ["림프", "limp"] },
  { term: "blindDefense", patterns: ["디펜스", "defense", "defend"] },
  { term: "foldToYou", patterns: ["폴드 투 유", "folded to you"] },
  { term: "offsuitBroadway", patterns: ["오프수트 브로드웨이", "offsuit broadway"] },
  { term: "suitedBroadway", patterns: ["수딧 브로드웨이", "suited broadway"] },
  { term: "suitedConnector", patterns: ["수딧 커넥터", "suited connector"] },
  { term: "suitedAce", patterns: ["수딧 에이스", "suited ace"] },
  { term: "smallPair", patterns: ["작은 페어", "small pair"] },
  { term: "dominatedHand", patterns: ["지배당", "dominated"] },
  { term: "board", patterns: ["board", "보드"] },
  { term: "wetBoard", patterns: ["젖은 보드", "젖은 board", "wet board", "투톤"] },
  { term: "topPair", patterns: ["탑페어", "top pair"] },
  { term: "callDown", patterns: ["콜다운", "call down"] },
  { term: "madeHand", patterns: ["메이드 핸드", "made hand"] },
  { term: "weakDraw", patterns: ["약한 드로우", "weak draw"] },
  { term: "strongDraw", patterns: ["강한 드로우", "strong draw"] },
  { term: "gutshot", patterns: ["거트샷", "gutshot"] },
  { term: "flushDraw", patterns: ["플러시 드로우", "flush draw"] },
  { term: "comboDraw", patterns: ["콤보 드로우", "combo draw"] },
  { term: "set", patterns: ["셋", " set"] },
  { term: "checkRaise", patterns: ["체크레이즈", "check-raise", "check raise"] },
  { term: "cBet", patterns: ["c-bet", "cbet", "컨티뉴에이션 베팅"] },
  { term: "twoPair", patterns: ["투페어", "two pair"] },
  { term: "donkBet", patterns: ["돈크벳", "donk bet", "donkbet"] },
  { term: "overpair", patterns: ["오버페어", "overpair", "over pair"] },
  { term: "multiway", patterns: ["멀티웨이", "multiway"] },
  { term: "tptk", patterns: ["tptk", "탑키커", "top kicker"] },
  { term: "overbet", patterns: ["오버벳", "overbet", "over bet"] },
  { term: "openEnded", patterns: ["오픈엔디드", "open-ended", "open ended"] },
  { term: "overcards", patterns: ["오버카드", "overcards", "overcard"] },
  { term: "outs", patterns: ["아웃", "outs"] },
  { term: "turnToRiver", patterns: ["turn to river", "리버 한 장", "턴 확률"] },
  { term: "flopToRiver", patterns: ["flop to river", "턴과 리버", "플랍 확률"] },
  { term: "potOdds", patterns: ["포트 오즈", "팟 오즈", "pot odds"] },
  { term: "requiredEquity", patterns: ["필요 승률", "required equity"] },
];

const CATEGORY_FALLBACK_TERMS: Record<
  HoldemQuestion["category"],
  readonly GlossaryTermKey[]
> = {
  preflop: ["open", "blindDefense"],
  postflop: ["board", "topPair"],
  odds: ["outs", "potOdds"],
};

const matchesAny = (text: string, patterns: readonly string[]) =>
  patterns.some((pattern) => text.includes(pattern));

const getQuestionText = (question: HoldemQuestion) => {
  const parts = [
    question.title,
    question.prompt,
    question.explanation,
    question.pitfall,
    question.tags.join(" "),
    question.actionBefore,
  ];

  if (question.category === "preflop") {
    parts.push(question.position, question.hand);
  }

  if (question.category === "postflop") {
    parts.push(question.position, question.preflopAction);
  }

  if (question.category === "odds") {
    parts.push(question.mathFocus);
  }

  return parts.join(" ").toLowerCase();
};

export function getQuestionGlossaryTerms(question: HoldemQuestion) {
  const terms = new Map<GlossaryTermKey, number>();
  const text = getQuestionText(question);
  let nextOrder = 0;

  const registerTerm = (term: GlossaryTermKey) => {
    if (!terms.has(term)) {
      terms.set(term, nextOrder);
      nextOrder += 1;
    }
  };

  if (question.category === "preflop") {
    const positionTerm = POSITION_TERM_MAP[question.position];

    if (positionTerm) {
      registerTerm(positionTerm);
    }
  }

  for (const { term, patterns } of TEXT_TERM_PATTERNS) {
    if (matchesAny(text, patterns)) {
      registerTerm(term);
    }
  }

  for (const tag of question.tags) {
    for (const term of TAG_TERM_MAP[tag] ?? []) {
      registerTerm(term);
    }
  }

  if (question.category === "odds" && question.mathFocus.toLowerCase().includes("turn to river")) {
    registerTerm("turnToRiver");
  }

  if (question.category === "odds" && question.mathFocus.toLowerCase().includes("flop to river")) {
    registerTerm("flopToRiver");
  }

  for (const fallback of CATEGORY_FALLBACK_TERMS[question.category]) {
    if (terms.size >= MIN_GLOSSARY_TERMS) break;
    registerTerm(fallback);
  }

  return [...terms.keys()]
    .sort((left, right) => {
      const priorityGap = TERM_PRIORITY[right] - TERM_PRIORITY[left];

      if (priorityGap !== 0) {
        return priorityGap;
      }

      return (terms.get(left) ?? 0) - (terms.get(right) ?? 0);
    })
    .slice(0, MAX_GLOSSARY_TERMS);
}
