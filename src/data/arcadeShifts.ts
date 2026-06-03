// src/data/arcadeShifts.ts

export interface ArcadeCustomer {
  id: string
  name: string
  tokenRequest: number
  desiredPrizeTier: 'small' | 'medium' | 'large'
  isImpatient: boolean
}

export interface BrokenMachine {
  id: string
  label: string
  puzzleType: 'cable' | 'parts'
}

export interface ArcadeShift {
  id: string                   // 'arcade_01' … 'arcade_10'
  arcId: 'arc_glory' | 'arc_denial' | 'arc_truth'
  isArcEnd: boolean
  retroGame?: 'pong' | 'space_invaders' | 'breakout'
  customers: ArcadeCustomer[]
  brokenMachines: BrokenMachine[]
  machineChoices?: string[]    // arc end: machine IDs to choose from
  timeLimitSecs: number
  briefingLines: string[]
  resultLines: {
    good: string[]
    okay: string[]
    bad: string[]
  }
  difficulty: 'easy' | 'normal' | 'hard'
}

// ─── ARC 1: arc_glory (sessions 01–03) ───────────────────────────────────────

const shift01: ArcadeShift = {
  id: 'arcade_01',
  arcId: 'arc_glory',
  isArcEnd: false,
  difficulty: 'easy',
  timeLimitSecs: 180,
  briefingLines: [
    "[arc_glory_1] Rex shows you around the arcade for the first time.",
  ],
  customers: [
    { id: 'c_01_1', name: 'Tommy',  tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: false },
    { id: 'c_01_2', name: 'Sarah',  tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: false },
  ],
  brokenMachines: [
    { id: 'm_01_1', label: 'Pinball #1', puzzleType: 'cable' },
  ],
  resultLines: {
    good:  ["[arc_glory_1_good] Rex nods, impressed. 'Not bad for a first shift.'"],
    okay:  ["[arc_glory_1_okay] Rex shrugs. 'You'll get the hang of it.'"],
    bad:   ["[arc_glory_1_bad] Rex sighs. 'We'll work on it.'"],
  },
}

const shift02: ArcadeShift = {
  id: 'arcade_02',
  arcId: 'arc_glory',
  isArcEnd: false,
  difficulty: 'easy',
  timeLimitSecs: 180,
  briefingLines: [
    "[arc_glory_2] Rex tells a story about the arcade's opening night.",
  ],
  customers: [
    { id: 'c_02_1', name: 'Leo',   tokenRequest: 2, desiredPrizeTier: 'small',  isImpatient: false },
    { id: 'c_02_2', name: 'Mina',  tokenRequest: 1, desiredPrizeTier: 'large',  isImpatient: true  },
  ],
  brokenMachines: [
    { id: 'm_02_1', label: 'Claw Machine', puzzleType: 'parts' },
  ],
  resultLines: {
    good:  ["[arc_glory_2_good] Rex lights up. 'Exactly how we used to run it.'"],
    okay:  ["[arc_glory_2_okay] Rex taps the counter. 'Room to improve.'"],
    bad:   ["[arc_glory_2_bad] Rex rubs his neck. 'We had off nights back then too.'"],
  },
}

const shift03: ArcadeShift = {
  id: 'arcade_03',
  arcId: 'arc_glory',
  isArcEnd: true,
  retroGame: 'pong',
  difficulty: 'normal',
  timeLimitSecs: 150,
  briefingLines: [
    "[arc_glory_3] Rex grows quiet, then says: 'Let's play something old.'",
  ],
  customers: [
    { id: 'c_03_1', name: 'Jake',  tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: false },
    { id: 'c_03_2', name: 'Nora',  tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: true  },
    { id: 'c_03_3', name: 'Pete',  tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: false },
  ],
  brokenMachines: [
    { id: 'm_03_1', label: 'Joystick Booth',  puzzleType: 'cable' },
    { id: 'm_03_2', label: 'Racing Seat',     puzzleType: 'parts' },
  ],
  machineChoices: ['Pong Cabinet', 'Air Hockey', 'Shooter Booth'],
  resultLines: {
    good:  ["[arc_glory_3_good] Rex stares at the Pong screen. 'I used to be better at this.'"],
    okay:  ["[arc_glory_3_okay] Rex smiles faintly. 'Good enough.'"],
    bad:   ["[arc_glory_3_bad] Rex is quiet for a long moment. 'Long night.'"],
  },
}

// ─── ARC 2: arc_denial (sessions 04–06) ──────────────────────────────────────

