/**
 * The timeline: three location eras, present first. Each entry carries its English copy and, where it
 * exists, a `ja` block with the Japanese. Japanese is a draft pending review by a native speaker.
 *
 * Copy is approved; edit wording only on purpose. `sub` may contain <b> for emphasis.
 */
import { ANDROID_BUILD, PROJECTS, TESTFLIGHT } from "~/config/links";

/** Dates as decimal years: D(2023, 3) ≈ March 2023. */
export const D = (y: number, m: number) => y + (m - 1) / 12;
export const NOW = D(2026, 11);
/** The ruler spans this range. */
export const RULER_MIN = 2015.75, RULER_MAX = 2027.0;

export type EntryType = "work" | "project" | "learning";
/** [value, label, popover?] — popover is [title, subtitle]. */
export type Stat = [string, string, [string, string]?];
export type Link = [string, string];
export type Shot =
  | "demo" | "gwp" | "bb"
  | { img: "youfilter" | "spaced-cards" | "katacard"; alt: string; tall?: boolean };

export type EntryJa = {
  title?: string; kind?: string; sub?: string; text?: string;
  points?: string[]; stats?: string[]; tips?: ([string, string] | null)[]; links?: string[];
};

export type Entry = {
  id: string; type: EntryType; title: string; start: number; end: number | null;
  kind: string; dates: string; sub: string;
  compact?: boolean; text?: string;
  points?: string[]; skills?: string[];
  extra?: { stats?: Stat[]; links?: Link[]; note?: string };
  shot?: Shot;
  ja?: EntryJa;
};

export type Era = {
  id: "nj-now" | "japan" | "nj-early"; glyph: string; name: string; years: string;
  ja: { name: string; years: string };
  flight?: { from: string; to: string; year: string };
  entries: Entry[];
};

export const JA_PLACE: Record<string, string> = {
  "Japan": "日本", "New Jersey": "ニュージャージー", "Hoboken": "ホーボーケン", "Tokyo": "東京", "Nagoya": "名古屋",
  "Wyckoff": "ワイコフ", "Pompton Plains": "ポンプトン・プレインズ", "Montclair": "モントクレア",
};
export const PIN_COORDS: Record<string, string> = {
  "Hoboken": "40.74°N 74.03°W", "Tokyo": "35.68°N 139.69°E", "Nagoya": "35.18°N 136.91°E",
  "Wyckoff": "41.01°N 74.17°W", "Pompton Plains": "40.97°N 74.30°W", "Montclair": "40.82°N 74.21°W",
};

