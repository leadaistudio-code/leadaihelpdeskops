// Minimal className joiner. Filters falsy values and joins with a space.
// Deliberately dependency-free — we control the primitive class strings, so
// full tailwind-merge conflict resolution isn't needed.
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

// Shared focus-visible ring used across every interactive primitive. Mintlify
// uses its brand mint-green as the activation signal, offset against the white
// canvas.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
