// src/data/fishingSessions.ts

export interface FishingSpot {
  id:        string
  label:     string
  hint:      string     // Remy's tip shown in spot_select phase
  fishTypes: string[]   // species catchable here
}

export interface Lure {
  id:         string
  label:      string
  targetFish: string[]  // species this lure attracts
}

export interface JiggingProfile {
  optimalIntervalMs: number  // target ms between left-clicks
  toleranceMs:       number  // ±deviation still counts as good rhythm
  rhythmLabel:       string  // shown to player as hint
}

export interface StoryBeat {
  id:      string
  text:    string        // Remy says this between casts
  choices: {
    id:         string
    text:       string
    fragmentId: string | null  // null = no story fragment unlocked
  }[]
}

export interface FishingSession {
  id:             string   // 'fishing_01' … 'fishing_10'
  arcId:          'arc_lighthouse' | 'arc_storm' | 'arc_family'
  briefingText:   string
  spots:          FishingSpot[]
  lures:          Lure[]
  castCount:      number   // 3 or 4
  jiggingProfile: JiggingProfile
  storyBeats:     StoryBeat[]   // length = castCount - 1 (one per inter-cast gap)
  difficulty:     'easy' | 'normal' | 'hard'
}

export interface CaughtFish {
  castIndex: number
  spotId:    string
  lureId:    string
  species:   string
}

// ─── Shared lures (same three every session) ─────────────────────────────────
const LURES: Lure[] = [
  { id: 'live_bait',   label: 'Live Bait',    targetFish: ['mackerel', 'anchovy', 'flounder'] },
  { id: 'metal_spoon', label: 'Metal Spoon',  targetFish: ['sea_bass', 'bluefish', 'bonito'] },
  { id: 'soft_lure',   label: 'Soft Lure',    targetFish: ['red_mullet', 'sea_bream', 'flounder'] },
]

// ─── Shared spots ─────────────────────────────────────────────────────────────
const SPOT_OPEN:  FishingSpot = { id: 'open_water', label: 'Open Water',  hint: 'Calm surface — good for beginners.',    fishTypes: ['mackerel', 'anchovy'] }
const SPOT_ROCKY: FishingSpot = { id: 'rocky_edge', label: 'Rocky Edge',  hint: 'Bass hide in the shadow of the rocks.', fishTypes: ['sea_bass', 'red_mullet'] }
const SPOT_TIP:   FishingSpot = { id: 'pier_tip',   label: 'Pier Tip',    hint: 'Deepest water. Faster fish out here.',  fishTypes: ['sea_bream', 'bonito', 'bluefish'] }

// ─── ARC 1: The Lighthouse (sessions 01–03) ───────────────────────────────────

const session01: FishingSession = {
  id: 'fishing_01', arcId: 'arc_lighthouse', difficulty: 'easy', castCount: 3,
  briefingText: "Morning. You showed up. Good. Here — take this rod.",
  spots: [SPOT_OPEN],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 1200, toleranceMs: 400, rhythmLabel: 'Slow and steady' },
  storyBeats: [
    {
      id: 'sb_01_1', text: "I grew up near a lighthouse. My father was the keeper there.",
      choices: [
        { id: 'c_01_1a', text: "Must have been lonely.",           fragmentId: null },
        { id: 'c_01_1b', text: "What was it like?",                fragmentId: 'frag_lighthouse_01' },
      ],
    },
    {
      id: 'sb_01_2', text: "He taught me to fish. Not here — the old pier down south. Gone now.",
      choices: [
        { id: 'c_01_2a', text: "You miss it?",                     fragmentId: 'frag_lighthouse_02' },
        { id: 'c_01_2b', text: "Did you fish together often?",     fragmentId: null },
      ],
    },
  ],
}

