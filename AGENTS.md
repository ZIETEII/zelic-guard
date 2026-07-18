<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ZELIC Guard repository rules

- Treat `docs/CODEX_BUILD_BRIEF.md` and `.specify/memory/constitution.md` as binding project constraints.
- Preserve the initial scaffold commit `c2d047b`; use normal commits and never amend or rewrite history.
- Work only in this repository. Never commit secrets, `.env.local`, Codex credentials, private machine data, real recipients, or real payment details.
- The application is a simulation lab. It must never send email, make a payment, mutate a third-party service, or imply that it did.
- Follow strict vertical RED -> GREEN -> REFACTOR cycles for every domain behavior. Record the failing and passing commands in `BUILD_WEEK_EVIDENCE.md`.
- Keep the policy engine framework-independent and deterministic. Time, replay history, and run counts must be explicit inputs rather than hidden globals.
- Validate every route boundary and every model-produced value with Zod. `OPENAI_API_KEY` and `OPENAI_MODEL` remain server-only and must never use a `NEXT_PUBLIC_` prefix.
- Before declaring completion, run `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run build`, then verify desktop and mobile flows in a real browser with no console errors.
- Do not deploy, push remotes, create accounts, submit forms, spend money, or contact anyone unless a later explicit instruction changes that boundary.

## Verified tooling incompatibility

`@vudovn/ag-kit@2026.7.18` was attempted twice on 2026-07-18. Both commands exited with status 0 but generated no `.agents` directory or agent layer. The repository therefore does not claim an AG Kit integration. Use this `AGENTS.md` plus the committed Spec Kit documents as the governing instructions unless a compatible version is independently verified later.
