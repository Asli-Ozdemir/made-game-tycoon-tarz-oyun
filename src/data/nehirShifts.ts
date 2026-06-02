// src/data/nehirShifts.ts

export interface RaftObstacle {
  type:   'rock' | 'narrows' | 'debris'
  xNorm:  number   // 0–1, position along total world width
  yNorm:  number   // 0–1, within river channel (0 = top bank, 1 = bottom bank)
  width?: number   // narrows only: gap width as fraction of river channel (0–1)
}

export interface NehirShift {
  id:             string
  arcId:          'arc_ekip' | 'arc_firtina' | 'arc_karar'
  briefingLines:  string[]          // Søren pre-shift (2–3 lines)
  resultLines: {
    good:  string[]                 // 0 damage + on time
    okay:  string[]                 // 1–2 damage or on time but not both
    bad:   string[]                 // 3 damage (sank) or timed out
  }
  currentForce:   number            // 0.2–0.8: lateral current strength
  currentShifts:  number[]          // xNorm positions where current reverses direction
  obstacles:      RaftObstacle[]
  timeLimitSecs:  number
  difficulty:     'easy' | 'normal' | 'hard'
}

export const NEHIR_SHIFTS: NehirShift[] = [
  // ── Arc 1: The Crew (sessions 01–03, easy) ──────────────────────────────────
  {
    id: 'nehir_01', arcId: 'arc_ekip', difficulty: 'easy',
    briefingLines: [
      "The river doesn't favour the impatient.",
      "Watch the current first. Then paddle.",
    ],
    resultLines: {
      good: ["Clean run. You read the water well.", "Not bad for a first crossing."],
      okay: ["You got through. That's what matters.", "A few scrapes. The river teaches."],
      bad:  ["Impatience. The river showed you.", "We go again. This time, watch the current."],
    },
    currentForce: 0.3,
    currentShifts: [],
    timeLimitSecs: 60,
    obstacles: [
      { type: 'rock', xNorm: 0.45, yNorm: 0.35 },
    ],
  },
  {
    id: 'nehir_02', arcId: 'arc_ekip', difficulty: 'easy',
    briefingLines: [
      "There were four of us on this river once.",
      "Now it's just me. Doesn't matter.",
    ],
    resultLines: {
      good: ["Four of us would've done the same.", "Good. No wasted effort."],
      okay: ["Passable. The current caught you once.", "My crew would have managed the same."],
      bad:  ["Four hands would not have helped if one mind wanders.", "Start over. Focus."],
    },
    currentForce: 0.35,
    currentShifts: [],
    timeLimitSecs: 58,
    obstacles: [
      { type: 'rock', xNorm: 0.3,  yNorm: 0.6 },
      { type: 'rock', xNorm: 0.65, yNorm: 0.35 },
    ],
  },
  {
    id: 'nehir_03', arcId: 'arc_ekip', difficulty: 'easy',
    briefingLines: [
      "The best of my crew loved narrow passages.",
      "Why? I never asked.",
      "I should have.",
    ],
    resultLines: {
      good: ["He would have approved of that line.", "Exactly what he would've done."],
      okay: ["A little wide in the narrows. He never was.", "Good enough. He'd say the same."],
      bad:  ["Narrows demand precision. That was not it.", "The narrows don't forgive. Neither did he."],
    },
    currentForce: 0.3,
    currentShifts: [],
    timeLimitSecs: 55,
    obstacles: [
      { type: 'narrows', xNorm: 0.4,  yNorm: 0.5, width: 0.45 },
      { type: 'rock',    xNorm: 0.72, yNorm: 0.3 },
    ],
  },

  // ── Arc 2: The Storm Night (sessions 04–06, normal/hard) ────────────────────
  {
    id: 'nehir_04', arcId: 'arc_firtina', difficulty: 'normal',
    briefingLines: [
      "There was a night like this fifteen years ago.",
      "Colder. The current was stronger.",
    ],
    resultLines: {
      good: ["Good instincts. That night I had the same.", "You kept your head. Not easy to do."],
      okay: ["You got through. That night, so did I.", "Rougher than it should've been. We all have those nights."],
      bad:  ["That night the river won too. Different outcome, same feeling.", "Start again. The river doesn't care about last time."],
    },
    currentForce: 0.45,
    currentShifts: [],
    timeLimitSecs: 52,
    obstacles: [
      { type: 'rock',   xNorm: 0.25, yNorm: 0.4 },
      { type: 'debris', xNorm: 0.55, yNorm: 0.5 },
      { type: 'rock',   xNorm: 0.78, yNorm: 0.65 },
    ],
  },
  {
    id: 'nehir_05', arcId: 'arc_firtina', difficulty: 'hard',
    briefingLines: [
      "That night I had to make a decision.",
      "Fast. The river doesn't wait.",
      "Neither did I.",
    ],
    resultLines: {
      good: ["Fast and clean. That's how it has to be.", "A decision made is a decision owned."],
      okay: ["You hesitated once. I understand.", "The river punished the hesitation. It always does."],
      bad:  ["Hesitation. The river found every gap.", "The decision was too slow. Or the wrong one. Hard to know which."],
    },
    currentForce: 0.6,
    currentShifts: [0.5],
    timeLimitSecs: 48,
    obstacles: [
      { type: 'narrows', xNorm: 0.3,  yNorm: 0.5,  width: 0.38 },
      { type: 'rock',    xNorm: 0.52, yNorm: 0.35 },
      { type: 'rock',    xNorm: 0.7,  yNorm: 0.6  },
      { type: 'debris',  xNorm: 0.85, yNorm: 0.5  },
    ],
  },
  {
    id: 'nehir_06', arcId: 'arc_firtina', difficulty: 'hard',
    briefingLines: [
      "I decided. Was it wrong?",
      "Wrong decisions are still yours.",
      "That's the only honest thing I know.",
    ],
    resultLines: {
      good: ["You owned the line. Good.", "No excuses needed when you run it like that."],
      okay: ["You made choices. Some cost you.", "That's what decisions look like from the outside."],
      bad:  ["Every damage mark is a choice you made.", "The river doesn't assign blame. You have to do that yourself."],
    },
    currentForce: 0.65,
    currentShifts: [0.35, 0.65],
    timeLimitSecs: 46,
    obstacles: [
      { type: 'narrows', xNorm: 0.22, yNorm: 0.5,  width: 0.35 },
      { type: 'debris',  xNorm: 0.45, yNorm: 0.45 },
      { type: 'narrows', xNorm: 0.68, yNorm: 0.5,  width: 0.32 },
      { type: 'rock',    xNorm: 0.85, yNorm: 0.3  },
    ],
  },

  // ── Arc 3: The Choice (sessions 07–09, hard) ────────────────────────────────
  {
    id: 'nehir_07', arcId: 'arc_karar', difficulty: 'hard',
    briefingLines: [
      "There was someone named Lasse.",
      "Good helmsman. You remind me of him, a little.",
    ],
    resultLines: {
      good: ["He ran it exactly like that.", "That's how Lasse moved. Clean instinct."],
      okay: ["A few rough patches. He had those too.", "Not every run is clean. He knew that."],
      bad:  ["Lasse had bad runs too. At the start.", "Don't stop. He never did — until he had to."],
    },
    currentForce: 0.65,
    currentShifts: [0.45],
    timeLimitSecs: 47,
    obstacles: [
      { type: 'rock',    xNorm: 0.2,  yNorm: 0.5  },
      { type: 'narrows', xNorm: 0.42, yNorm: 0.5,  width: 0.36 },
      { type: 'debris',  xNorm: 0.62, yNorm: 0.45 },
      { type: 'rock',    xNorm: 0.8,  yNorm: 0.35 },
    ],
  },
  {
    id: 'nehir_08', arcId: 'arc_karar', difficulty: 'hard',
    briefingLines: [
      "That night we entered the narrows.",
      "I was in front. I said 'keep going.'",
      "Lasse was behind me.",
    ],
    resultLines: {
      good: ["You held your line. I held mine too.", "Through. That's what I told him."],
      okay: ["Rough passage. Lasse had a rougher one.", "The narrows don't care who's first."],
      bad:  ["The narrows took pieces from you.", "That night they took more than pieces from Lasse."],
    },
    currentForce: 0.7,
    currentShifts: [0.4, 0.7],
    timeLimitSecs: 45,
    obstacles: [
      { type: 'narrows', xNorm: 0.25, yNorm: 0.5,  width: 0.32 },
      { type: 'debris',  xNorm: 0.45, yNorm: 0.5  },
      { type: 'narrows', xNorm: 0.65, yNorm: 0.5,  width: 0.28 },
      { type: 'debris',  xNorm: 0.82, yNorm: 0.45 },
    ],
  },
  {
    id: 'nehir_09', arcId: 'arc_karar', difficulty: 'hard',
    briefingLines: [
      "He didn't make it through. I did.",
      "I searched for excuses for years.",
      "Couldn't find any. Because there aren't any.",
    ],
    resultLines: {
      good: ["Clean. No excuses needed.", "You got through. Lasse didn't. That's all there is."],
      okay: ["Damaged but through. I was the same.", "The river marks you either way."],
      bad:  ["You couldn't get through either.", "The river is indifferent. The decision was mine. That's not."],
    },
    currentForce: 0.75,
    currentShifts: [0.3, 0.55, 0.75],
    timeLimitSecs: 44,
    obstacles: [
      { type: 'narrows', xNorm: 0.2,  yNorm: 0.5,  width: 0.3  },
      { type: 'rock',    xNorm: 0.38, yNorm: 0.38 },
      { type: 'narrows', xNorm: 0.55, yNorm: 0.5,  width: 0.28 },
      { type: 'debris',  xNorm: 0.72, yNorm: 0.5  },
      { type: 'narrows', xNorm: 0.87, yNorm: 0.5,  width: 0.3  },
    ],
  },

  // ── Arc 3 cont.: The River Flows (session 10, normal) ───────────────────────
  {
    id: 'nehir_10', arcId: 'arc_karar', difficulty: 'normal',
    briefingLines: [
      "Tonight we just flow.",
      "The river doesn't flow the wrong way — it flows down.",
      "So do we.",
    ],
    resultLines: {
      good: ["Down. Just like it should be.", "The river knew where to go. So did you."],
      okay: ["Some resistance. But you kept moving.", "Down, even with obstacles. That's enough."],
      bad:  ["Even tonight, the river resisted.", "But it still flows. Try again."],
    },
    currentForce: 0.4,
    currentShifts: [],
    timeLimitSecs: 55,
    obstacles: [
      { type: 'rock',   xNorm: 0.3,  yNorm: 0.45 },
      { type: 'debris', xNorm: 0.55, yNorm: 0.5  },
      { type: 'rock',   xNorm: 0.78, yNorm: 0.55 },
    ],
  },
]
