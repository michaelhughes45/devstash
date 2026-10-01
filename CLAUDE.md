@AGENTS.md

# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

## Neon Database (MCP)

When using the Neon MCP tools, always target:

- **Project:** `devstash` (ID: `restless-unit-22767568`)
- **Branch:** `development` (ID: `br-tiny-surf-b5v99la3`)

Rules:

- Always pass `project_id` and `branch_id` explicitly on every Neon MCP call. Never rely on the default branch, because the default is `production`.
- **Never read from or write to the `production` branch** (ID: `br-dark-mouse-b54qg5hs`) unless I explicitly say "production" in my request.
- Even with production approved, confirm before running any write or destructive SQL (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE) against it.
- Schema changes go through Prisma migrations (`prisma migrate dev`), not ad-hoc SQL or `db push`. Production only gets them via `prisma migrate deploy`.
- If a branch ID stops resolving (for example after a branch is recreated), look up the `development` branch by name with `list_branches` and stop to ask me. Don't fall back to the default branch.

**IMPORTANT:** Do not add Claude to any commit messages