const shift04: ArcadeShift = {
  id: 'arcade_04',
  arcId: 'arc_denial',
  isArcEnd: false,
  difficulty: 'normal',
  timeLimitSecs: 150,
  briefingLines: [
    "[arc_denial_1] Rex seems distracted. He keeps missing his cues.",
  ],
  customers: [
    { id: 'c_04_1', name: 'Dylan',  tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: false },
    { id: 'c_04_2', name: 'Carol',  tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: true  },
    { id: 'c_04_3', name: 'Finn',   tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: false },
  ],
  brokenMachines: [
    { id: 'm_04_1', label: 'Whack-A-Mole',  puzzleType: 'cable' },
    { id: 'm_04_2', label: 'Dance Pad',     puzzleType: 'parts' },
  ],
  resultLines: {
    good:  ["[arc_denial_1_good] Rex waves a hand. 'Reflexes are fine. Just tired.'"],
    okay:  ["[arc_denial_1_okay] Rex nods mechanically. 'Yeah. Fine.'"],
    bad:   ["[arc_denial_1_bad] Rex looks away. 'Everyone has slow nights.'"],
  },
}

const shift05: ArcadeShift = {
  id: 'arcade_05',
  arcId: 'arc_denial',
  isArcEnd: false,
  difficulty: 'normal',
  timeLimitSecs: 150,
  briefingLines: [
    "[arc_denial_2] Rex overexplains a machine you already know. He doesn't seem to notice.",
  ],
  customers: [
    { id: 'c_05_1', name: 'Grace',  tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: true  },
    { id: 'c_05_2', name: 'Hugh',   tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: false },
    { id: 'c_05_3', name: 'Ivy',    tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: true  },
  ],
  brokenMachines: [
    { id: 'm_05_1', label: 'Skeeball Lane',  puzzleType: 'parts' },
    { id: 'm_05_2', label: 'Basketball Hoop', puzzleType: 'cable' },
  ],
  resultLines: {
    good:  ["[arc_denial_2_good] Rex claps once. 'See? Still runs like clockwork.'"],
    okay:  ["[arc_denial_2_okay] Rex nods. 'Not bad.'"],
    bad:   ["[arc_denial_2_bad] Rex mutters. 'The machines are getting old.'"],
  },
}

const shift06: ArcadeShift = {
  id: 'arcade_06',
  arcId: 'arc_denial',
  isArcEnd: true,
  retroGame: 'space_invaders',
  difficulty: 'hard',
  timeLimitSecs: 120,
  briefingLines: [
    "[arc_denial_3] Rex challenges you to a game. His hands tremble slightly setting it up.",
  ],
  customers: [
    { id: 'c_06_1', name: 'Kai',   tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: true  },
    { id: 'c_06_2', name: 'Luna',  tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: false },
    { id: 'c_06_3', name: 'Milo',  tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: true  },
    { id: 'c_06_4', name: 'Nina',  tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: false },
  ],
  brokenMachines: [
    { id: 'm_06_1', label: 'Space Invaders Cabinet', puzzleType: 'cable' },
    { id: 'm_06_2', label: 'Laser Tag Vest #2',     puzzleType: 'parts' },
    { id: 'm_06_3', label: 'Token Counter',          puzzleType: 'cable' },
  ],
  machineChoices: ['Space Invaders Cabinet', 'Pac-Man Corner', 'Galaga Stand'],
  resultLines: {
    good:  ["[arc_denial_3_good] Rex watches the invaders fall. 'I used to clear that board in two minutes.'"],
    okay:  ["[arc_denial_3_okay] Rex sits back. 'Good enough.'"],
    bad:   ["[arc_denial_3_bad] Rex stares at the screen. 'Something's off with the controls.'"],
  },
}

// ─── ARC 3: arc_truth (sessions 07–10) ───────────────────────────────────────

const shift07: ArcadeShift = {
  id: 'arcade_07',
  arcId: 'arc_truth',
  isArcEnd: false,
  difficulty: 'hard',
  timeLimitSecs: 120,
  briefingLines: [
    "[arc_truth_1] Rex arrives late. He looks like he hasn't slept.",
  ],
  customers: [
    { id: 'c_07_1', name: 'Oscar',  tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: true  },
    { id: 'c_07_2', name: 'Penny',  tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: false },
    { id: 'c_07_3', name: 'Quinn',  tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: true  },
  ],
  brokenMachines: [
    { id: 'm_07_1', label: 'Breakout Cabinet',   puzzleType: 'cable' },
    { id: 'm_07_2', label: 'Photo Booth',        puzzleType: 'parts' },
    { id: 'm_07_3', label: 'Fortune Teller Box', puzzleType: 'cable' },
  ],
  resultLines: {
    good:  ["[arc_truth_1_good] Rex watches quietly. 'You're good at this. Better than me now.'"],
    okay:  ["[arc_truth_1_okay] Rex says nothing for a long moment."],
    bad:   ["[arc_truth_1_bad] Rex sits in the corner. 'Some nights the machines win.'"],
  },
}