export const eras: Era[] = [
  {
    id: "nj-now", glyph: "NJ", name: "Hoboken, New Jersey", years: "2022 – now",
    ja: { name: "ニュージャージー州ホーボーケン", years: "2022 – 現在" },
    flight: { from: "Japan", to: "New Jersey", year: "2022" },
    entries: [
      { id: "kanji-kaku", type: "project", title: "Kanji Kaku", start: D(2026, 9), end: null,
        kind: "Personal project", dates: "Sep 2026 – Present", sub: "<b>iOS & Android app</b> · public beta",
        points: [
          "An iOS and Android app for learning to read and write all 2,136 jōyō kanji with mnemonic stories, finger-drawn stroke checking, and spaced-repetition reviews.",
          "Built with Expo and React Native on a Convex backend with Clerk sign-in, scheduling reviews with the FSRS algorithm.",
          "Designed the curriculum, data model, and access rules myself and directed AI coding agents through each checkpoint, backed by 240+ automated tests.",
        ],
        skills: ["TypeScript", "React Native", "Expo", "Convex", "Clerk", "FSRS", "Hanzi Writer", "Vitest"],
        extra: {
          stats: [["161", "commits in 7 weeks", ["161 commits", "Sep 10 – Oct 26, 2026"]], ["2,136", "kanji in scope", ["The jōyō kanji", "Japan's official list of everyday characters"]]],
          links: [["Join the iOS beta on TestFlight ↗", TESTFLIGHT], ["Download the Android build ↗", ANDROID_BUILD]],
        },
        shot: "demo",
        ja: { kind: "個人開発", sub: "<b>iOS・Androidアプリ</b> · パブリックベータ公開中",
          points: ["常用漢字2,136字の読み書きを覚えるためのiOS・Androidアプリです。オリジナルの記憶術ストーリー、指で書いた筆順のチェック、間隔反復による復習を組み合わせています。",
            "ExpoとReact Nativeで構築し、バックエンドにConvex、ログインにClerkを採用。復習のスケジュールにはFSRSアルゴリズムを使っています。",
            "カリキュラム、データモデル、アクセスルールを自分で設計し、各チェックポイントでAIコーディングエージェントを指揮しました。240件以上の自動テストで品質を支えています。"],
          stats: ["7週間のコミット数", "対象の漢字数"], tips: [["161コミット", "2026年9月10日〜10月26日"], ["常用漢字", "日常で使う漢字として国が定めた一覧"]],
          links: ["TestFlightでiOSベータに参加 ↗", "Android版をダウンロード ↗"] } },
      { id: "se1", type: "work", title: "Rebuy Engine", start: D(2026, 2), end: D(2026, 7),
        kind: "Software Engineer 1", dates: "Feb 2026 – Jul 2026", sub: "<b>Software Engineer 1</b> · Remote",
        points: [
          "Led development of the greenfield Selectable Gift with Purchase widget: a TypeScript Next.js control panel, a Vue 3 widget, a PHP CodeIgniter 4 backend, and a MySQL database.",
          "Core member of the widgets and cart team, the product serving 8,400+ Shopify merchants. Mentored support staff, triaged complex bugs, and interviewed candidates.",
          "Rebuilt widget onboarding with templated customization and a step-by-step setup guide.",
        ],
        skills: ["TypeScript", "Next.js", "Vue 3", "PHP", "CodeIgniter 4", "MySQL"],
        extra: { stats: [["8,400+", "Shopify merchants"], ["$12.4B", "GMV processed in 2025", ["Gross merchandise value", "Total sales across merchants using Rebuy, 2025"]], ["$1.9B", "Rebuy-attributed sales", ["Rebuy-attributed sales", "Revenue credited to Rebuy's widgets and cart, 2025"]]] },
        shot: "gwp",
        ja: { kind: "ソフトウェアエンジニア1", sub: "<b>ソフトウェアエンジニア1</b> · リモート",
          points: ["新規プロジェクト「Selectable Gift with Purchase」ウィジェットの開発をリード。TypeScript・Next.jsの管理画面、Vue 3のウィジェット、PHP CodeIgniter 4のバックエンド、MySQLデータベースを設計・構築しました。",
            "8,400以上のShopifyストアが利用する主力製品を担う、ウィジェット&カートチームのコアメンバーとして、サポートスタッフの指導、複雑なバグの切り分け、採用面接を担当しました。",
            "テンプレートによるカスタマイズと段階的なセットアップガイドで、ウィジェットのオンボーディングを刷新しました。"],
          stats: ["Shopifyストア", "2025年の流通総額", "Rebuy経由の売上"], tips: [null, ["流通総額(GMV)", "2025年にRebuyを利用するストアで発生した売上の合計"], ["Rebuy経由の売上", "2025年にRebuyのウィジェットとカートが生んだ売上"]] } },
      { id: "youfilter", type: "project", title: "YouFilter.ai", start: D(2024, 12), end: D(2025, 4),
        kind: "Personal project", dates: "Dec 2024 – Apr 2025", sub: "<b>Chrome extension</b> + landing page",
        points: [
          "A Chrome extension that hides negative videos and Shorts from your YouTube recommendations, based on tags you choose.",
          "Wrote the extension front end: Manifest V3 content scripts, a fast mutation observer, settings synced across tabs, and a front-end cache.",
          "Classifies video titles with the OpenAI API behind a Rust service with Redis caching. The landing page uses Next.js and Supabase auth.",
        ],
        skills: ["JavaScript", "Chrome MV3", "Vite", "OpenAI API", "Rust", "Redis", "Docker", "Next.js", "Supabase"],
        extra: { links: [["youfilter.vercel.app ↗", PROJECTS.youfilterSite], ["Extension source ↗", PROJECTS.youfilterSource]] },
        shot: { img: "youfilter", alt: "YouTube home page with negative videos blurred out and the YouFilter settings popup open" },
        ja: { kind: "個人開発", sub: "<b>Chrome拡張機能</b> + ランディングページ",
          points: ["選んだタグに基づいて、YouTubeのおすすめからネガティブな動画やショート動画を非表示にするChrome拡張機能です。",
            "拡張機能のフロントエンドを担当。Manifest V3のコンテンツスクリプト、高速なMutationObserver、タブ間での設定同期、フロントエンドのキャッシュを実装しました。",
            "動画タイトルはOpenAI APIで分類し、RustのサービスとRedisのキャッシュで処理しています。ランディングページはNext.jsとSupabase認証で構築しました。"],
          links: ["youfilter.vercel.app ↗", "拡張機能のソースコード ↗"] } },
      { id: "assoc", type: "work", title: "Rebuy Engine", start: D(2024, 12), end: D(2026, 2),
        kind: "Associate Software Engineer", dates: "Dec 2024 – Feb 2026", sub: "<b>Associate Software Engineer</b> · Remote",
        points: [
          "Co-developed and scaled Bundle Builder to $6M a month in merchant-attributed revenue, adding subscriptions, discounting, pre-built layouts, filtering, and 15+ other settings.",
          "Fixed 40+ bugs on core widgets and merged 20+ enhancements.",
        ],
        skills: ["Vue 3", "JavaScript", "CSS", "Liquid", "Shopify"],
        extra: { stats: [["$6M", "per month, Bundle Builder", ["Bundle Builder", "Merchant-attributed revenue per month"]], ["40+", "bugs fixed"], ["20+", "enhancements"]] },
        shot: "bb",
        ja: { kind: "アソシエイトソフトウェアエンジニア", sub: "<b>アソシエイトソフトウェアエンジニア</b> · リモート",
          points: ["新製品「Bundle Builder」を共同開発し、サブスクリプション、割引、テンプレートレイアウト、フィルタリングなど15以上の設定を実装。ストアの売上を月600万ドル規模まで伸ばしました。",
            "主要ウィジェットのバグを40件以上修正し、20件以上の機能改善をマージしました。"],
          stats: ["Bundle Builderの月間売上", "バグ修正", "機能改善"], tips: [["Bundle Builder", "ストアに帰属する月間の売上"]] } },
      { id: "spaced", type: "project", title: "Spaced Cards", start: D(2024, 1), end: D(2024, 5),
        kind: "Personal project", dates: "Jan 2024 – May 2024", sub: "<b>Web app</b> · mobile-first flash cards",
        points: [
          "Flash-card app that schedules each card with the SuperMemo spaced-repetition algorithm.",
          "Built with Next.js 14 and Tailwind, with animated drawers, light and dark themes, and Jest tests.",
        ],
        skills: ["JavaScript", "Next.js 14", "React", "Tailwind", "SuperMemo-2", "Jest"],
        extra: { links: [["Live site ↗", PROJECTS.spacedCardsSite], ["Source ↗", PROJECTS.spacedCardsSource]] },
        shot: { img: "spaced-cards", alt: "Spaced Cards overview of a Hashmaps deck, with cards colored by how well they are known" },
        ja: { kind: "個人開発", sub: "<b>Webアプリ</b> · モバイルファーストの単語カード",
          points: ["SuperMemoの間隔反復アルゴリズムで、カードごとに復習のタイミングを決める単語カードアプリです。",
            "Next.js 14とTailwindで構築。アニメーション付きのドロワー、ライト・ダークテーマ、Jestによるテストを備えています。"],
          links: ["サイトを見る ↗", "ソースコード ↗"] } },
      { id: "launch", type: "work", title: "Rebuy Engine", start: D(2023, 9), end: D(2024, 12),
        kind: "Launch Engineer", dates: "Sep 2023 – Dec 2024", sub: "<b>Launch Engineer</b> · Remote",
        points: ["Launched 200+ custom merchant builds on Shopify with Vue 3, JavaScript, CSS, and Liquid."],
        skills: ["Vue 3", "JavaScript", "CSS", "Liquid", "Shopify"],
        extra: { stats: [["200+", "merchant launches"]] },
        ja: { kind: "ローンチエンジニア", sub: "<b>ローンチエンジニア</b> · リモート",
          points: ["Vue 3、JavaScript、CSS、Liquidを使い、200件以上のストア向けカスタム実装をShopify上でローンチしました。"], stats: ["ストアのローンチ"] } },
      { id: "katacard", type: "project", title: "Katacard", start: D(2023, 5), end: D(2023, 7),
        kind: "Personal project", dates: "May 2023 – Jul 2023", sub: "<b>Web app</b> · katakana and hiragana drills",
        points: ["A mobile-friendly Next.js app for learning Japanese katakana and hiragana, with progress saved in local storage and color feedback on every answer."],
        skills: ["JavaScript", "Next.js 13", "React", "Tailwind"],
        extra: { links: [["Live site ↗", PROJECTS.katacardSite], ["Source ↗", PROJECTS.katacardSource]] },
        shot: { img: "katacard", alt: "Katacard on a phone, showing the katakana モ with an answer box", tall: true },
        ja: { kind: "個人開発", sub: "<b>Webアプリ</b> · カタカナとひらがなの練習",
          points: ["カタカナとひらがなを覚えるための、モバイル対応のNext.jsアプリです。進捗をローカルストレージに保存し、回答ごとに色でフィードバックします。"],
          links: ["サイトを見る ↗", "ソースコード ↗"] } },
      { id: "support", type: "work", title: "Rebuy Engine", start: D(2023, 3), end: D(2023, 9),
        kind: "Support Engineer", dates: "Mar 2023 – Sep 2023", sub: "<b>Support Engineer</b> · Remote",
        points: ["Closed 300+ tickets with a 95% satisfaction rating, handling storefront customizations, app customizations, debugging, and integrations."],
        skills: ["JavaScript", "CSS", "Liquid", "Debugging"],
        extra: { stats: [["300+", "tickets closed"], ["95%", "satisfaction", ["Customer satisfaction", "Across 300+ support tickets"]]] },
        ja: { kind: "サポートエンジニア", sub: "<b>サポートエンジニア</b> · リモート",
          points: ["ストアのカスタマイズ、アプリのカスタマイズ、デバッグ、外部連携など、300件以上の問い合わせを顧客満足度95%で解決しました。"],
          stats: ["解決した問い合わせ", "顧客満足度"], tips: [null, ["顧客満足度", "300件以上の問い合わせでの評価"]] } },
      { id: "self-taught", type: "learning", compact: true, title: "Teaching myself to code", start: D(2022, 4), end: D(2023, 3),
        kind: "Learning", dates: "Apr 2022 – Mar 2023", sub: "<b>Self-taught</b> · back home in New Jersey",
        text: "Learned HTML, CSS, JavaScript, React, and Next.js on my own, and shipped the first version of this site in November 2022. That work led to my first engineering role, at Rebuy.",
        ja: { title: "独学でプログラミング", kind: "学び", sub: "<b>独学</b> · ニュージャージーに帰国後",
          text: "HTML、CSS、JavaScript、React、Next.jsを独学で学び、2022年11月にこのサイトの最初のバージョンを公開しました。その積み重ねが、Rebuyでの初めてのエンジニア職につながりました。" } },
    ],
  },
  {
    id: "japan", glyph: "東京", name: "Tokyo & Nagoya, Japan", years: "2019 – 2022",
    ja: { name: "東京・名古屋", years: "2019 – 2022" },
    flight: { from: "New Jersey", to: "Japan", year: "2019" },
    entries: [
      { id: "vantage", type: "work", compact: true, title: "Vantage Japan", start: D(2020, 8), end: D(2022, 4),
        kind: "Teaching", dates: "Aug 2020 – Apr 2022", sub: "<b>Kindergarten English Teacher</b> · Tokyo",
        text: "Planned lessons and owned the development of 500+ students across kindergartens in Tokyo and Chiba.",
        ja: { kind: "英語講師", sub: "<b>幼稚園の英語講師</b> · 東京", text: "東京と千葉の幼稚園で、500人以上の園児の授業を計画し、英語教育を担当しました。" } },
      { id: "amity", type: "work", compact: true, title: "Amity Corporation", start: D(2019, 4), end: D(2020, 7),
        kind: "Teaching", dates: "Apr 2019 – Jul 2020", sub: "<b>Native English Teacher</b> · Nagoya",
        text: "Taught 120+ students at every level of English, ages 1 to 55.",
        ja: { kind: "英語講師", sub: "<b>英語ネイティブ講師</b> · 名古屋", text: "1歳から55歳まで、あらゆるレベルの生徒120人以上に英語を教えました。" } },
    ],
  },
  {
    id: "nj-early", glyph: "NJ", name: "North Jersey", years: "2016 – 2019",
    ja: { name: "ニュージャージー州北部", years: "2016 – 2019" },
    entries: [
      { id: "tefl", type: "learning", compact: true, title: "TEFL Certification", start: D(2018, 8), end: D(2019, 4),
        kind: "Learning", dates: "Aug 2018 – Apr 2019", sub: "<b>Teaching English as a Foreign Language</b>",
        text: "Took a break to earn my TEFL certificate, which took me to Japan.",
        ja: { title: "TEFL資格の取得", kind: "学び", sub: "<b>英語教授法の国際資格(TEFL)</b>", text: "仕事を一度離れてTEFLの資格を取得し、それが日本へ渡るきっかけになりました。" } },
      { id: "aso", type: "work", compact: true, title: "A Second Opinion", start: D(2017, 11), end: D(2018, 8),
        kind: "Marketing", dates: "Nov 2017 – Aug 2018", sub: "<b>Account Manager</b> · Pompton Plains",
        text: "Managed 8 client accounts across the US, designing their ad funnels and websites.",
        ja: { kind: "マーケティング", sub: "<b>アカウントマネージャー</b> · ポンプトン・プレインズ", text: "全米8社のクライアントを担当し、広告のファネルとWebサイトを設計・運用しました。" } },
      { id: "cb", type: "work", compact: true, title: "Coldwell Banker", start: D(2016, 2), end: D(2017, 11),
        kind: "Marketing", dates: "Feb 2016 – Nov 2017", sub: "<b>Marketing & Digital Content Coordinator</b> · Wyckoff",
        text: "Ran print and web campaigns for 300+ residential listings from $250K to $15M.",
        ja: { kind: "マーケティング", sub: "<b>マーケティング&デジタルコンテンツ担当</b> · ワイコフ", text: "25万ドルから1,500万ドルまでの住宅物件300件以上について、紙媒体とWebのキャンペーンを担当しました。" } },
      { id: "msu", type: "work", compact: true, title: "Montclair State University", start: D(2016, 1), end: D(2016, 1),
        kind: "Education", dates: "2016", sub: "<b>BS, Business Administration</b> · Marketing",
        text: "Where the interest in building things for people started.",
        ja: { title: "モントクレア州立大学", kind: "学歴", sub: "<b>経営学士</b> · マーケティング専攻", text: "人のために何かを作ることへの関心は、ここから始まりました。" } },
    ],
  },
];

