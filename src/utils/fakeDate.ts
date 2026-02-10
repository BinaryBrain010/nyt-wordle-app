/**
 * FAKE DATE SYSTEM FOR TESTING
 * 
 * Change the FAKE_DATE value to test different days without waiting.
 * Set to null to use real system date.
 */

// ==========================================
// 👇 CHANGE THIS VALUE TO TEST DIFFERENT DAYS
// ==========================================
const FAKE_DATE: string | null = '2026-02-16T12:00:00';  // Set to null for real date
// ==========================================

/**
 * Get the current date (uses fake date if set, otherwise real date)
 */
export function getCurrentDate(): Date {
    if (FAKE_DATE) {
        // If FAKE_DATE is just a date string (no time), append a neutral time to force local parsing
        const dateToParse = FAKE_DATE.includes('T') ? FAKE_DATE : `${FAKE_DATE}T00:00:00`;
        const fakeDate = new Date(dateToParse);
        console.log('------------------------------------');
        console.log('[FAKE DATE SYSTEM]');
        console.log('RAW INPUT:', FAKE_DATE);
        console.log('PARSED DATE (Local):', fakeDate.toString());
        console.log('------------------------------------');
        return fakeDate;
    }
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
    const dateStr = `${year}-${month}-${day}`;
    console.log('[FAKE DATE] Returning Today String:', dateStr);
    return dateStr;
}

/**
 * Get current timestamp (for lock mechanism)
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
 * Get the fake date value (for display purposes)
 */
export function getFakeDateValue(): string | null {
    return FAKE_DATE;
}
