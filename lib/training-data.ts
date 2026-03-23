export type TrainingCategory = "preflop" | "postflop" | "odds";
export type AppTrainingCategory = TrainingCategory | "liveTips";
export type DecisionChoice = "fold" | "call" | "raise";
export type AnswerChoice = DecisionChoice | string;

export type ChoiceOption = {
  value: AnswerChoice;
  label: string;
};

type QuestionBase = {
  id: string;
  category: TrainingCategory;
  difficulty: "기초" | "실전" | "응용";
  title: string;
  prompt: string;
  explanation: string;
  pitfall: string;
  tags: string[];
};

export type PreflopQuestion = QuestionBase & {
  category: "preflop";
  hand: string;
  position: string;
  table: string;
  stack: string;
  actionBefore: string;
  correct: DecisionChoice;
};

export type PostflopQuestion = QuestionBase & {
  category: "postflop";
  holeCards: string[];
  board: string[];
  pot: string;
  villainBet: string;
  actionBefore: string;
  stack: string;
  correct: DecisionChoice;
};

export type OddsQuestion = QuestionBase & {
  category: "odds";
  holeCards?: string[];
  board?: string[];
  pot: string;
  villainBet: string;
  actionBefore: string;
  mathFocus: string;
  options: ChoiceOption[];
  correct: AnswerChoice;
};

export type HoldemQuestion =
  | PreflopQuestion
  | PostflopQuestion
  | OddsQuestion;

export const categoryMeta: Record<
  AppTrainingCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    difficulty: string;
    accent: string;
    emphasis: string;
  }
> = {
  preflop: {
    label: "프리플랍",
    shortLabel: "프리플랍",
    description: "포지션과 핸드 선택부터 정리합니다.",
    difficulty: "기초 다지기",
    accent: "from-emerald-400/25 via-emerald-200/10 to-transparent",
    emphasis: "오픈 범위와 SB/BB 방어",
  },
  postflop: {
    label: "포스트플랍",
    shortLabel: "포스트",
    description: "탑페어, 드로우, 강한 메이드 핸드 결정을 반복합니다.",
    difficulty: "실전 판단",
    accent: "from-amber-300/25 via-yellow-100/10 to-transparent",
    emphasis: "탑페어 과대평가 줄이기",
  },
  odds: {
    label: "확률 훈련",
    shortLabel: "확률",
    description: "아웃 수와 포트 오즈 감각을 짧게 훈련합니다.",
    difficulty: "보조 훈련",
    accent: "from-cyan-300/25 via-sky-200/10 to-transparent",
    emphasis: "필요 승률과 드로우 가격",
  },
  liveTips: {
    label: "라이브 팁",
    shortLabel: "팁",
    description: "라스베가스 테이블에서 당황하지 않게 체크리스트로 정리합니다.",
    difficulty: "현장 적응",
    accent: "from-rose-300/25 via-orange-200/10 to-transparent",
    emphasis: "액션 순서와 매너",
  },
};