export const flatEntries = eras.flatMap(era => era.entries.map(e => ({ ...e, era })));

const jaDate = (x: number) => { const y = Math.floor(x + 1e-6), m = Math.round((x - y) * 12) + 1; return `${y}年${m}月`; };
export const jaDates = (e: Entry) => e.id === "msu" ? "2016年" : `${jaDate(e.start)} – ${e.end === null ? "現在" : jaDate(e.end)}`;
/** The ruler readout's short date: "Sep 2026" / "2026年9月", or "Now" for the present entry. */
export const startLabel = (e: Entry) => ({ en: e.dates.split(" – ")[0], ja: e.id === "msu" ? "2016年" : jaDate(e.start) });

/** Skill name → icon symbol id (simple-icons slug, or a custom c-* glyph). */
export const SKILL_ICONS: Record<string, string> = {
  "TypeScript": "typescript", "JavaScript": "javascript", "React": "react", "React Native": "react", "Expo": "expo", "Convex": "convex",
  "Clerk": "clerk", "Next.js": "nextdotjs", "Next.js 13": "nextdotjs", "Next.js 14": "nextdotjs", "Vue 3": "vuedotjs", "PHP": "php",
  "CodeIgniter 4": "codeigniter", "MySQL": "mysql", "Chrome MV3": "googlechrome", "Vite": "vite", "Rust": "rust", "Redis": "redis",
  "Docker": "docker", "Supabase": "supabase", "Tailwind": "tailwindcss", "Jest": "jest", "Vitest": "vitest", "CSS": "css", "Shopify": "shopify",
  "OpenAI API": "c-spark", "FSRS": "c-cycle", "SuperMemo-2": "c-cycle", "Hanzi Writer": "c-brush", "Liquid": "c-drop", "Debugging": "c-bug",
};
