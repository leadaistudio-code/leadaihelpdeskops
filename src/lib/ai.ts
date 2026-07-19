// Central AI config. The app talks to OpenAI through the Vercel AI SDK
// (`ai` + `@ai-sdk/openai`), matching the rest of the codebase's AI routes.
// Model choice and the "is it even configured?" check live here.
export const MODELS = {
  // Interactive service-desk assistant + general tool use. Matches the model
  // the other AI routes already standardize on.
  CHAT: "gpt-4o-mini",
} as const;

// The app must run without an OpenAI key (local dev, or a tenant that hasn't
// turned AI on). Callers check this and degrade gracefully rather than 500.
// `@ai-sdk/openai` reads OPENAI_API_KEY from the environment itself.
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
