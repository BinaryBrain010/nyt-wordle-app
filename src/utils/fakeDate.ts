/**
 * DATE UTILITIES
 * 
 * Provides consistent date handling for the application.
 * This system allows for "fake" dates during testing while ensuring 
 * all time calculations respect Pacific Time (PT) for consistency with NYT Wordle.
 */

/**
 * 🛠️ TEST CONFIGURATION
 * 
 * To test different scenarios, set FAKE_DATE to a string (e.g., "2026-02-15")
 * or a full ISO-like string for specific times (e.g., "2026-02-15T23:59:00").
 * Set to null to use the real device time (standard behavior).
 */
const FAKE_DATE: string | null = "2026-02-21"; // Set this to "2026-02-15" to test Day 1

const APP_START_TIME = Date.now();

/**
 * Get the current date in Pacific Time (America/Los_Angeles)
 */
export function getCurrentDate(): Date {
    // 1. Handle Fake Date Mode
    if (FAKE_DATE) {
        const hasTimePart = FAKE_DATE.includes('T');
        const [datePart, timePart] = FAKE_DATE.split('T');
        const [year, month, day] = datePart.split('-').map(Number);

        if (hasTimePart) {
            const [hour, minute, second] = timePart.split(':').map(Number);
            const baseDate = new Date(year, month - 1, day, hour, minute, second);
            const drift = Date.now() - APP_START_TIME;
            return new Date(baseDate.getTime() + drift);
        } else {
            // Adopt current real PT time-of-day
            const nowReal = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Los_Angeles',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: false
            });
            const parts = formatter.formatToParts(nowReal);
            const tm: any = {};
            parts.forEach(({ type, value }) => { tm[type] = value; });

            return new Date(
                year,
                month - 1,
                day,
                parseInt(tm.hour),
                parseInt(tm.minute),
                parseInt(tm.second)
            );
        }
    }

    // 2. Handle Real Date Mode (Shift to PT)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const p: any = {};
    parts.forEach(({ type, value }) => { p[type] = value; });

    // Return a Date object where the local components match the PT values
    return new Date(
        parseInt(p.year),
        parseInt(p.month) - 1,
        parseInt(p.day),
        parseInt(p.hour),
        parseInt(p.minute),
        parseInt(p.second)
    );
}

/**
 * Get today's date as YYYY-MM-DD string
 * Uses the fake date if enabled, otherwise returns current date in PT
 */
export function getTodayString(): string {
    const d = getCurrentDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get current timestamp (for lock mechanism)
 * Based on the current date (fake or real PT)
 */
export function getCurrentTimestamp(): number {
    return getCurrentDate().getTime();
}

/**
 * Check if the fake date system is enabled
 */
export function isFakeDateEnabled(): boolean {
    return FAKE_DATE !== null;
}

/**
 * Get the fake date value used for testing
 */
export function getFakeDateValue(): string | null {
    return FAKE_DATE;
}
