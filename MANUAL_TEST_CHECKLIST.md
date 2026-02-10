# NYT Wordle - Manual Testing Checklist

Use this guide to verify the game logic by changing the `FAKE_DATE` in `src/utils/fakeDate.ts`.

## 1. Pre-Launch Verification
*   **Action**: Set `FAKE_DATE` to `2026-02-10`.
*   **Expected**:
    *   Home screen shows "Coming Feb 15".
    *   Play button is disabled.
    *   Calendar shows future days as empty/unclickable.

## 2. Launch Day Verification
*   **Action**: Set `FAKE_DATE` to `2026-02-15`.
*   **Expected**:
    *   Game starts normally.
    *   Daily word is **LMFAO**.
    *   Puzzle Number is **No. 0321**.

## 3. Replay Lock (Midnight Rule)
*   **Action**:
    1.  Play and **Lose** the game on Feb 15.
    2.  Try to replay immediately -> Should show **Locked** till midnight.
    3.  Set `FAKE_DATE` to `2026-02-16`.
    4.  Go back to Feb 15 in Calendar -> Should be **Unlocked** for retry.
    5.  Play and Lose again -> Should be **Locked** again till the new midnight.

## 4. Missed Day Indicator
*   **Action**:
    1.  Set `FAKE_DATE` to `2026-02-16` (without playing Feb 15).
    2.  Open Calendar.
*   **Expected**:
    *   Feb 15 should have a **Grey Border** (Missed).

## 5. Streak Retention
*   **Action**: Win on Feb 15, then move to Feb 16 and Win.
*   **Expected**: Streak should be `2`. Move to Feb 18 without playing Feb 17 -> Streak should reset to `0`.