const session02: FishingSession = {
  id: 'fishing_02', arcId: 'arc_lighthouse', difficulty: 'easy', castCount: 3,
  briefingText: "You're back. Let's try the rocky edge today — bass like the shade.",
  spots: [SPOT_OPEN, SPOT_ROCKY],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 1100, toleranceMs: 350, rhythmLabel: 'Slow and steady' },
  storyBeats: [
    {
      id: 'sb_02_1', text: "My father's favourite spot was a ledge just like this one. He'd be there before sunrise.",
      choices: [
        { id: 'c_02_1a', text: "Did you go with him?",             fragmentId: 'frag_lighthouse_03' },
        { id: 'c_02_1b', text: "What did he catch?",               fragmentId: null },
      ],
    },
    {
      id: 'sb_02_2', text: "I'd fall asleep on his jacket waiting. He never woke me early enough.",
      choices: [
        { id: 'c_02_2a', text: "Sounds like he was patient.",      fragmentId: null },
        { id: 'c_02_2b', text: "Do you still have his jacket?",    fragmentId: 'frag_lighthouse_04' },
      ],
    },
  ],
}

const session03: FishingSession = {
  id: 'fishing_03', arcId: 'arc_lighthouse', difficulty: 'normal', castCount: 4,
  briefingText: "Tide's good today. Four casts, no rushing. He always said — the fish can feel your hurry.",
  spots: [SPOT_OPEN, SPOT_ROCKY],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 900, toleranceMs: 280, rhythmLabel: 'Find your tempo' },
  storyBeats: [
    {
      id: 'sb_03_1', text: "The last trip we took together — I was seventeen. He was already getting forgetful.",
      choices: [
        { id: 'c_03_1a', text: "What happened to him?",            fragmentId: 'frag_lighthouse_05' },
        { id: 'c_03_1b', text: "Did you know it was the last?",    fragmentId: null },
      ],
    },
    {
      id: 'sb_03_2', text: "He forgot my name once. Just once. But I never forgot the look on his face after.",
      choices: [
        { id: 'c_03_2a', text: "That must have hurt.",             fragmentId: null },
        { id: 'c_03_2b', text: "He was lucky you were there.",     fragmentId: 'frag_lighthouse_06' },
      ],
    },
    {
      id: 'sb_03_3', text: "I stayed in this town because of him. Couldn't leave the water he loved.",
      choices: [
        { id: 'c_03_3a', text: "This place feels like him?",       fragmentId: 'frag_lighthouse_07' },
        { id: 'c_03_3b', text: "Do you regret staying?",           fragmentId: null },
      ],
    },
  ],
}

// ─── ARC 2: The Storm (sessions 04–06) ────────────────────────────────────────

const session04: FishingSession = {
  id: 'fishing_04', arcId: 'arc_storm', difficulty: 'normal', castCount: 3,
  briefingText: "Try the pier tip today. Deeper water, different fish. Different patience needed.",
  spots: [SPOT_OPEN, SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 850, toleranceMs: 260, rhythmLabel: 'Find your tempo' },
  storyBeats: [
    {
      id: 'sb_04_1', text: "Fifteen years ago there was a storm. Three days. Everyone remembers it.",
      choices: [
        { id: 'c_04_1a', text: "Were you out at sea?",             fragmentId: 'frag_storm_01' },
        { id: 'c_04_1b', text: "What happened to the boats?",      fragmentId: null },
      ],
    },
    {
      id: 'sb_04_2', text: "We had a crew then. Four of us. Good people. We fished together ten years.",
      choices: [
        { id: 'c_04_2a', text: "Where are they now?",              fragmentId: 'frag_storm_02' },
        { id: 'c_04_2b', text: "Did you all survive?",             fragmentId: null },
      ],
    },
  ],
}

