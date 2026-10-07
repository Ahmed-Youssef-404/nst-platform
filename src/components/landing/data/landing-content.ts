// src/components/landing/data/landing-content.ts
//
// Single source for every piece of landing-page content. Components never
// hardcode copy or data; they receive it from here (or from the live stats
// fetcher), so updating the page later means editing this file only.
//
// Items marked PLACEHOLDER below are structural stand-ins, NOT real data.
// Replace them before presenting them to the public as facts.

// ---------------------------------------------------------------- Stats ---

export interface LandingStat {
    id: string;
    label: string;
    value: number;
    /** Prefix shown before the number, e.g. "+" for rounded/approximate figures. */
    prefix?: string;
}

/** Counts read live from the database (see get-landing-stats.ts). */
export interface LandingLiveCounts {
    students: number;
    tasks: number;
    submissions: number;
}

/** Number of learning paths NST runs (Beginner + Intermediate). */
const LEARNING_PATH_COUNT = 2;

/**
 * Builds the hero statistics. Live counts are used when available; otherwise
 * only the figures that were already published on the previous landing page
 * are shown, so nothing is ever invented.
 */
export function buildStats(live: LandingLiveCounts | null): LandingStat[] {
    if (!live) {
        return [
            { id: "students", label: "Students", value: 30, prefix: "+" },
            { id: "paths", label: "Learning paths", value: LEARNING_PATH_COUNT },
        ];
    }
    return [
        { id: "students", label: "Students", value: live.students },
        { id: "paths", label: "Learning paths", value: LEARNING_PATH_COUNT },
        { id: "tasks", label: "Challenges", value: live.tasks },
        { id: "submissions", label: "Tasks submitted", value: live.submissions },
    ];
}

// ---------------------------------------------------------------- Hero ----

export const HERO_COPY = {
    eyebrow: "Northern Stars Team",
    headline: "We build the mindset of a programmer.",
    /** The word in the headline that gets the gold treatment. */
    headlineAccent: "mindset",
    support: "Direction first. Code follows.",
    cta: "Start your journey",
} as const;

/** Nodes orbiting the hero "mindset core". Each reveals one line on hover/focus. */
export const CORE_NODES = [
    { id: "analyze", label: "Analyze", hint: "Read the problem twice." },
    { id: "decompose", label: "Break down", hint: "Small pieces. Clear steps." },
    { id: "experiment", label: "Experiment", hint: "Try. Break it. Try again." },
    { id: "debug", label: "Debug", hint: "Errors are information." },
    { id: "solve", label: "Solve", hint: "Simplest thing that works." },
    { id: "learn", label: "Learn", hint: "Keep the way of thinking." },
] as const;

// ---------------------------------------------------------- Philosophy ----

export const PHILOSOPHY_COPY = {
    noiseTitle: "The noise",
    directionTitle: "The direction",
    headline: "Beginners don't lack content. They lack direction.",
    support: "Sailors crossed the dark by the northern stars. We do the same for programmers.",
} as const;

/** Scattered "advice" that makes up the noise before it resolves into a route. */
export const NOISE_TERMS = [
    "Which language?",
    "10 tips",
    "Roadmap 2026",
    "Tutorial #47",
    "Learn X in 7 days",
    "Frameworks",
    "Bootcamp?",
    "Everyone says…",
    "Start with C++",
    "No, Python",
] as const;

/** Labels for the six nodes that become the clear route. */
export const DIRECTION_TERMS = [
    "Start",
    "Foundation",
    "Logic",
    "Thinking",
    "Practice",
    "Growth",
] as const;

// --------------------------------------------------------------- Method ---

export const MINDSET_COPY = {
    kicker: "How NST thinks",
    headline: "Problem solving is a means, not the destination.",
    support: "We don't collect solved problems. We learn how to face the next one.",
    result: "A way of thinking.",
} as const;

export const MINDSET_STEPS = [
    { id: "analyze", label: "Analyze", line: "What is actually being asked?" },
    { id: "break", label: "Break down", line: "Split it into small, solvable parts." },
    { id: "experiment", label: "Experiment", line: "Test ideas. Be wrong early." },
    { id: "solve", label: "Solve", line: "Connect the parts into one path." },
    { id: "learn", label: "Learn", line: "Keep the method, not the answer." },
] as const;

export const FOLLOW_UP_COPY = {
    kicker: "Continuous follow-up",
    headline: "Not attend, then leave.",
    support: "A loop we stay inside with you.",
} as const;

export const CYCLE_STEPS = [
    { id: "learn", label: "Learn", line: "Sessions with guidance." },
    { id: "practice", label: "Practice", line: "Tasks that make it stick." },
    { id: "track", label: "Track", line: "Progress you can see." },
    { id: "review", label: "Review", line: "Feedback on your work." },
    { id: "improve", label: "Improve", line: "Next round, stronger." },
] as const;

export const FOUNDATION_COPY = {
    kicker: "Strong foundations",
    headline: "Build up from what matters.",
    support: "The essentials first. Details when you're ready.",
} as const;