export const questionBank: HoldemQuestion[] = [
  {
    id: "pre-001",
    category: "preflop",
    difficulty: "기초",
    title: "UTG에서 AJo",
    prompt: "라이브 9인 테이블, 앞선 액션이 없을 때 UTG의 AJo는 너무 자주 문제를 만듭니다.",
    explanation:
      "초반 포지션에서는 뒤에서 더 강한 A와 브로드웨이에 지배당하기 쉽습니다. 초보 기준으로는 접고 더 좋은 오픈을 기다리는 편이 안정적입니다.",
    pitfall: "오프수트 브로드웨이를 초반 포지션에서 과대평가하는 실수",
    tags: ["초반 포지션", "오프수트 브로드웨이"],
    hand: "AJo",
    position: "UTG",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "모두 폴드",
    correct: "fold",
  },
  {
    id: "pre-002",
    category: "preflop",
    difficulty: "기초",
    title: "버튼에서 76s",
    prompt: "모두 폴드로 넘어온 버튼은 스틸하기 좋은 자리입니다.",
    explanation:
      "버튼에서 수딧 커넥터는 포지션 이점이 커서 오픈하기 좋습니다. 라이브 저스테이크에서는 블라인드가 많이 포기해 바로 팟을 가져가는 경우도 잦습니다.",
    pitfall: "플레이 가능 핸드를 너무 소극적으로 콜만 하거나 버리는 실수",
    tags: ["버튼 스틸", "수딧 커넥터"],
    hand: "76s",
    position: "BTN",
    table: "9-handed / 120bb",
    stack: "120bb 유효 스택",
    actionBefore: "모두 폴드",
    correct: "raise",
  },
  {
    id: "pre-003",
    category: "preflop",
    difficulty: "기초",
    title: "SB에서 KTo vs HJ 오픈",
    prompt: "스몰블라인드에서 포지션 없이 애매한 오프수트 브로드웨이를 방어하면 이후 스트리트가 어렵습니다.",
    explanation:
      "HJ 오픈에 대해 KTo는 지배당하기 쉽고, 스몰블라인드라서 이후에도 계속 불리합니다. 초보 기준으로는 과감히 폴드가 더 낫습니다.",
    pitfall: "스몰블라인드에서 너무 넓게 콜해 힘든 스팟을 만드는 실수",
    tags: ["SB 디펜스", "오프수트 브로드웨이"],
    hand: "KTo",
    position: "SB",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "HJ 3bb 오픈, 나머지 폴드",
    correct: "fold",
  },
  {
    id: "pre-004",
    category: "preflop",
    difficulty: "기초",
    title: "CO에서 AQo",
    prompt: "컷오프에서 AQo는 명확한 밸류 오픈입니다.",
    explanation:
      "뒤에 남은 플레이어가 적고 핸드 강도도 충분합니다. 이런 핸드까지 머뭇거리면 좋은 포지션 수익을 놓치게 됩니다.",
    pitfall: "괜찮은 강도의 브로드웨이를 과도하게 소극적으로 운영하는 실수",
    tags: ["컷오프 오픈", "강한 브로드웨이"],
    hand: "AQo",
    position: "CO",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "모두 폴드",
    correct: "raise",
  },
  {
    id: "pre-005",
    category: "preflop",
    difficulty: "실전",
    title: "BB에서 55 vs 버튼 민레이즈",
    prompt: "빅블라인드에서 작은 페어는 적절한 가격이면 세트 마이닝과 쇼다운 가치가 있습니다.",
    explanation:
      "버튼 민레이즈에 55는 좋은 가격으로 콜할 수 있습니다. 지나치게 3베팅을 섞기보다 기본은 콜 쪽이 안정적입니다.",
    pitfall: "빅블라인드 방어 핸드를 필요 이상으로 공격적으로 바꾸는 실수",
    tags: ["BB 디펜스", "작은 페어"],
    hand: "55",
    position: "BB",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "BTN 2bb 오픈, SB 폴드",
    correct: "call",
  },
  {
    id: "pre-006",
    category: "preflop",
    difficulty: "실전",
    title: "MP에서 A5s",
    prompt: "A5s는 수딧 에이스와 휠 포텐셜 덕분에 오픈 가치가 있습니다.",
    explanation:
      "미들 포지션에서 A5s는 플러시와 스트레이트 가능성이 있어 충분히 오픈 가능한 핸드입니다. 라이브 게임에서 블라인드 폴드도 자주 얻습니다.",
    pitfall: "수딧 에이스를 너무 타이트하게 접어 좋은 스팟을 놓치는 실수",
    tags: ["수딧 에이스", "미들 포지션"],
    hand: "A5s",
    position: "MP",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "모두 폴드",
    correct: "raise",
  },
  {
    id: "pre-007",
    category: "preflop",
    difficulty: "기초",
    title: "UTG에서 KJo",
    prompt: "KJo는 초반 포지션에서 지배 문제가 더 심합니다.",
    explanation:
      "KJo는 KQ, AK, AJ 등에 자주 끌려다닙니다. 특히 라이브 풀링에서는 뒤에서 강한 콜 범위를 맞기 쉬워 초보 기준으로는 폴드가 편합니다.",
    pitfall: "KJ 계열을 초반 포지션에서 과신하는 실수",
    tags: ["초반 포지션", "지배당하는 핸드"],
    hand: "KJo",
    position: "UTG",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "모두 폴드",
    correct: "fold",
  },
  {
    id: "pre-008",
    category: "preflop",
    difficulty: "실전",
    title: "버튼에서 A9o vs 림프 두 명",
    prompt: "라이브 저스테이크에서는 버튼에서 림프를 아이솔레이트하는 가치가 큽니다.",
    explanation:
      "포지션이 있고 A9o는 림퍼 상대로 충분한 우위를 가질 수 있습니다. 콜만 하면 블라인드까지 얽혀 어려운 멀티웨이가 됩니다.",
    pitfall: "좋은 아이솔레이트 기회를 콜로 흘려 보내는 실수",
    tags: ["버튼 스틸", "림퍼 아이솔레이트"],
    hand: "A9o",
    position: "BTN",
    table: "9-handed / 110bb",
    stack: "110bb 유효 스택",
    actionBefore: "UTG 림프, HJ 림프, 나머지 폴드",
    correct: "raise",
  },
  {
    id: "pre-009",
    category: "preflop",
    difficulty: "실전",
    title: "BB에서 QJs vs CO 오픈 + BTN 콜",
    prompt: "빅블라인드에서 수딧 브로드웨이는 멀티웨이로도 플레이 가능성이 남아 있습니다.",
    explanation:
      "QJs는 플러시와 스트레이트 가능성이 있고, 이미 팟에 돈이 많이 들어가 콜 가격도 괜찮습니다. 과도한 3베팅보다는 콜이 무난합니다.",
    pitfall: "좋은 멀티웨이 핸드를 지나치게 공격적으로 바꾸거나 너무 쉽게 버리는 실수",
    tags: ["BB 디펜스", "수딧 브로드웨이"],
    hand: "QJs",
    position: "BB",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "CO 3bb 오픈, BTN 콜, SB 폴드",
    correct: "call",
  },
  {
    id: "pre-010",
    category: "preflop",
    difficulty: "실전",
    title: "SB에서 Q9s 폴드 투 유",
    prompt: "폴드로 돌아온 스몰블라인드에서는 빅블라인드 한 명만 남아 있어 공격적으로 열 수 있습니다.",
    explanation:
      "Q9s는 완벽한 프리미엄은 아니지만 헤즈업 포지션 불리함을 감수할 만큼 오픈 가치가 있습니다. 지나치게 타이트하면 블라인드를 너무 쉽게 넘겨줍니다.",
    pitfall: "폴드 투 유 스팟에서 스몰블라인드를 지나치게 타이트하게 운영하는 실수",
    tags: ["SB 스틸", "폴드 투 유"],
    hand: "Q9s",
    position: "SB",
    table: "9-handed / 100bb",
    stack: "100bb 유효 스택",
    actionBefore: "모두 폴드",
    correct: "raise",
  },
  {
    id: "post-001",
    category: "postflop",
    difficulty: "기초",
    title: "탑페어, 평범한 보드",
    prompt: "탑페어라도 상대의 전체 범위를 계속 남겨두는 쪽이 좋은 보드입니다.",
    explanation:
      "상대의 절반 팟 컨티뉴에이션 베팅에 QJ의 탑페어는 충분히 콜 가치가 있습니다. 이 보드에서 바로 레이즈하면 약한 블러프를 많이 접게 만듭니다.",
    pitfall: "탑페어를 잡자마자 과도하게 팟을 키우는 실수",
    tags: ["탑페어 운영", "플랍 콜다운"],
    holeCards: ["Qs", "Js"],
    board: ["Qh", "7d", "2s"],
    pot: "6.5bb",
    villainBet: "3bb",
    actionBefore: "BB 콜 vs BTN 오픈, 플랍 체크 후 BTN c-bet",
    stack: "97bb 남음",
    correct: "call",
  },
  {
    id: "post-002",
    category: "postflop",
    difficulty: "실전",
    title: "셋으로 체크레이즈 대응",
    prompt: "강한 메이드 핸드는 젖은 보드에서 밸류와 보호를 동시에 챙겨야 합니다.",
    explanation:
      "보드가 스페이드 투톤이라 드로우가 많습니다. 셋은 체크레이즈에 다시 레이즈해 돈을 넣기 좋은 핸드입니다.",
    pitfall: "아주 강한 핸드로도 지나치게 느리게 플레이해 드로우에 공짜 카드를 주는 실수",
    tags: ["강한 메이드 핸드", "젖은 보드"],
    holeCards: ["Ah", "Ad"],
    board: ["As", "8s", "3d"],
    pot: "10bb",
    villainBet: "15bb 체크레이즈",
    actionBefore: "CO 오픈, BB 콜, 플랍에서 3bb c-bet 후 BB 체크레이즈",
    stack: "82bb 남음",
    correct: "raise",
  },
  {
    id: "post-003",
    category: "postflop",
    difficulty: "기초",
    title: "거트샷만 있는 턴",
    prompt: "약한 드로우 하나만으로 큰 턴 베팅을 계속 따라가면 누수가 큽니다.",
    explanation:
      "거트샷 4아웃으로는 턴 대형 베팅을 따라갈 가격이 잘 나오지 않습니다. 라이브 초보가 가장 자주 하는 실수가 여기서 희망콜을 하는 것입니다.",
    pitfall: "거트샷만 보고 턴 큰 베팅을 계속 콜하는 실수",
    tags: ["약한 드로우", "턴 폴드"],
    holeCards: ["Jh", "Th"],
    board: ["Ks", "8d", "3c", "2h"],
    pot: "18bb",
    villainBet: "14bb",
    actionBefore: "BTN 오픈에 BB 콜, 플랍 체크체크 후 턴에서 BB 리드",
    stack: "86bb 남음",
    correct: "fold",
  },
  {
    id: "post-004",
    category: "postflop",
    difficulty: "실전",
    title: "넛 플러시 드로우 + 오버카드",
    prompt: "강한 드로우는 서둘러 올인만 생각하기보다 가격을 보고 따라가는 라인이 많습니다.",
    explanation:
      "넛 플러시 드로우와 두 오버카드는 충분한 에퀴티를 줍니다. 반 팟 정도 베팅에는 콜이 기본이며, 초보 기준으로 단순한 콜이 실수도 적습니다.",
    pitfall: "강한 드로우를 매번 즉시 레이즈해 과도한 변동성을 만드는 실수",
    tags: ["강한 드로우", "플랍 콜다운"],
    holeCards: ["Ah", "Jh"],
    board: ["Kh", "9h", "2c"],
    pot: "12bb",
    villainBet: "6bb",
    actionBefore: "CO 오픈에 BTN 콜, 플랍에서 CO c-bet",
    stack: "94bb 남음",
    correct: "call",
  },
  {
    id: "post-005",
    category: "postflop",
    difficulty: "실전",
    title: "투페어 vs 작은 돈크벳",
    prompt: "강한 메이드 핸드로 젖은 보드를 그냥 콜만 하면 턴과 리버가 까다로워집니다.",
    explanation:
      "T9 보드에 T7으로 투페어를 만들었다면 드로우가 많은 상황입니다. 작은 돈크벳에는 레이즈로 밸류와 보호를 동시에 챙기는 편이 좋습니다.",
    pitfall: "강한 핸드인데도 드로우 보드에서 수동적으로 따라가기만 하는 실수",
    tags: ["강한 메이드 핸드", "젖은 보드"],
    holeCards: ["Ts", "7s"],
    board: ["Td", "7h", "8h"],
    pot: "11bb",
    villainBet: "3bb",
    actionBefore: "BTN 오픈에 BB 콜, 플랍에서 BB 돈크벳",
    stack: "95bb 남음",
    correct: "raise",
  },
  {
    id: "post-006",
    category: "postflop",
    difficulty: "실전",
    title: "오버페어 vs 미니 체크레이즈",
    prompt: "오버페어는 강하지만, 낮은 보드에서 작은 체크레이즈를 굳이 다시 키울 필요는 없습니다.",
    explanation:
      "보드가 아주 젖지 않았고 상대의 미니 체크레이즈 범위엔 블러프와 약한 메이드가 섞일 수 있습니다. 일단 콜로 넓게 남겨두는 편이 좋습니다.",
    pitfall: "오버페어를 들고 플랍에서 무조건 스택을 넣으려는 실수",
    tags: ["오버페어 운영", "플랍 콜다운"],
    holeCards: ["Kd", "Kc"],
    board: ["9s", "6d", "2c"],
    pot: "9bb",
    villainBet: "8bb 체크레이즈",
    actionBefore: "HJ 오픈, BB 콜, 플랍에서 3bb c-bet 후 BB 미니 체크레이즈",
    stack: "89bb 남음",
    correct: "call",
  },
  {
    id: "post-007",
    category: "postflop",
    difficulty: "응용",
    title: "멀티웨이 턴 오버벳",
    prompt: "멀티웨이에서 큰 턴 베팅은 헤즈업보다 훨씬 정직한 경우가 많습니다.",
    explanation:
      "탑페어 탑키커라도 멀티웨이 턴 오버벳은 많이 강합니다. 특히 드로우가 막힌 보드에서 상대 둘 중 하나가 강하게 밀면 과감히 접는 훈련이 필요합니다.",
    pitfall: "TPTK라서 절대 못 접겠다고 버티는 실수",
    tags: ["탑페어 운영", "멀티웨이"],
    holeCards: ["Ac", "Qd"],
    board: ["Qh", "9c", "5s", "4d"],
    pot: "26bb",
    villainBet: "28bb",
    actionBefore: "CO 오픈, BTN 콜, BB 콜, 턴에서 BB 오버벳",
    stack: "78bb 남음",
    correct: "fold",
  },
  {
    id: "post-008",
    category: "postflop",
    difficulty: "실전",
    title: "오픈엔디드 + 페어",
    prompt: "강하지는 않지만 충분히 개선 가능성이 많은 손은 가격이 좋을 때 계속 갈 수 있습니다.",
    explanation:
      "98로 T76 보드라면 오픈엔디드 스트레이트 드로우와 페어를 동시에 가지고 있습니다. 작은 베팅에는 무난하게 콜이 좋습니다.",
    pitfall: "드로우 핸드를 매번 레이즈로만 해결하려는 실수",
    tags: ["강한 드로우", "플랍 콜다운"],
    holeCards: ["9s", "8s"],
    board: ["Td", "7c", "6h"],
    pot: "8bb",
    villainBet: "2.5bb",
    actionBefore: "BTN 오픈에 BB 콜, 플랍에서 BB 체크 후 BTN c-bet",
    stack: "96bb 남음",
    correct: "call",
  },
  {
    id: "odds-001",
    category: "odds",
    difficulty: "기초",
    title: "턴에서 플러시 드로우",
    prompt: "턴에서 플러시 드로우 9아웃이 있을 때 리버 한 장을 맞힐 확률 감각을 묻는 문제입니다.",
    explanation:
      "턴에서 9아웃은 대략 9 x 2 = 18% 규칙을 적용하면 충분합니다. 엄밀히는 조금 더 높지만 실전 감각상 약 19%로 기억하면 됩니다.",
    pitfall: "플랍과 턴의 확률을 같은 숫자로 기억해 과대평가하는 실수",
    tags: ["아웃 계산", "턴 확률"],
    holeCards: ["Ah", "Jh"],
    board: ["Kh", "9h", "2c", "7s"],
    pot: "24bb",
    villainBet: "12bb",
    actionBefore: "턴에서 9아웃 플러시 드로우",
    mathFocus: "9아웃 / 턴 to 리버",
    options: [
      { value: "19", label: "약 19%" },
      { value: "28", label: "약 28%" },
      { value: "36", label: "약 36%" },
    ],
    correct: "19",
  },
  {
    id: "odds-002",
    category: "odds",
    difficulty: "기초",
    title: "플랍에서 오픈엔디드",
    prompt: "플랍에서 아웃 8개로 턴과 리버를 모두 볼 수 있을 때의 감각을 익힙니다.",
    explanation:
      "플랍에서 8아웃은 대략 8 x 4 = 32% 정도입니다. 빠르게 판단할 땐 31~32%로 외워두면 충분합니다.",
    pitfall: "오픈엔디드를 거트샷 수준으로 과소평가하는 실수",
    tags: ["아웃 계산", "플랍 확률"],
    holeCards: ["9s", "8s"],
    board: ["Td", "7c", "2h"],
    pot: "9bb",
    villainBet: "4bb",
    actionBefore: "플랍에서 오픈엔디드 스트레이트 드로우",
    mathFocus: "8아웃 / 플랍 to 리버",
    options: [
      { value: "17", label: "약 17%" },
      { value: "31", label: "약 31%" },
      { value: "46", label: "약 46%" },
    ],
    correct: "31",
  },
  {
    id: "odds-003",
    category: "odds",
    difficulty: "기초",
    title: "턴 거트샷",
    prompt: "리버 한 장만 남은 거트샷은 생각보다 훨씬 약합니다.",
    explanation:
      "4아웃이 턴에서 리버 한 장 남았으면 대략 8~9% 정도입니다. 큰 베팅을 상대할 때 희망콜을 줄이는 데 중요한 숫자입니다.",
    pitfall: "거트샷을 너무 자주 따라가며 칩을 흘리는 실수",
    tags: ["아웃 계산", "턴 확률"],
    pot: "20bb",
    villainBet: "14bb",
    actionBefore: "턴에서 4아웃 거트샷",
    mathFocus: "4아웃 / 턴 to 리버",
    options: [
      { value: "9", label: "약 9%" },
      { value: "18", label: "약 18%" },
      { value: "26", label: "약 26%" },
    ],
    correct: "9",
  },
  {
    id: "odds-004",
    category: "odds",
    difficulty: "실전",
    title: "하프 팟 베팅의 필요 승률",
    prompt: "상대가 팟의 절반을 베팅했을 때 콜에 필요한 최소 승률을 맞히는 문제입니다.",
    explanation:
      "하프 팟 베팅엔 약 25% 정도의 승률이 필요합니다. 이 기준을 머릿속에 넣어두면 드로우 콜 판단이 빨라집니다.",
    pitfall: "포트 오즈 없이 감으로만 콜하는 실수",
    tags: ["포트 오즈", "필요 승률"],
    pot: "40bb",
    villainBet: "20bb",
    actionBefore: "리버가 아닌 플랍/턴 일반 상황 가정",
    mathFocus: "상대가 하프 팟 베팅",
    options: [
      { value: "25", label: "약 25%" },
      { value: "33", label: "약 33%" },
      { value: "40", label: "약 40%" },
    ],
    correct: "25",
  },
  {
    id: "odds-005",
    category: "odds",
    difficulty: "응용",
    title: "콤보 드로우 15아웃",
    prompt: "플러시 드로우와 양방/오버카드가 겹치는 강한 드로우는 에퀴티가 매우 큽니다.",
    explanation:
      "플랍에서 15아웃은 대략 15 x 4 = 60%에 가깝지만 중복과 보정 때문에 실전 감각상 54% 안팎으로 잡으면 됩니다.",
    pitfall: "강한 콤보 드로우의 실제 힘을 몰라 너무 쉽게 포기하는 실수",
    tags: ["아웃 계산", "콤보 드로우"],
    holeCards: ["Ah", "Jh"],
    board: ["Qh", "Th", "2c"],
    pot: "18bb",
    villainBet: "9bb",
    actionBefore: "플랍에서 15아웃 콤보 드로우",
    mathFocus: "15아웃 / 플랍 to 리버",
    options: [
      { value: "29", label: "약 29%" },
      { value: "54", label: "약 54%" },
      { value: "71", label: "약 71%" },
    ],
    correct: "54",
  },
  {
    id: "odds-006",
    category: "odds",
    difficulty: "실전",
    title: "20 into 80",
    prompt: "20을 내서 최종 100을 가져오는 상황의 필요 승률을 바로 떠올리는 훈련입니다.",
    explanation:
      "20을 콜하면 총 100을 놓고 싸우게 되므로 필요한 승률은 20%입니다. 간단한 숫자는 몸에 배게 만드는 편이 좋습니다.",
    pitfall: "콜 금액과 최종 팟 크기를 구분하지 못하는 실수",
    tags: ["포트 오즈", "필요 승률"],
    pot: "80bb",
    villainBet: "20bb",
    actionBefore: "내가 20을 콜하면 총 팟이 100이 되는 상황",
    mathFocus: "20 call to win 100",
    options: [
      { value: "20", label: "20%" },
      { value: "25", label: "25%" },
      { value: "33", label: "33%" },
    ],
    correct: "20",
  },
];