const session05: FishingSession = {
  id: 'fishing_05', arcId: 'arc_storm', difficulty: 'hard', castCount: 4,
  briefingText: "Rough swell today. The jig needs to be sharper — fish are jumpy in choppy water.",
  spots: [SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 650, toleranceMs: 160, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_05_1', text: "When the storm hit, we had a choice. Turn back or run it through to shelter.",
      choices: [
        { id: 'c_05_1a', text: "What did you decide?",             fragmentId: 'frag_storm_03' },
        { id: 'c_05_1b', text: "Was the shelter far?",             fragmentId: null },
      ],
    },
    {
      id: 'sb_05_2', text: "I said run through. The others trusted me. That's the part I can't put down.",
      choices: [
        { id: 'c_05_2a', text: "What happened to the boat?",       fragmentId: null },
        { id: 'c_05_2b', text: "Was it the right call?",           fragmentId: 'frag_storm_04' },
      ],
    },
    {
      id: 'sb_05_3', text: "We made it. All four. But the boat didn't. And after that — nothing was the same.",
      choices: [
        { id: 'c_05_3a', text: "They blamed you?",                 fragmentId: 'frag_storm_05' },
        { id: 'c_05_3b', text: "The boat was the livelihood?",     fragmentId: null },
      ],
    },
  ],
}

const session06: FishingSession = {
  id: 'fishing_06', arcId: 'arc_storm', difficulty: 'hard', castCount: 4,
  briefingText: "Take the rocky edge. Fish are wary today — they sense things we don't.",
  spots: [SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 600, toleranceMs: 150, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_06_1', text: "Two of them left town inside a month. Said they couldn't look at the water anymore.",
      choices: [
        { id: 'c_06_1a', text: "And the fourth?",                  fragmentId: 'frag_storm_06' },
        { id: 'c_06_1b', text: "Did they say goodbye?",            fragmentId: null },
      ],
    },
    {
      id: 'sb_06_2', text: "Marcus stayed. He never said a word about it. Just started selling books instead of fish.",
      choices: [
        { id: 'c_06_2a', text: "You two are still close?",         fragmentId: 'frag_storm_07' },
        { id: 'c_06_2b', text: "Was that his way of coping?",      fragmentId: null },
      ],
    },
    {
      id: 'sb_06_3', text: "I still fish. I don't know what else to do with myself when I'm not fishing.",
      choices: [
        { id: 'c_06_3a', text: "That makes sense.",                fragmentId: null },
        { id: 'c_06_3b', text: "Does it still feel the same?",     fragmentId: 'frag_storm_08' },
      ],
    },
  ],
}

// ─── ARC 3: The Family (sessions 07–10) ───────────────────────────────────────

const session07: FishingSession = {
  id: 'fishing_07', arcId: 'arc_family', difficulty: 'normal', castCount: 4,
  briefingText: "Morning. You're getting better at this. I can tell by how you hold the rod.",
  spots: [SPOT_OPEN, SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 850, toleranceMs: 250, rhythmLabel: 'Find your tempo' },
  storyBeats: [
    {
      id: 'sb_07_1', text: "I have a daughter. Probably should've mentioned that before.",
      choices: [
        { id: 'c_07_1a', text: "How old is she?",                  fragmentId: 'frag_family_01' },
        { id: 'c_07_1b', text: "Does she fish?",                   fragmentId: null },
      ],
    },
    {
      id: 'sb_07_2', text: "She used to come here when she was small. Before she decided the sea was boring.",
      choices: [
        { id: 'c_07_2a', text: "Kids grow out of things.",         fragmentId: null },
        { id: 'c_07_2b', text: "Did that hurt?",                   fragmentId: 'frag_family_02' },
      ],
    },
    {
      id: 'sb_07_3', text: "She wanted me to move. The city, she said. Better work. I said — what work? This is work.",
      choices: [
        { id: 'c_07_3a', text: "She didn't understand?",           fragmentId: null },
        { id: 'c_07_3b', text: "What did she say to that?",        fragmentId: 'frag_family_03' },
      ],
    },
  ],
}