/** Listed bottom → top, the order they are built in. */
export const FOUNDATION_LAYERS = [
    { id: "fundamentals", label: "Fundamentals", line: "The core every other layer rests on." },
    { id: "logic", label: "Logic", line: "Conditions, loops, flow." },
    { id: "thinking", label: "Thinking", line: "Problem solving as a habit." },
    { id: "projects", label: "Projects", line: "Everything, applied." },
] as const;

export const EFFORT_COPY = {
    kicker: "Genuine effort",
    headline: "Completion is not growth.",
    support: "Finishing a curriculum proves attendance. Growth shows in how you think.",
    completionLabel: "Curriculum finished",
} as const;

export const GROWTH_SIGNALS = [
    "Thinking",
    "Solving",
    "Applying",
    "Improving",
    "Consistency",
] as const;

// --------------------------------------------------------------- Paths ----

export interface LearningPath {
    id: "beginner" | "intermediate";
    name: string;
    tagline: string;
    audience: string;
    destination: string;
    focus: readonly string[];
}

export const PATHS_COPY = {
    kicker: "Learning paths",
    headline: "Two paths. One direction.",
    origin: "NST",
    growth: "Growth",
} as const;

export const LEARNING_PATHS: readonly LearningPath[] = [
    {
        id: "beginner",
        name: "Beginner",
        tagline: "Build the foundation.",
        audience: "Starting from the beginning.",
        destination: "Foundation",
        focus: [
            "Programming fundamentals",
            "Guided learning",
            "Practical tasks",
            "Continuous follow-up",
        ],
    },
    {
        id: "intermediate",
        name: "Intermediate",
        tagline: "Strengthen the thinking.",
        audience: "Already have some programming experience.",
        destination: "Problem solving",
        focus: [
            "Problem solving",
            "Stronger programming skills",
            "Thinking over memorizing",
            "Handling new problems",
        ],
    },
];

// -------------------------------------------------------------- Ranking ---

export interface TopStudent {
    rank: 1 | 2 | 3;
    name: string;
    /** Total ST earned. `null` renders as "—" until real data is wired in. */
    st: number | null;
}

export interface RankedCadet {
    rank: number;
    name: string;
    // handle: string;
    st: number;
    // track: "beginner" | "intermediate";
    // trackLabel: string;
    // orbit: string;
    // trend: "up" | "stable" | "down";
    // trendDelta?: number;
    // streakDays: number;
    // tasksSolved: number;
    // celestialRole: string; // e.g. "Polaris · Zenith", "Vega · Orbit IV", etc.
    // badge?: string;
    // specialty?: string;
}

export const RANKING_COPY = {
    kicker: "NST Cosmic Ranking",
    headline: "The Stars Who Lead the Way",
    support: "The brightest stars are not just the ones who shine, they are the ones who keep moving forward.",
    caption: "Live Batch Leaderboard · Ranked by Space Tokens (ST)",
    ctaHeadline: "Your place among the stars is waiting.",
    ctaSupport: "Every leading cadet started with a blank editor and a desire to learn. Step into orbit, build the mindset of a programmer, and make your progress shine.",
    ctaButton: "Start your journey",
} as const;

export const RANKED_CADETS: readonly RankedCadet[] = [
    {
        rank: 1,
        name: "Youssef Ibrahim",
        // handle: "youssef.dev",
        st: 2840,
        // track: "intermediate",
        // trackLabel: "Intermediate",
        // orbit: "Orbit V · Problem Solving",
        // trend: "up",
        // trendDelta: 2,
        // streakDays: 48,
        // tasksSolved: 56,
        // celestialRole: "Polaris · Zenith Star",
        // badge: "Zenith Master",
        // specialty: "Graph Theory & System Flow",
    },
    {
        rank: 2,
        name: "Kareem Tarek",
        // handle: "kareem.code",
        st: 2490,
        // track: "intermediate",
        // trackLabel: "Intermediate",
        // orbit: "Orbit IV · Logic & Structures",
        // trend: "up",
        // trendDelta: 1,
        // streakDays: 36,
        // tasksSolved: 52,
        // celestialRole: "Vega · Flank Star",
        // badge: "Nova Luminary",
        // specialty: "Dynamic Programming & Optimization",
    },
    {
        rank: 3,
        name: "Mariam Hassan",
        // handle: "mariam.dev",
        st: 2280,
        // track: "beginner",
        // trackLabel: "Beginner",
        // orbit: "Orbit IV · Foundations",
        // trend: "up",
        // trendDelta: 3,
        // streakDays: 42,
        // tasksSolved: 48,
        // celestialRole: "Altair · Rising Star",
        // badge: "Rising Pulsar",
        // specialty: "Clean Code & Recursive Logic",
    },
    {
        rank: 4,
        name: "Omar Farouk",
        // handle: "omar.algos",
        st: 1940,
        // track: "intermediate",
        // trackLabel: "Intermediate",
        // orbit: "Orbit III · Problem Solving",
        // trend: "stable",
        // streakDays: 28,
        // tasksSolved: 44,
        // celestialRole: "Capella · Orbit III",
        // badge: "Core Pathfinder",
        // specialty: "Tree Traversals & Flow",
    },
    {
        rank: 5,
        name: "Ziad Mahmoud",
        // handle: "ziad.tech",
        st: 1820,
        // track: "beginner",
        // trackLabel: "Beginner",
        // orbit: "Orbit III · Foundations",
        // trend: "up",
        // trendDelta: 2,
        // streakDays: 31,
        // tasksSolved: 41,
        // celestialRole: "Rigel · Orbit III",
        // badge: "Constellation Runner",
        // specialty: "Algorithmic Thinking",
    },
    {
        rank: 6,
        name: "Nour El-Din",
        // handle: "nour.craft",
        st: 1690,
        // track: "beginner",
        // trackLabel: "Beginner",
        // orbit: "Orbit II · Foundations",
        // trend: "up",
        // trendDelta: 1,
        // streakDays: 22,
        // tasksSolved: 38,
        // celestialRole: "Deneb · Orbit II",
        // badge: "Ascending Node",
        // specialty: "Data Structures & Flow",
    },
    {
        rank: 7,
        name: "Sara Mostafa",
        // handle: "sara.systems",
        st: 1580,
        // track: "intermediate",
        // trackLabel: "Intermediate",
        // orbit: "Orbit II · Logic & Structures",
        // trend: "stable",
        // streakDays: 19,
        // tasksSolved: 36,
        // celestialRole: "Sirius · Orbit II",
        // badge: "Logic Navigator",
        // specialty: "State Machines & Arrays",
    },
    {
        rank: 8,
        name: "Ahmed Radi",
        // handle: "ahmed.radi",
        st: 1470,
        // track: "beginner",
        // trackLabel: "Beginner",
        // orbit: "Orbit II · Foundations",
        // trend: "up",
        // trendDelta: 2,
        // streakDays: 24,
        // tasksSolved: 34,
        // celestialRole: "Spica · Orbit II",
        // badge: "Keystone Cadet",
        // specialty: "Problem Decomposition",
    },
];