const shift08: ArcadeShift = {
  id: 'arcade_08',
  arcId: 'arc_truth',
  isArcEnd: false,
  difficulty: 'hard',
  timeLimitSecs: 120,
  briefingLines: [
    "[arc_truth_2] Rex starts talking about selling the arcade. He stops himself mid-sentence.",
  ],
  customers: [
    { id: 'c_08_1', name: 'Riley',  tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: true  },
    { id: 'c_08_2', name: 'Sam',    tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: false },
    { id: 'c_08_3', name: 'Tara',   tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: false },
    { id: 'c_08_4', name: 'Uri',    tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: true  },
  ],
  brokenMachines: [
    { id: 'm_08_1', label: 'Main Sign Lights', puzzleType: 'cable' },
    { id: 'm_08_2', label: 'Ticket Dispenser', puzzleType: 'parts' },
    { id: 'm_08_3', label: 'Jukebox',          puzzleType: 'cable' },
  ],
  resultLines: {
    good:  ["[arc_truth_2_good] Rex smiles — genuinely, for the first time in a while."],
    okay:  ["[arc_truth_2_okay] Rex nods. 'One more night.'"],
    bad:   ["[arc_truth_2_bad] Rex looks at the sign. 'It's just a building.'"],
  },
}

const shift09: ArcadeShift = {
  id: 'arcade_09',
  arcId: 'arc_truth',
  isArcEnd: false,
  difficulty: 'hard',
  timeLimitSecs: 120,
  briefingLines: [
    "[arc_truth_3] Rex tells you what this place meant to him when he was young.",
  ],
  customers: [
    { id: 'c_09_1', name: 'Vera',   tokenRequest: 2, desiredPrizeTier: 'large',  isImpatient: false },
    { id: 'c_09_2', name: 'Will',   tokenRequest: 3, desiredPrizeTier: 'medium', isImpatient: true  },
    { id: 'c_09_3', name: 'Xena',   tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: true  },
  ],
  brokenMachines: [
    { id: 'm_09_1', label: 'Centipede Cabinet', puzzleType: 'parts' },
    { id: 'm_09_2', label: 'Neon Sign — Left',  puzzleType: 'cable' },
    { id: 'm_09_3', label: 'Back Door Lock',    puzzleType: 'parts' },
  ],
  resultLines: {
    good:  ["[arc_truth_3_good] Rex exhales slowly. 'Maybe it's not over yet.'"],
    okay:  ["[arc_truth_3_okay] Rex is quiet, but the silence is easier now."],
    bad:   ["[arc_truth_3_bad] Rex says: 'I've kept things running too long out of fear.'"],
  },
}

const shift10: ArcadeShift = {
  id: 'arcade_10',
  arcId: 'arc_truth',
  isArcEnd: true,
  retroGame: 'breakout',
  difficulty: 'normal',
  timeLimitSecs: 150,
  briefingLines: [
    "[arc_truth_4] Rex unlocks the last cabinet in the back. 'One more game. For old times.'",
  ],
  customers: [
    { id: 'c_10_1', name: 'Yael',  tokenRequest: 1, desiredPrizeTier: 'small',  isImpatient: false },
    { id: 'c_10_2', name: 'Zoe',   tokenRequest: 2, desiredPrizeTier: 'medium', isImpatient: false },
    { id: 'c_10_3', name: 'Alex',  tokenRequest: 3, desiredPrizeTier: 'large',  isImpatient: true  },
  ],
  brokenMachines: [
    { id: 'm_10_1', label: 'Breakout Original', puzzleType: 'cable' },
    { id: 'm_10_2', label: 'Exit Sign',         puzzleType: 'parts' },
  ],
  machineChoices: ['Pong Cabinet', 'Breakout Original', 'Space Invaders Corner'],
  resultLines: {
    good:  ["[arc_truth_4_good] Rex switches off the lights himself. 'You know, I think I'm ready.'"],
    okay:  ["[arc_truth_4_okay] Rex lingers at the door. 'Thank you. For being here.'"],
    bad:   ["[arc_truth_4_bad] Rex sits in the dark for a moment before getting up."],
  },
}

export const ARCADE_SHIFTS: ArcadeShift[] = [
  shift01, shift02, shift03,
  shift04, shift05, shift06,
  shift07, shift08, shift09, shift10,
]
