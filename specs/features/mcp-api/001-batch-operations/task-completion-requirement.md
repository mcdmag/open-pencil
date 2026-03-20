# Task Completion Requirements

Generic verification steps that apply to ALL tasks in this feature.

## Before Marking Done

- [ ] All changes are committed with a descriptive commit message
- [ ] No TypeScript errors (`npx tsc --noEmit` passes in packages/core and packages/mcp)
- [ ] No lint errors (`bun run lint` or equivalent passes)
- [ ] All new code has corresponding test coverage
- [ ] Existing tests pass (`bun test` passes with no regressions)

## Verification Commands

```bash
# TypeScript check — packages/core only
# NOTE: packages/mcp/tsconfig.json has "noCheck": true, so tsc --noEmit is a no-op there.
# Type-checking for packages/mcp is implicitly done by Bun at test/build time.
cd packages/core && npx tsc --noEmit

# Run all tests
bun test

# Run specific test file
bun test tests/engine/batch.test.ts
```

## Rollback Procedure

If a task introduces a regression:
1. `git stash` or `git revert HEAD` to undo the last commit
2. Run `bun test` to confirm tests pass again
3. Investigate the root cause before reattempting

## Memory Hygiene (MANDATORY for every task)

- [ ] Search memory for entries related to this task area: `cue_vsearch(collection="__memory", query="<task topic>")`
- [ ] Update or remove any stale memories that this task's changes have invalidated
- [ ] Save new memories for important decisions, patterns, or gotchas discovered during this task via `cue_memory_save`