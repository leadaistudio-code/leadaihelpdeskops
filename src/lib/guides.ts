// Shared constants for gated marketing guides. Kept out of the "use server"
// action file because server-action modules may only export async functions.

// Slug for the single gated asset we currently offer. The form, the download
// route, and the stored Lead record all agree on this identifier.
export const CIO_GUIDE_SLUG = "cio-autonomous-it";
