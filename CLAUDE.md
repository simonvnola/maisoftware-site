# maisoftware-site — Claude Project Instructions

## Working style

- Work solo by default. Only propose a team of workers when the job spans
  three or more of: schema, backend, UI, tests — and ask first.
- Hand completed changes to the reviewer agent before reporting done.
- Never apply migrations. Output them; the owner applies them by hand.
- Never commit or push. Stop for the owner's smoke test.
- Agent definitions under .claude/agents/ are changed only on explicit
  instruction, never as part of a feature task.
