/**
 * DATE UTILITIES
 * 
 * Provides consistent date handling for the application.
 */

/**
 * Get the current date
 */
export function getCurrentDate(): Date {
    return new Date();
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
