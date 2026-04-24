# AI tool attribution

ETHGlobal Open Agents submission asks for disclosure of AI tools used during the build. Tracking here.

## Tools

- **Claude Code** (claude-opus-4-7) — research phase Apr 21-23 (ecosystem scraping, competitive analysis), execution Apr 24 to May 3 (scaffolding help, code review, doc generation).
- **Cursor** — if used during build, appended here.

## Spec files

Primary specification at `docs/project-spec.md`. Acceptance tests at `docs/reliability-tests.md`. Honesty layer (labeling contract for every numeric output) at `docs/honesty-layer.md`. Added as the build progresses.

## Hand vs assisted split

Indicative — updated as we ship.

| Area | Hand | Assisted |
|---|---|---|
| IL reconstruction + hook replay math | yes | no |
| Solidity contracts | yes | no |
| 0G + Uniswap SDK wiring | partial | partial |
| React components | mixed | mixed |
| Tests | yes | no |
| Docs | no | yes |

## Commits

Commit messages in this repo are hand-written. No AI co-author trailer.
