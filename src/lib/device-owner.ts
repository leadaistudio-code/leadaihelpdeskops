// Pure device-owner matching. No DB coupling — callers pass the candidate users
// so this is trivially testable and safe to import from standalone scripts.

export type OwnerCandidate = { id: string; name: string; email: string };

// Normalize a free-text OS username into a comparison key.
// Handles "CORP\\jdoe", "jdoe@host", " JDoe " → "jdoe".
export function normalizeOsUser(raw?: string | null): string | null {
  if (!raw) return null;
  const tail = raw.trim().split(/[\\/]/).pop() ?? "";
  const key = tail.split("@")[0].trim().toLowerCase();
  return key || null;
}

// Best-effort match of a device's OS username to one of the tenant's users.
//
// Deliberately CONSERVATIVE: only returns an id on an unambiguous single match,
// because a wrong link would show one employee another's device. Anything
// ambiguous returns null and stays unlinked — explicit assignment
// (assignDeviceOwner) is the authoritative path.
export function pickOwner(users: OwnerCandidate[], osUser?: string | null): string | null {
  const key = normalizeOsUser(osUser);
  if (!key) return null;

  // 1. Exact email local-part (jdoe ↔ jdoe@acme.com) — the strongest signal.
  const byEmail = users.filter((u) => u.email.split("@")[0].trim().toLowerCase() === key);
  if (byEmail.length === 1) return byEmail[0].id;

  // 2. Exact full-name match after turning separators into spaces
  //    ("santosh.rawat"/"santosh_rawat" ↔ "Santosh Rawat").
  const nameKey = key.replace(/[._-]+/g, " ").trim();
  const byName = users.filter((u) => u.name.trim().toLowerCase() === nameKey);
  if (byName.length === 1) return byName[0].id;

  return null; // no confident, unambiguous match
}
