# maisoftware-site — Claude Project Instructions

## Working style

- Work solo by default. Only propose a team of workers when the job spans
  three or more of: schema, backend, UI, tests — and ask first.
- Route completed changes through polish, then testing when the change
  needs it, then the reviewer agent, before reporting done.
- Do a step directly instead of delegating when it's small enough that
  spawning an agent would cost more than it saves — same standard as
  implementation.
- Never apply migrations. Output them; the owner applies them by hand.
- Auto-commit completed work with clear, descriptive messages — committing
  is the norm. Push to the session's working branch; the owner smoke-tests
  and merges.
- Agent definitions under .claude/agents/ are changed only on explicit
  instruction, never as part of a feature task.
