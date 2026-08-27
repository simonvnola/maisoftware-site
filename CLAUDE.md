# maisoftware-site — Claude Project Instructions

## Working style

- Work solo by default. Only propose a team of workers when the job spans
  three or more of: schema, backend, UI, tests — and ask first.
- Hand completed changes to the reviewer agent before reporting done.
- Never apply migrations. Output them; the owner applies them by hand.
- Auto-commit completed work with clear, descriptive messages — committing
  is the norm. Push to the session's working branch; the owner smoke-tests
  and merges.
- Agent definitions under .claude/agents/ are changed only on explicit
  instruction, never as part of a feature task.
