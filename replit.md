# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude Sonnet via `@workspace/integrations-anthropic-ai`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### TubeMagic Clone (`artifacts/tubemagic-clone/`)
- **Path**: `/tubemagic-clone/`
- **Type**: React + Vite SPA
- **Purpose**: Clone of TubeMagic features page with working AI-powered YouTube creator tools

**Pages (via useState routing in App.tsx):**
- `home` — Marketing landing page (hero, sections, FAQ, footer)
- `script-writer` — AI script writer with tension engine (SSE streaming)
- `idea-generator` — Video idea generator by niche
- `title-generator` — 5 viral title generator
- `description-generator` — SEO description with timestamps
- `tag-generator` — High-SEO tag generator with toggle-select

**Components:**
- `src/components/ScriptWriter.tsx` — Full script writer with tension engine controls
- `src/components/TitleGenerator.tsx` — Title generation tool
- `src/components/IdeaGenerator.tsx` — Video idea generation tool
- `src/components/DescriptionGenerator.tsx` — Description generation tool
- `src/components/TagGenerator.tsx` — Tag generation tool with clickable chip selection
- `src/components/HeroSection.tsx`, `ScriptWritingSection.tsx`, `VideoIdeasSection.tsx`, etc. — Landing page marketing sections

### API Server (`artifacts/api-server/`)
- **Path**: `/api`
- **Type**: Express 5 server

**AI Endpoints (all powered by Claude Sonnet):**
- `POST /api/scripts/generate` — SSE streaming script generation with Tension Engine
- `POST /api/tools/titles` — Generate 5 viral YouTube titles
- `POST /api/tools/ideas` — Generate video ideas by niche
- `POST /api/tools/description` — Generate SEO description with timestamps
- `POST /api/tools/tags` — Generate 20 high-SEO tags

**Tension Engine (Script Writer):**
- Levels: low, medium, high, extreme
- Techniques: open_loops, pattern_interrupts, stakes_escalation, curiosity_gaps, cliffhangers, social_proof, foreshadowing
- Each technique is individually selectable
- Script structure: Hook → Promise → Open Loop → Body Sections → Climax → Close Loop + CTA

## Libraries

### `lib/integrations-anthropic-ai/`
- Anthropic SDK wrapper using Replit AI Integrations proxy
- Env vars: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
- Exports: `anthropic` client, `batchProcess`, `batchProcessWithSSE`

### `lib/api-spec/openapi.yaml`
- OpenAPI spec for all API endpoints
- Run `pnpm --filter @workspace/api-spec run codegen` to regenerate Zod schemas

### `lib/api-zod/`
- Generated Zod schemas from OpenAPI spec
- Used in API server for request validation

### `lib/db/`
- Drizzle ORM schema
- Tables: `conversations`, `messages`
