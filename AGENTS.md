<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design Context

Strategic and visual design context lives in two root files. Read both before any UI work:

- **`PRODUCT.md`** — register (`product`), platform (`web`), users, positioning, brand personality, anti-references, design principles
- **`DESIGN.md`** — color palette, typography, elevation, components, do's/don'ts (YAML frontmatter + prose)

**North star:** "The Calm Operations Console" — enterprise calm, not sci-fi spectacle. Signal-mint (`#38E8B0`) is the primary accent; semantic rose/amber/emerald carry SLA status. Bricolage Grotesque for page titles only; Plus Jakarta Sans for all UI chrome.

Use `$impeccable <command>` for design tasks (e.g. `$impeccable polish dashboard`, `$impeccable audit`, `$impeccable live`).
