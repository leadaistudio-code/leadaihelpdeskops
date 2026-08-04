// Standard caps for list queries.
//
// Almost every `findMany` in this codebase was unbounded. That is invisible at
// demo scale and fatal at customer scale: a tenant with 20,000 users or 50,000
// assets serialises the entire table into a server component's payload, and the
// process runs out of memory before anyone sees a slow page.
//
// A cap is not the same as pagination — a truncated list is still a wrong list.
// These constants exist so the failure mode is "the page shows the first N"
// rather than "the deploy falls over", and so the places that genuinely need
// paging are easy to find later by grepping for this import.

// Directory-style lists rendered in full (users, groups, assets).
export const LIST_LIMIT = 500;

// Selector/autocomplete options, where the UI is unusable past a few hundred
// entries anyway.
export const OPTIONS_LIMIT = 200;

// Feed-style lists showing the most recent activity.
export const FEED_LIMIT = 100;
