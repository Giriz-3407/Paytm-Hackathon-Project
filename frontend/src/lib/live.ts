/** True when the app talks to the real backend (live data) instead of the bundled demo dataset. */
export const LIVE = process.env.NEXT_PUBLIC_DATA_MODE === 'api';
