# Configuration, artifacts and release (stub)

* **Status:** proposed **stub**. SLICE-01 fixes only the minimal packaging and settings choices listed below. Full depth is written when SLICE-11 starts (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `bootstrap.py`, `settings/loader.py`, `settings/schema.py`, `resources/*` (except `migrations/001_initial.sql`, which is specified in the [ledger spec](ledger-and-atomic-transaction.md)), `pyproject.toml`, `requirements.lock`, `config/*`, `.github/workflows/verify.yml`, `.pre-commit-config.yaml`, `docs/*`.
* **Master anchors:** D05 (`README.md:895`), D06 (`:899`), A02-F1…F4 (`:901-907`), A04-F3 (`:897`), A10-F2 (`:1165`), A09-F1 (`:929`).

## Requirement keys (pointers)

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-CFG-001 | One installable application; package discovery; packaged immutable resources; runs without the checkout or `.git` | D05 (`README.md:895`); LD-19 |
| REQ-CFG-002 | One typed worker settings contract feeds unit rendering and runtime validation | D06 (`README.md:899`); LD-18 |
| REQ-CFG-003 | Same resolver per process: packaged defaults, then profile, then scoped environment; conflicting alias and replacement is an error | A02-F2 (`README.md:903`) |
| REQ-CFG-004 | Resolved settings are immutable per process lifetime; changes happen at restart or session boundaries | A02-F3 (`README.md:905`) |
| REQ-CFG-005 | Exact tested bundle manifest binds artifacts, resources, schema identities and migration revision; rollback is refused when the older bundle cannot read current history | A02-F4 (`README.md:907`) |
| REQ-CFG-006 | Staged release transitions are recorded; partial activation resumes from recorded facts | A04-F3 (`README.md:897`) |
| REQ-CFG-007 | One explicit first-release composition with required, optional and deferred participants; nothing chosen silently | A10-F2 (`README.md:1165`); A09-F1 (`:929`); [Q-005](../decisions/owner-questions.md#q-005) |
| REQ-CFG-008 | Deploy only on the owner's explicit word for that deploy | POL-050 |

## Minimal choices fixed by SLICE-01 (routine engineering, within D05)

| Choice | Value | Why |
|---|---|---|
| Build backend | `setuptools>=69` with `[tool.setuptools.packages.find] where=["src"]` | Package discovery instead of a hand list (LD-19) |
| Python | `>=3.11` | Matches `tomllib`, typing features used; legacy runs 3.11+ on the EC2 (**U**, verify at SLICE-11) |
| Distribution name | `autonomous-trading`, import package `autonomous_trading` | README §6 namespace (`README.md:969`) |
| Settings in SLICE-01 | Only `ledger.path` and `test` profile; loaded through `settings.loader.resolve(profile, env)` | The smallest resolver that later grows per A02-F2 |

## Open items

* Project license (`README.md:1131`, owner decision).
* First-release composition ([Q-005](../decisions/owner-questions.md#q-005)).

## To specify at SLICE-11

Full settings schema and alias rules; bundle manifest format; staging and activation state machine; rollback compatibility check; composition validation against outstanding obligations (Combined-F6); proofs from `README.md:1221`, `:1225-1227`, `:1233`.
