# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|---------|
| Architecture, system design, scope decisions | Swearengen | "Design the character data model", "What's the project structure?", "Review this PR" |
| WFRP rules engine, data models, backend logic | Bullock | "Implement career advancement", "Model characteristics", "Build character API" |
| UI components, character creation flow, frontend | Jane | "Build the character sheet", "Add career selection UI", "Fix the layout" |
| Tests, edge cases, rules validation | Cochran | "Write tests for wound calculation", "Verify skill advancement logic", "Find edge cases" |
| Code review | Swearengen | Review PRs, check quality, suggest improvements |
| Testing | Cochran | Write tests, find edge cases, verify rules correctness |
| Scope & priorities | Swearengen | What to build next, trade-offs, decisions |
| Session logging | Scribe | Automatic — never needs routing |
| Work queue / GitHub issues | Ralph | Issue triage, PR status, backlog |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Swearengen |
| `squad:swearengen` | Architecture, review, scope work | Swearengen |
| `squad:bullock` | Backend, rules engine, data | Bullock |
| `squad:jane` | Frontend, UI, components | Jane |
| `squad:cochran` | Tests, QA, validation | Cochran |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, **Swearengen** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for simple lookups.
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Cochran to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. Swearengen handles all `squad` (base label) triage.