/**
 * Top 3 cadets for compact views.
 */
export const TOP_STUDENTS: readonly TopStudent[] = RANKED_CADETS.slice(0, 3).map((c) => ({
    rank: c.rank as 1 | 2 | 3,
    name: c.name,
    st: c.st,
}));

// --------------------------------------------------------------- Voices ---

export const VOICES_COPY = {
    kicker: "What we want to hear",
    closing: "Thinks better. Knows the direction. Has the foundation. That's success.",
} as const;

/** The four statements NST wants every student to leave with. Mapped to the 4 points of the "N". */
export const STUDENT_VOICES = [
    "NST taught me how to think.",
    "It actually put me on the right path.",
    "I left with a strong foundation.",
    "I made big progress in a short time.",
] as const;

// ------------------------------------------------------------- Feedback ---

export interface FeedbackItem {
    id: string;
    quote: string;
    author: string;
    context: string;
}

export const FEEDBACK_COPY = {
    kicker: "In their words",
    headline: "Heard from the ones who walked it.",
} as const;

/**
 * PLACEHOLDER: replace with real feedback collected from previous students
 * (keep each quote to one or two sentences so it stays readable in motion).
 */
export const FEEDBACK_ITEMS: readonly FeedbackItem[] = [
    {
        id: "f1",
        quote: "I stopped asking which language to learn and started asking how to solve things.",
        author: "NST student",
        context: "Previous batch",
    },
    {
        id: "f2",
        quote: "Someone actually followed my progress. That changed how seriously I took it.",
        author: "NST student",
        context: "Previous batch",
    },
    {
        id: "f3",
        quote: "The tasks felt hard at first. Then a new problem stopped feeling scary.",
        author: "NST student",
        context: "Previous batch",
    },
    {
        id: "f4",
        quote: "I finally knew what to learn next, and why.",
        author: "NST student",
        context: "Previous batch",
    },
    {
        id: "f5",
        quote: "The community made it feel like a team, not a course.",
        author: "NST student",
        context: "Previous batch",
    },
];

// ----------------------------------------------------------------- CTA ----

export const CTA_COPY = {
    headline: "Your journey starts here.",
    support: "Pick a direction. We'll walk it with you.",
    cta: "Start your journey",
} as const;

export type SocialId = "whatsapp" | "telegram" | "instagram" | "email";

export interface SocialLink {
    id: SocialId;
    label: string;
    /** Links without an `href` are not rendered. */
    href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
    { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/201159169762" },
    // Add the team's Telegram link here; it appears automatically once set.
    { id: "telegram", label: "Telegram", href: "" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/nst_northernstar/" },
    { id: "email", label: "Email", href: "mailto:we.northernstar@gmail.com" },
];

// ------------------------------------------------------------ Navigation ---

export const NAV_LINKS = [
    { id: "philosophy", label: "Philosophy" },
    { id: "method", label: "Method" },
    { id: "paths", label: "Paths" },
    { id: "ranking", label: "Ranking" },
    { id: "contact", label: "Contact" },
] as const;

export const FOOTER_COPY = {
    statement: "Teaching you how to navigate the world of programming.",
} as const;