const session08: FishingSession = {
  id: 'fishing_08', arcId: 'arc_family', difficulty: 'hard', castCount: 4,
  briefingText: "Pier tip today. The bonito are running. Takes precision — they're fast.",
  spots: [SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 620, toleranceMs: 155, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_08_1', text: "She stopped calling as much after her mother passed. Three years ago.",
      choices: [
        { id: 'c_08_1a', text: "Were you close, you three?",       fragmentId: 'frag_family_04' },
        { id: 'c_08_1b', text: "Did you grieve together?",         fragmentId: null },
      ],
    },
    {
      id: 'sb_08_2', text: "I think she wanted me to fall apart. To need her. I didn't know how to do that.",
      choices: [
        { id: 'c_08_2a', text: "You held it together.",            fragmentId: null },
        { id: 'c_08_2b', text: "Maybe she needed you to need her.", fragmentId: 'frag_family_05' },
      ],
    },
    {
      id: 'sb_08_3', text: "The sea doesn't ask anything of you. That's why I come here. She never understood that.",
      choices: [
        { id: 'c_08_3a', text: "It's a refuge.",                   fragmentId: 'frag_family_06' },
        { id: 'c_08_3b', text: "Maybe she felt replaced by it.",   fragmentId: null },
      ],
    },
  ],
}

const session09: FishingSession = {
  id: 'fishing_09', arcId: 'arc_family', difficulty: 'hard', castCount: 4,
  briefingText: "Try the open water first. Sometimes going back to basics clears the head.",
  spots: [SPOT_OPEN, SPOT_ROCKY, SPOT_TIP],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 650, toleranceMs: 160, rhythmLabel: 'Quick short twitches' },
  storyBeats: [
    {
      id: 'sb_09_1', text: "She sent a letter last month. First one in two years. Short. She's doing well.",
      choices: [
        { id: 'c_09_1a', text: "Will you write back?",             fragmentId: 'frag_family_07' },
        { id: 'c_09_1b', text: "What did it say?",                 fragmentId: null },
      ],
    },
    {
      id: 'sb_09_2', text: "I started to write back three times. Each time I got to — I miss you — and stopped.",
      choices: [
        { id: 'c_09_2a', text: "What stops you?",                  fragmentId: null },
        { id: 'c_09_2b', text: "Maybe three words is enough.",     fragmentId: 'frag_family_08' },
      ],
    },
    {
      id: 'sb_09_3', text: "I don't know what a good father looks like. Mine disappeared into that lighthouse.",
      choices: [
        { id: 'c_09_3a', text: "You're seeing a pattern.",         fragmentId: 'frag_family_09' },
        { id: 'c_09_3b', text: "You stayed though. That's different.", fragmentId: null },
      ],
    },
  ],
}

const session10: FishingSession = {
  id: 'fishing_10', arcId: 'arc_family', difficulty: 'normal', castCount: 3,
  briefingText: "Just open water today. No tricks. I want to talk while we fish.",
  spots: [SPOT_OPEN],
  lures: LURES,
  jiggingProfile: { optimalIntervalMs: 1000, toleranceMs: 320, rhythmLabel: 'Slow and steady' },
  storyBeats: [
    {
      id: 'sb_10_1', text: "I sent the letter. Yesterday. Three sentences. I don't know if it's enough.",
      choices: [
        { id: 'c_10_1a', text: "It's a start.",                    fragmentId: 'frag_family_10' },
        { id: 'c_10_1b', text: "What did you write?",              fragmentId: null },
      ],
    },
    {
      id: 'sb_10_2', text: "I chose this place. I'd choose it again. I think she knows that now. And maybe that's okay.",
      choices: [
        { id: 'c_10_2a', text: "People can love differently.",     fragmentId: 'frag_family_11' },
        { id: 'c_10_2b', text: "That took a long time to accept.", fragmentId: null },
      ],
    },
  ],
}

export const FISHING_SESSIONS: FishingSession[] = [
  session01, session02, session03,
  session04, session05, session06,
  session07, session08, session09, session10,
]
