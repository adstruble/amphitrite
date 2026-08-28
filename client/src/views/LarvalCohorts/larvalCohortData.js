// Real data: LFS Larvae Current Ages (snapshot 2026-04-24).
// Only stocked cohorts (have a tank). Rows with no tank = egg bowl died, excluded.
// DPH = (snapshot - spawn) - 16d incubation, matches sheet. eggBowl in lab format (EB1).
export const SNAPSHOT_DATE = '2026-04-24';
export const LARVAE_COHORTS = [
    {"id": "1", "spawnDate": "2025-12-18", "cross": 1, "eggBowl": "EB1", "tank": "C11, C12, C13", "dph": 111, "stage": "A2 Only"},
    {"id": "3", "spawnDate": "2025-12-19", "cross": 3, "eggBowl": "EB3", "tank": "C14", "dph": 110, "stage": "A2 Only"},
    {"id": "4", "spawnDate": "2025-12-19", "cross": 4, "eggBowl": "EB4", "tank": "C12", "dph": 110, "stage": "A2 Only"},
    {"id": "7", "spawnDate": "2025-12-23", "cross": 7, "eggBowl": "EB7", "tank": "C20", "dph": 106, "stage": "A2 Only"},
    {"id": "9", "spawnDate": "2025-12-23", "cross": 9, "eggBowl": "EB9", "tank": "C19", "dph": 106, "stage": "A2 Only"},
    {"id": "10", "spawnDate": "2025-12-23", "cross": 10, "eggBowl": "EB10", "tank": "C16", "dph": 106, "stage": "A2 Only"},
    {"id": "14", "spawnDate": "2025-12-23", "cross": 14, "eggBowl": "EB14", "tank": "C17", "dph": 106, "stage": "A2 Only"},
    {"id": "16", "spawnDate": "2025-12-23", "cross": 16, "eggBowl": "EB16", "tank": "C18", "dph": 106, "stage": "A2 Only"},
    {"id": "19", "spawnDate": "2026-01-16", "cross": 19, "eggBowl": "EB19", "tank": "C1", "dph": 82, "stage": "A1 + A2"},
    {"id": "20", "spawnDate": "2026-01-16", "cross": 20, "eggBowl": "EB20", "tank": "C6", "dph": 82, "stage": "A1 + A2"},
    {"id": "21", "spawnDate": "2026-01-16", "cross": 21, "eggBowl": "EB21", "tank": "C7", "dph": 82, "stage": "A1 + A2"},
    {"id": "22", "spawnDate": "2026-01-16", "cross": 22, "eggBowl": "EB22", "tank": "C8", "dph": 82, "stage": "A1 + A2"},
    {"id": "23", "spawnDate": "2026-01-16", "cross": 23, "eggBowl": "EB23", "tank": "C9", "dph": 82, "stage": "A1 + A2"},
    {"id": "24", "spawnDate": "2026-01-16", "cross": 24, "eggBowl": "EB24", "tank": "C10", "dph": 82, "stage": "A1 + A2"},
    {"id": "25", "spawnDate": "2026-01-23", "cross": 25, "eggBowl": "EB25", "tank": "C3", "dph": 75, "stage": "A1 + A2"},
    {"id": "26", "spawnDate": "2026-01-23", "cross": 26, "eggBowl": "EB26", "tank": "C2", "dph": 75, "stage": "A1 + A2"},
    {"id": "27", "spawnDate": "2026-01-23", "cross": 27, "eggBowl": "EB27", "tank": "C15", "dph": 75, "stage": "A1 + A2"},
    {"id": "28", "spawnDate": "2026-01-23", "cross": 28, "eggBowl": "EB28", "tank": "C4", "dph": 75, "stage": "A1 + A2"},
    {"id": "29", "spawnDate": "2026-01-23", "cross": 29, "eggBowl": "EB29", "tank": "C15", "dph": 75, "stage": "A1 + A2"},
    {"id": "33", "spawnDate": "2026-02-17", "cross": 33, "eggBowl": "EB33", "tank": "C12", "dph": 50, "stage": "A1 Only"},
    {"id": "34", "spawnDate": "2026-02-17", "cross": 34, "eggBowl": "EB34", "tank": "C12", "dph": 50, "stage": "A1 Only"},
    {"id": "37", "spawnDate": "2026-02-17", "cross": 37, "eggBowl": "EB37", "tank": "C12", "dph": 50, "stage": "A1 Only"},
    {"id": "41", "spawnDate": "2026-02-24", "cross": 41, "eggBowl": "EB41", "tank": "C13", "dph": 43, "stage": "A1 Only"},
    {"id": "42", "spawnDate": "2026-02-24", "cross": 42, "eggBowl": "EB42", "tank": "C13", "dph": 43, "stage": "A1 Only"},
    {"id": "45", "spawnDate": "2026-02-24", "cross": 45, "eggBowl": "EB45", "tank": "C13", "dph": 43, "stage": "A1 Only"},
    {"id": "48", "spawnDate": "2026-02-25", "cross": 48, "eggBowl": "EB48", "tank": "C14", "dph": 42, "stage": "A1 Only"},
    {"id": "51", "spawnDate": "2026-02-25", "cross": 51, "eggBowl": "EB51", "tank": "C14", "dph": 42, "stage": "A1 Only"},
    {"id": "52", "spawnDate": "2026-02-25", "cross": 52, "eggBowl": "EB52", "tank": "C14", "dph": 42, "stage": "A1 Only"},
];
