// Real data: LFS Larvae Current Ages (snapshot 2026-04-24).
// DPH = (snapshot date - spawn date) - 16d incubation, matches sheet values. eggBowl in lab format (EB1).
export const SNAPSHOT_DATE = '2026-04-24';
export const FEED_STAGES = [{"name": "Rotifer Only", "start": 0, "end": 10}, {"name": "Rotifer + A1", "start": 11, "end": 40}, {"name": "A1 Only", "start": 41, "end": 70}, {"name": "A1 + A2", "start": 71, "end": 100}, {"name": "A2 Only", "start": 101, "end": 130}];
export const COHORTS = [
    {"cross": 1, "eggBowl": "EB1", "spawnDate": "2025-12-18", "tank": "C11, C12, C13", "dph": 111, "stage": "A2 Only"},
    {"cross": 3, "eggBowl": "EB3", "spawnDate": "2025-12-19", "tank": "C14", "dph": 110, "stage": "A2 Only"},
    {"cross": 4, "eggBowl": "EB4", "spawnDate": "2025-12-19", "tank": "C12", "dph": 110, "stage": "A2 Only"},
    {"cross": 7, "eggBowl": "EB7", "spawnDate": "2025-12-23", "tank": "C20", "dph": 106, "stage": "A2 Only"},
    {"cross": 9, "eggBowl": "EB9", "spawnDate": "2025-12-23", "tank": "C19", "dph": 106, "stage": "A2 Only"},
    {"cross": 10, "eggBowl": "EB10", "spawnDate": "2025-12-23", "tank": "C16", "dph": 106, "stage": "A2 Only"},
    {"cross": 14, "eggBowl": "EB14", "spawnDate": "2025-12-23", "tank": "C17", "dph": 106, "stage": "A2 Only"},
    {"cross": 16, "eggBowl": "EB16", "spawnDate": "2025-12-23", "tank": "C18", "dph": 106, "stage": "A2 Only"},
    {"cross": 19, "eggBowl": "EB19", "spawnDate": "2026-01-16", "tank": "C1", "dph": 82, "stage": "A1 + A2"},
    {"cross": 20, "eggBowl": "EB20", "spawnDate": "2026-01-16", "tank": "C6", "dph": 82, "stage": "A1 + A2"},
    {"cross": 21, "eggBowl": "EB21", "spawnDate": "2026-01-16", "tank": "C7", "dph": 82, "stage": "A1 + A2"},
    {"cross": 22, "eggBowl": "EB22", "spawnDate": "2026-01-16", "tank": "C8", "dph": 82, "stage": "A1 + A2"},
    {"cross": 23, "eggBowl": "EB23", "spawnDate": "2026-01-16", "tank": "C9", "dph": 82, "stage": "A1 + A2"},
    {"cross": 24, "eggBowl": "EB24", "spawnDate": "2026-01-16", "tank": "C10", "dph": 82, "stage": "A1 + A2"},
    {"cross": 25, "eggBowl": "EB25", "spawnDate": "2026-01-23", "tank": "C3", "dph": 75, "stage": "A1 + A2"},
    {"cross": 26, "eggBowl": "EB26", "spawnDate": "2026-01-23", "tank": "C2", "dph": 75, "stage": "A1 + A2"},
    {"cross": 27, "eggBowl": "EB27", "spawnDate": "2026-01-23", "tank": "C15", "dph": 75, "stage": "A1 + A2"},
    {"cross": 28, "eggBowl": "EB28", "spawnDate": "2026-01-23", "tank": "C4", "dph": 75, "stage": "A1 + A2"},
    {"cross": 29, "eggBowl": "EB29", "spawnDate": "2026-01-23", "tank": "C15", "dph": 75, "stage": "A1 + A2"},
    {"cross": 33, "eggBowl": "EB33", "spawnDate": "2026-02-17", "tank": "C12", "dph": 50, "stage": "A1 Only"},
    {"cross": 34, "eggBowl": "EB34", "spawnDate": "2026-02-17", "tank": "C12", "dph": 50, "stage": "A1 Only"},
    {"cross": 37, "eggBowl": "EB37", "spawnDate": "2026-02-17", "tank": "C12", "dph": 50, "stage": "A1 Only"},
    {"cross": 41, "eggBowl": "EB41", "spawnDate": "2026-02-24", "tank": "C13", "dph": 43, "stage": "A1 Only"},
    {"cross": 42, "eggBowl": "EB42", "spawnDate": "2026-02-24", "tank": "C13", "dph": 43, "stage": "A1 Only"},
    {"cross": 45, "eggBowl": "EB45", "spawnDate": "2026-02-24", "tank": "C13", "dph": 43, "stage": "A1 Only"},
    {"cross": 48, "eggBowl": "EB48", "spawnDate": "2026-02-25", "tank": "C14", "dph": 42, "stage": "A1 Only"},
    {"cross": 51, "eggBowl": "EB51", "spawnDate": "2026-02-25", "tank": "C14", "dph": 42, "stage": "A1 Only"},
    {"cross": 52, "eggBowl": "EB52", "spawnDate": "2026-02-25", "tank": "C14", "dph": 42, "stage": "A1 Only"},
];
