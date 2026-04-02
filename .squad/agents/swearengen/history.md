# Project Context

- **Owner:** Death_Stapler
- **Project:** Warhammer Fantasy Roleplay 4e Character Generator and repository
- **Stack:** TBD
- **Created:** 2026-03-26

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- Stack: Next.js + TypeScript (strict) + Tailwind CSS, deploying to Vercel
- Data strategy: static JSON in /data/ for all WFRP reference data (species, careers, skills, talents, trappings)
- Rules engine lives in lib/rules/ — isolated from UI concerns
- Character types defined in lib/types/character.ts and lib/types/rules.ts
- App Router: app/character/new/ for creation wizard, app/character/[id]/ for viewing/editing
