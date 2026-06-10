# CLAUDE.md

Guidance for working in this repository.

## Project

TestMyAPI is a browser-based API testing playground built with Next.js (App
Router), TypeScript and Tailwind CSS v4. It composes HTTP requests and inspects
responses, forwarding them through a server-side proxy (`app/api/proxy`) that
guards against SSRF. See [README.md](./README.md) for the full overview.

Key directories:

- `app/` — routes, layout, and the proxy endpoint.
- `components/` — UI (request bar, tabs, editors, response view, sidebar,
  command palette, modals).
- `lib/` — pure, unit-tested logic: `proxy`, `ssrf`, `request`, `curl`,
  `codegen`, `format`, `storage`.

## Conventions

- Development happens on `main`. Do not create new branches unless asked.
- Commits are authored by Vihan Pandya.
- Keep the suite green before committing: `npm run typecheck`, `npm run lint`,
  `npm run test`, and `npm run build`.
