/**
 * ══════════════════════════════════════════════════════════════════════════════════
 *  🔧 FAKE DATE SYSTEM FOR TESTING
 * ══════════════════════════════════════════════════════════════════════════════════
 *  
 *  This module provides a centralized fake date system for testing date-dependent
 *  scenarios. All date-related functions in the app should use the helpers from
 *  this file instead of calling `new Date()` directly.
 *  
 *  HOW TO USE:
 *  ───────────────────────────────────────────────────────────────────────────────
 *  1. To test with a fake date: Set FAKE_TODAY to a Date object
 *  2. To use the real date:     Set FAKE_TODAY to null
 *  
 *  AVAILABLE TEST DATES (word cycle):
 *  ───────────────────────────────────────────────────────────────────────────────
 *    new Date(2026, 1, 15)  → Feb 15 (Day 1 — LMFAO) - First day of game
 *    new Date(2026, 1, 16)  → Feb 16 (Day 2 — GUCCI)
 *    new Date(2026, 1, 17)  → Feb 17 (Day 3 — SLEEP)
 *    new Date(2026, 1, 18)  → Feb 18 (Day 4 — YANNO)
 *    new Date(2026, 1, 19)  → Feb 19 (Day 5 — WANGE)
 *    new Date(2026, 1, 14)  → Feb 14 (Before game starts - should show countdown)
 *    null                   → Real device date (production mode)
 *  
 *  NOTES:
 *  ───────────────────────────────────────────────────────────────────────────────
 *  - Month is 0-indexed (January = 0, February = 1, etc.)
 *  - Restart the app after changing FAKE_TODAY to see the effect
 *  
 * ══════════════════════════════════════════════════════════════════════════════════
 */

// ⬇️ CHANGE THIS VALUE TO TEST DIFFERENT DATES ⬇️
const FAKE_TODAY: Date | null = new Date(2026, 1, 17);  // Feb 16, 2026 - Day 2 (GUCCI)

/**
 * Returns true if the app is running in fake date mode (for testing)
 */
export function isFakeDateMode(): boolean {
  return FAKE_TODAY !== null;
}

/**
 * Gets the fake date value (for display purposes)
 * Returns null if not in fake date mode
 */
export function getFakeDate(): Date | null {
  return FAKE_TODAY ? new Date(FAKE_TODAY) : null;
}

/**
 * Returns the current date used by the entire game.
 * When FAKE_TODAY is set, the entire app behaves as if it's that date.
 * 
 * @returns A Date object representing "today" for the game
 */
export function getToday(): Date {
  if (FAKE_TODAY) {
    return new Date(FAKE_TODAY);
  }
  return new Date();
}

/**
 * Returns the current timestamp used by the entire game.
 * When FAKE_TODAY is set, uses that date with noon time (12:00)
 * so midnight-lock calculations work correctly for testing.
 * 
 * @returns A Date object representing "now" for the game
 */
export function getNow(): Date {
  if (FAKE_TODAY) {
    const fake = new Date(FAKE_TODAY);
    fake.setHours(12, 0, 0, 0);
    return fake;
  }
  return new Date();
}
