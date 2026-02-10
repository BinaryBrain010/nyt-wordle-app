/**
 * DATE UTILITIES
 * 
 * Provides consistent date handling for the application.
 */

/**
 * Get the current date in Pacific Time (America/Los_Angeles)
 */
export function getCurrentDate(): Date {
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
 * Uses local time part to avoid timezone shifts when near midnight
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
 */
export function getCurrentTimestamp(): number {
    return getCurrentDate().getTime();
}

/**
 * Check if the fake date system is enabled (always false in production)
 */
export function isFakeDateEnabled(): boolean {
    return false;
}

/**
 * Get the fake date value (always null in production)
 */
export function getFakeDateValue(): string | null {
    return null;
}