export type LiveTipSection = {
  id: string;
  title: string;
  subtitle: string;
  items: {
    id: string;
    label: string;
    detail: string;
  }[];
};

export const liveTipSections: LiveTipSection[] = [
  {
    id: "seating",
    title: "테이블 앉기",
    subtitle: "처음 앉을 때 어색하지 않게 처리하는 순서",
    items: [
      {
        id: "seat-1",
        label: "플로어 또는 리스트에서 좌석 배정을 먼저 확인",
        detail: "빈자리에 바로 앉지 말고 스탭 안내를 받고 들어가는 편이 안전합니다.",
      },
      {
        id: "seat-2",
        label: "칩을 사고 나서 딜러에게 현재 게임이 어떤 블라인드인지 확인",
        detail: "1/3인지 2/5인지, 스트래들이 자주 도는지 먼저 보는 것이 중요합니다.",
      },
      {
        id: "seat-3",
        label: "첫 1~2바퀴는 플레이보다 테이블 분위기 관찰",
        detail: "누가 자주 림프하는지, 누가 큰 사이즈를 쓰는지 먼저 보는 편이 수익적입니다.",
      },
    ],
  },
  {
    id: "buyin",
    title: "바잉과 칩 관리",
    subtitle: "초보가 흔히 헷갈리는 현장 운영 포인트",
    items: [
      {
        id: "buy-1",
        label: "너무 짧은 바잉보다는 게임 기본 흐름이 보이는 금액으로 시작",
        detail: "지나친 숏스택은 의사결정이 오히려 더 불편해질 수 있습니다.",
      },
      {
        id: "buy-2",
        label: "큰 칩과 작은 칩의 단위를 먼저 익히기",
        detail: "베팅 실수는 전략 실수보다 체감 스트레스를 더 크게 만듭니다.",
      },
      {
        id: "buy-3",
        label: "리바이 기준을 미리 정하고 즉흥적으로 쫓아가지 않기",
        detail: "여행 예산과 분리된 세션 한도를 정해두는 것이 좋습니다.",
      },
    ],
  },
  {
    id: "action",
    title: "액션 순서",
    subtitle: "라이브에서 가장 민망한 실수를 줄이는 체크리스트",
    items: [
      {
        id: "act-1",
        label: "내 차례인지 꼭 확인하고 칩을 움직이기",
        detail: "차례 전 액션은 정보 노출이 되고, 경우에 따라 행동이 묶일 수 있습니다.",
      },
      {
        id: "act-2",
        label: "구두 선언을 하면 칩보다 선언이 우선하는 경우가 많음",
        detail: "\"레이즈\"를 먼저 말했으면 그 의사가 강하게 적용됩니다.",
      },
      {
        id: "act-3",
        label: "상대 올인 금액을 정확히 듣고 결정",
        detail: "칩 더미만 보고 감으로 콜하지 말고 딜러에게 금액을 물어도 됩니다.",
      },
    ],
  },
  {
    id: "betting",
    title: "베팅 규칙",
    subtitle: "스트링벳과 베팅 선언 관련 기본기",
    items: [
      {
        id: "bet-1",
        label: "칩을 두 번에 나눠 넣지 않기",
        detail: "명확한 레이즈 선언 없이 두 동작으로 넣으면 스트링벳 오해를 부를 수 있습니다.",
      },
      {
        id: "bet-2",
        label: "모호하면 말로 먼저 선언",
        detail: "\"콜\", \"레이즈\", \"올인\"을 먼저 말하면 실수를 줄일 수 있습니다.",
      },
      {
        id: "bet-3",
        label: "원칩 룰을 염두에 두기",
        detail: "큰 칩 한 개를 넣는 행동은 종종 콜로 취급됩니다. 레이즈라면 반드시 말로 먼저 선언하세요.",
      },
    ],
  },
  {
    id: "mistakes",
    title: "초보 실수",
    subtitle: "라스베가스 1/3에서 특히 자주 나오는 누수",
    items: [
      {
        id: "mistake-1",
        label: "좋은 핸드가 오면 밸류 베팅을 작게 하지 않기",
        detail: "라이브 저스테이크는 콜을 꽤 받으므로 강한 핸드는 자신 있게 돈을 넣는 편이 좋습니다.",
      },
      {
        id: "mistake-2",
        label: "약한 에이스와 약한 킹을 너무 자주 방어하지 않기",
        detail: "지배당하는 탑페어가 가장 비싼 실수 중 하나입니다.",
      },
      {
        id: "mistake-3",
        label: "술, 피곤함, 감정 기복이 오면 바로 세션 종료 고려",
        detail: "현장 여행 일정과 포커 세션을 같은 체력으로 다루면 무너집니다.",
      },
    ],
  },
];

export const defaultWeaknessPrompts = [
  "SB 디펜스가 흔들립니다.",
  "탑페어 과대평가를 줄일 필요가 있습니다.",
  "포트 오즈 계산을 더 자동화할 여지가 있습니다.",
];
