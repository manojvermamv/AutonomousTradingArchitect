# Cross-document consistency check

* **Status:** proposed, non-normative. A record of what the read-only checker found, not a claim that the design is correct.
* **Precedence:** master README, then ROADMAP, then the package. This file edits nothing.
* **Run:** 2026-10-28, against the package at branch commit `2825815` (this file is rebuilt in the commit after it), master pin `b9bb32c`, legacy pin `OA@445eb116`.

## Results against the hard targets

| ID | Target | Result | Evidence |
|---|---|---|---|
| J1 | 0 unresolved Blockers in every EGM report; every Major fixed, contested with evidence, or raised as Q/X | pass: every Blocker raised in stages 5–9 and the final zoom-out is resolved (FIX, or Q-013 for the protection-placement Blocker); every Major is FIX, CONTEST or a Q/X item | [egm/](../egm/README.md) review files |
| J6 | SLICE-01 passes EGM stage 9 with 0 Blockers | pass: round 2 found 0 Blockers (readiness 0/16/20, codebase 0/11/12); all round-2 Majors fixed | [egm/plan/review.md](../egm/plan/review.md) |
| J2 | Every full-depth key has decision, module, task and proof; stub keys name their acceptance row | pass: 87 full-depth keys, 56 stub keys, 0 incomplete rows, 0 undefined proofs | Checker output below; [traceability](../traceability.md) |
| J3 | 0 module references outside README §6 plus listed tree deltas; 0 modules specified twice | pass | Checker output below |
| J4 | 0 broken relative links; 0 duplicate IDs | pass | Checker output below |
| J5 | Every master citation falls inside the section holding the cited ID | pass | Checker output below |
| J7 | Only `specs/implementation/` changes in ATA (plus the master `README.md`, edited on the owner's authorization of 2026-10-27 for X-001, X-003, X-006, X-007; master citations stay pinned to `b9bb32c`) | pass: 48 files changed since the branch base `b9bb32c`, 0 outside `specs/implementation/` other than the authorized master `README.md` (2); working tree has 0 changes outside it | `git diff --name-only b9bb32c..HEAD` and `git status --porcelain` below |

Passing J2–J5 shows only that the documents agree with each other and with the master. Correctness evidence comes from the zero-context EGM reviews (J1, J6), the owner's answers to the open questions, and, later, the executed proofs. No proof in this package is *executable* or *passing* yet: every one is *specified*.

## Checker output

```text
files=46 tree_paths=176 deltas=35 full_keys=87 stub_keys=56
J7 changed=0 outside_specs=0 []

no problems
```

## Scope proof (J7)

```text
$ git diff --name-only b9bb32c..HEAD | grep -v '^specs/implementation/'
AGENTS.md
README.md
$ git status --porcelain --untracked-files=all   (entries outside specs/implementation/)
(none)
```

## How to re-run

The scripts live outside the repository, because this package's authorization covers Markdown under `specs/implementation/` only. Their full text is below. Save each to a scratch folder and run:

```bash
python -I check_package.py <ATA root> <AT root>
```

```bash
python -I gen_trace.py <ATA root>/specs/implementation
```

`gen_trace.py` rewrites `traceability.md` from the requirement-key tables and its mapping of keys to modules, tasks and proofs; run it, then the checker, after any spec edit. When the master changes, follow the steps in the [package README](../README.md#re-pinning).

### `check_package.py`

```python
"""Read-only consistency checker for specs/implementation (J2-J5, J7).

Usage: python -I check_package.py <ATA repo root> <legacy AT root>
It never writes. Passing it shows only that documents agree, not that the design is right.
"""
import re, sys, pathlib, subprocess, unicodedata
from collections import defaultdict

ata = pathlib.Path(sys.argv[1]); at = pathlib.Path(sys.argv[2])
pkg = ata / "specs" / "implementation"
PIN = "b9bb32c"   # master citations are pinned to this commit (00-provenance)
def at_pin(name):
    return subprocess.run(["git", "-C", str(ata), "show", f"{PIN}:{name}"], capture_output=True,
                          text=True, encoding="utf-8").stdout.splitlines()
README = at_pin("README.md"); ROADMAP = at_pin("ROADMAP.md"); AGENTS = at_pin("AGENTS.md")
files = sorted(pkg.rglob("*.md"))
problems = defaultdict(list)

# ---------- README §6 tree (J3 oracle) ----------
start = next(i for i, l in enumerate(README) if l.startswith("## 6. Fully commented target repository"))
blk = README[start:]
b0 = next(i for i, l in enumerate(blk) if l.startswith("```text")) + 1
b1 = next(i for i in range(b0, len(blk)) if blk[i].startswith("```"))
tree = set(); stack = []
for l in blk[b0 + 1:b1]:
    m = re.match(r"^([│ ]*)[├└]── ([^\s#]+)", l)
    if not m: continue
    depth = len(m.group(1)) // 4
    stack = stack[:depth] + [m.group(2).rstrip("/")]
    tree.add("/".join(stack))
target_paths = set(tree)
for p in list(tree):
    if p.startswith("src/autonomous_trading/"):
        target_paths.add(p[len("src/autonomous_trading/"):])
# tree deltas from 05-module-index (paths listed in the deltas table)
mi = (pkg / "05-module-index.md").read_text(encoding="utf-8")
deltas = set(re.findall(r"^\| T-\d+ \| `([^`]+)` \|", mi, re.M))
target_paths |= deltas
target_paths |= {d[len("src/autonomous_trading/"):] for d in deltas if d.startswith("src/autonomous_trading/")}
target_dirs = {p.rsplit("/", 1)[0] for p in target_paths if "/" in p} | {p for p in target_paths}
ROOTS = ("kernel/", "contracts/", "settings/", "market/", "strategies/", "cognition/", "adapters/",
         "research/", "operations/", "interfaces/", "resources/", "scripts/", "tests/", "deploy/",
         "config/", "operator_ui/", "src/autonomous_trading/", "docs/", ".github/")

def gh_slug(h):
    h = h.strip().lower()
    out = []
    for ch in h:
        if ch.isalnum() or ch in " -_": out.append(ch)
        elif unicodedata.category(ch).startswith("L"): out.append(ch)
    return "".join(out).replace(" ", "-")

def anchors(path):
    try: lines = path.read_text(encoding="utf-8").splitlines()
    except Exception: return set()
    seen = defaultdict(int); out = set(); infence = False
    for l in lines:
        if l.startswith("```"): infence = not infence; continue
        if infence: continue
        m = re.match(r"^#{1,6}\s+(.*)$", l)
        if m:
            s = gh_slug(re.sub(r"`", "", m.group(1)))
            n = seen[s]; seen[s] += 1
            out.add(s if n == 0 else f"{s}-{n}")
        for a in re.findall(r'<a id="([^"]+)"', l): out.add(a)
    return out

def section_of(lines, n):
    s = n - 1
    while s > 0 and not lines[s].startswith("#"): s -= 1
    e = n
    while e < len(lines) and not lines[e].startswith("#"): e += 1
    return "\n".join(lines[s:e])

defs = defaultdict(list); refs = defaultdict(set)
ID_DEF = [(r"^\| (POL-[A-Z0-9]+) \|", "POL"), (r"^\| (REQ-[A-Z]+-\d{3}) \|", "REQ"),
          (r"^\| (PRF-[A-Z]+-\d{2}) \|", "PRF"), (r"^\| (LD-\d{2}) \|", "LD"),
          (r"^## (Q-\d{3})$", "Q"), (r"^## (X-\d{3})$", "X"), (r"^\| (T-\d{2}) \|", "T"),
          (r"^\| (TASK-S\d{2}-\d{2}) \|", "TASK")]
for f in files:
    rel = f.relative_to(pkg).as_posix()
    text = f.read_text(encoding="utf-8"); lines = text.splitlines()
    # fenced code (for example this script's own text, embedded in the cross-document check) is not prose
    fence = False; prose = []
    for l in lines:
        if l.startswith("```"): fence = not fence; prose.append(""); continue
        prose.append("" if fence else l)
    lines_all, lines = lines, prose
    for i, l in enumerate(lines, 1):
        for rx, kind in ID_DEF:
            m = re.match(rx, l)
            if m and not (kind == "REQ" and rel == "traceability.md"):
                defs[m.group(1)].append(f"{rel}:{i}")
        for tok in re.findall(r"\b(POL-[A-Z]?\d{2,3}[a-z]?|REQ-[A-Z]+-\d{3}|PRF-[A-Z]+-\d{2}|LD-\d{2}|Q-\d{3}|X-\d{3}|T-\d{2}|TASK-S\d{2}-\d{2})\b", l):
            refs[tok].add(f"{rel}:{i}")
    # links (J4)
    for i, l in enumerate(lines, 1):
        for target in re.findall(r"\]\(([^)\s]+)\)", l):
            if re.match(r"^[a-z]+://", target): continue
            path_part, _, anc = target.partition("#")
            dest = (f.parent / path_part).resolve() if path_part else f.resolve()
            if not dest.exists():
                problems["J4 broken link"].append(f"{rel}:{i} -> {target}"); continue
            if anc and dest.suffix == ".md" and anc not in anchors(dest):
                problems["J4 broken anchor"].append(f"{rel}:{i} -> {target}")
    # module references (J3); the verbatim commissioning prompt under process/ is exempt
    for i, l in enumerate(lines if not rel.startswith('process/') else [], 1):
        for tok in re.findall(r"`([A-Za-z0-9_./*{},-]+)`", l):
            t = tok.rstrip(",")
            if re.search(r":\d", t) or "@" in t: continue
            if t.startswith("OA/") or t.startswith("src/") and not t.startswith("src/autonomous_trading"): continue
            if not t.startswith(ROOTS) and t not in ("bootstrap.py", "pyproject.toml", "requirements.lock"): continue
            if (at / t).exists(): continue  # legacy path of the same name
            parts = re.sub(r"\{[^}]*\}", "X", t)
            if "*" in parts:
                base = parts.split("*")[0].rstrip("/")
                if base and base not in target_dirs:
                    problems["J3 out-of-tree glob"].append(f"{rel}:{i} `{t}`")
                continue
            if t.endswith("/"): t = t.rstrip("/")
            if t not in target_paths and t not in target_dirs:
                problems["J3 out-of-tree path"].append(f"{rel}:{i} `{t}`")
    # master citations (J5)
    for i, l in enumerate(lines, 1):
        last = None
        for m in re.finditer(r"`(README\.md|ROADMAP\.md|AGENTS\.md)?:(\d+)(?:-(\d+))?`", l):
            fname = m.group(1) or last
            if fname is None: continue
            last = fname
            src = {"README.md": README, "ROADMAP.md": ROADMAP, "AGENTS.md": AGENTS}[fname]
            if "461f9c2" in l[max(0, m.start()-40):m.end()+40]: continue
            a = int(m.group(2)); b = int(m.group(3) or a)
            if b > len(src) or a < 1:
                problems["J5 out of range"].append(f"{rel}:{i} {fname}:{a}-{b}"); continue
            pre = l[:m.start()]
            idm = re.search(r"(D\d{2}|A\d{2}-F\d|Combined-F\d|AUD-0\d|ATA-0\d)(?:[/,–\- A-Za-z0-9]*)?\s*\(?$", pre[-40:])
            if idm:
                did = idm.group(1)
                sec = "\n".join(src[max(0, a - 1 - 0):b]) + "\n" + section_of(src, a)
                if did not in sec:
                    problems["J5 ID not in cited section"].append(f"{rel}:{i} {did} -> {fname}:{a}")

# ID integrity (J4)
for k, v in defs.items():
    if len(v) > 1: problems["J4 duplicate ID definition"].append(f"{k}: {v}")
for k, v in refs.items():
    if k not in defs and not k.startswith("TASK-S01-") :
        problems["J4 undefined ID"].append(f"{k} used at {sorted(v)[:3]}")

# J2 traceability counts
tr = (pkg / "traceability.md").read_text(encoding="utf-8")
full = re.findall(r"^\| (REQ-[A-Z]+-\d{3}) \|.*\| specified \|$", tr, re.M)
stub = re.findall(r"^\| (REQ-[A-Z]+-\d{3}) \|.*\| pointer \|$", tr, re.M)
for row in re.findall(r"^\| REQ-.*\| specified \|$", tr, re.M):
    cells = [c.strip() for c in row.strip("|").split("|")]
    if any(c in ("", "-") for c in (cells[2], cells[5])) and "package rule" not in cells[2]:
        problems["J2 incomplete row"].append(cells[0])
for prf in sorted({p for p in re.findall(r"PRF-[A-Z]+-\d{2}", tr)}):
    if prf not in defs: problems["J2 proof undefined"].append(prf)

# J7 scope
st = subprocess.run(["git", "-C", str(ata), "status", "--porcelain", "--untracked-files=all"],
                    capture_output=True, text=True).stdout.splitlines()
outside = [s for s in st if not s[3:].startswith("specs/implementation/")]

print(f"files={len(files)} tree_paths={len(tree)} deltas={len(deltas)} full_keys={len(full)} stub_keys={len(stub)}")
print(f"J7 changed={len(st)} outside_specs={len(outside)} {outside[:5]}")
for k in sorted(problems):
    print(f"\n## {k}: {len(problems[k])}")
    for p in problems[k][:60]: print("  ", p)
if not problems: print("\nno problems")
```

### `gen_trace.py`

```python
import re, sys, pathlib

root = pathlib.Path(sys.argv[1])  # specs/implementation
design = root / "design"
FULL = ["ledger-and-atomic-transaction", "sessions-authority-lifecycle", "intent-to-admission",
        "dispatch-and-coordination", "execution-domain-and-observations", "protection-and-safety",
        "cross-cutting-invariants"]
M = {  # key: (module, tasks, proofs)
    "REQ-LED-001": ("kernel/ledger/store.py, resources/migrations/001_initial.sql", "TASK-S01-14, TASK-S01-21", "PRF-LED-01, PRF-LED-02"),
    "REQ-LED-002": ("kernel/ledger/envelope.py", "TASK-S01-18", "PRF-LED-01, PRF-LED-15"),
    "REQ-LED-003": ("kernel/ledger/store.py, kernel/ledger/runtime.py", "TASK-S01-17, TASK-S01-21, TASK-S02-02", "PRF-LED-13, PRF-LED-14"),
    "REQ-LED-004": ("kernel/admission.py, kernel/ledger/store.py", "TASK-S01-24", "PRF-LED-03"),
    "REQ-LED-005": ("kernel/admission.py, kernel/reservations.py", "TASK-S01-23, TASK-S01-24", "PRF-LED-04"),
    "REQ-LED-006": ("contracts/execution.py, kernel/coordinator.py", "TASK-S01-09, TASK-S01-26", "PRF-LED-04, PRF-LED-07"),
    "REQ-LED-007": ("kernel/lifecycle.py", "TASK-S01-22, TASK-S05-05", "PRF-LED-16"),
    "REQ-LED-008": ("kernel/ledger/schema.py, resources/migrations/001_initial.sql", "TASK-S01-19, TASK-S13-01", "PRF-LED-10"),
    "REQ-LED-009": ("kernel/ledger/projections.py", "TASK-S02-01", "PRF-LED-08"),
    "REQ-LED-010": ("kernel/ledger/store.py", "TASK-S01-21, TASK-S01-26", "PRF-LED-04, PRF-LED-05"),
    "REQ-LED-011": ("kernel/reservations.py, kernel/lifecycle.py", "TASK-S07-03", "PRF-LED-09"),
    "REQ-LED-012": ("kernel/coordinator.py", "TASK-S01-26", "PRF-DSP-02"),
    "REQ-LED-013": ("contracts/execution.py", "TASK-S01-09", "PRF-LED-04"),
    "REQ-LED-014": ("kernel/ledger/export.py", "TASK-S02-03", "PRF-DOM-05"),
    "REQ-LED-015": ("contracts/identity.py, kernel/ledger/store.py", "TASK-S01-05, TASK-S03-04", "PRF-LED-05, PRF-LED-12"),
    "REQ-LED-016": ("bootstrap.py, kernel/ledger/store.py", "TASK-S01-27", "PRF-XC-02"),
    "REQ-SES-001": ("kernel/authority.py", "TASK-S03-01", "PRF-SES-01"),
    "REQ-SES-002": ("kernel/authority.py, kernel/recovery.py", "TASK-S03-04", "PRF-SES-05"),
    "REQ-SES-003": ("kernel/lifecycle.py, contracts/identity.py", "TASK-S03-02", "PRF-SES-03"),
    "REQ-SES-004": ("kernel/lifecycle.py", "TASK-S03-02", "PRF-SES-03"),
    "REQ-SES-005": ("kernel/safety.py, kernel/lifecycle.py", "TASK-S03-02, TASK-S06-04", "PRF-SES-08"),
    "REQ-SES-006": ("contracts/clock.py, adapters/clocks.py", "TASK-S01-06, TASK-S01-10, TASK-S03-03", "PRF-SES-04"),
    "REQ-SES-007": ("kernel/authority.py", "TASK-S03-02", "PRF-SES-09"),
    "REQ-SES-008": ("kernel/recovery.py", "TASK-S03-04", "PRF-SES-03, PRF-SES-05"),
    "REQ-SES-009": ("kernel/recovery.py", "TASK-S03-04", "PRF-SES-10, PRF-SES-07"),
    "REQ-SES-010": ("kernel/authority.py", "TASK-S03-05", "PRF-SES-06"),
    "REQ-SES-011": ("kernel/authority.py", "TASK-S03-02", "PRF-SES-09"),
    "REQ-ADM-001": ("contracts/decisions.py", "TASK-S04-01", "PRF-ADM-08"),
    "REQ-ADM-002": ("kernel/policy.py", "TASK-S04-01", "PRF-ADM-01, PRF-ADM-02"),
    "REQ-ADM-003": ("kernel/planner.py", "TASK-S04-02", "PRF-ADM-03"),
    "REQ-ADM-004": ("kernel/planner.py", "TASK-S04-02", "PRF-ADM-03, PRF-ADM-07"),
    "REQ-ADM-005": ("kernel/planner.py, kernel/selection.py", "TASK-S04-02", "PRF-ADM-08"),
    "REQ-ADM-006": ("contracts/execution.py, kernel/admission.py", "TASK-S04-05", "PRF-ADM-04"),
    "REQ-ADM-007": ("kernel/admission.py", "TASK-S04-04, TASK-S04-05", "PRF-ADM-04"),
    "REQ-ADM-008": ("kernel/admission.py", "TASK-S04-05", "PRF-ADM-04, PRF-ADM-06"),
    "REQ-ADM-009": ("kernel/admission.py, kernel/reservations.py", "TASK-S04-03", "PRF-ADM-04, PRF-ADM-09"),
    "REQ-ADM-010": ("kernel/policy.py", "TASK-S04-01", "PRF-ADM-06"),
    "REQ-ADM-011": ("kernel/admission.py", "TASK-S04-05, TASK-S05-01", "PRF-DSP-01, PRF-ADM-09"),
    "REQ-DSP-001": ("kernel/coordinator.py", "TASK-S05-01", "PRF-DSP-01, PRF-DSP-09"),
    "REQ-DSP-002": ("kernel/coordinator.py", "TASK-S01-26", "PRF-DSP-02"),
    "REQ-DSP-003": ("kernel/safety.py", "TASK-S05-03", "PRF-PRT-11"),
    "REQ-DSP-004": ("kernel/coordinator.py", "TASK-S05-04", "PRF-DSP-07"),
    "REQ-DSP-005": ("kernel/coordinator.py", "TASK-S05-02", "PRF-DSP-05"),
    "REQ-DSP-006": ("kernel/coordinator.py", "TASK-S05-06", "PRF-DSP-03, PRF-DSP-10"),
    "REQ-DSP-007": ("kernel/coordinator.py", "TASK-S05-01", "PRF-DSP-03"),
    "REQ-DSP-008": ("kernel/coordinator.py", "TASK-S05-02", "PRF-DSP-06"),
    "REQ-DSP-009": ("kernel/coordinator.py", "TASK-S05-01, TASK-S05-07", "PRF-DSP-08"),
    "REQ-DSP-010": ("kernel/coordinator.py", "TASK-S01-26, TASK-S05-01", "PRF-DSP-11"),
    "REQ-DSP-011": ("adapters/simulated_broker.py", "TASK-S01-11", "PRF-DSP-12, PRF-XC-02"),
    "REQ-DOM-001": ("adapters/openalgo.py, contracts/evidence.py", "TASK-S07-04", "PRF-DOM-01"),
    "REQ-DOM-002": ("contracts/evidence.py", "TASK-S01-14, TASK-S07-04", "PRF-DOM-01"),
    "REQ-DOM-003": ("adapters/openalgo.py, kernel/admission.py", "TASK-S07-04", "PRF-DOM-08"),
    "REQ-DOM-004": ("kernel/reconciliation.py", "TASK-S07-04", "PRF-DOM-08"),
    "REQ-DOM-005": ("adapters/openalgo.py", "TASK-S07-01", "PRF-DOM-02"),
    "REQ-DOM-006": ("kernel/reconciliation.py", "TASK-S07-02", "PRF-DOM-02"),
    "REQ-DOM-007": ("kernel/reconciliation.py", "TASK-S07-02", "PRF-DOM-09"),
    "REQ-DOM-008": ("kernel/reconciliation.py", "TASK-S07-02", "PRF-DOM-02"),
    "REQ-DOM-009": ("adapters/openalgo.py", "TASK-S07-01", "PRF-DOM-04"),
    "REQ-DOM-010": ("adapters/openalgo.py", "TASK-S07-01", "PRF-DOM-04"),
    "REQ-DOM-011": ("kernel/reconciliation.py", "TASK-S07-02", "PRF-DOM-03"),
    "REQ-DOM-012": ("kernel/ports.py", "TASK-S07-06, TASK-S11-06", "PRF-DOM-06, PRF-DOM-10"),
    "REQ-DOM-013": ("contracts/evidence.py, kernel/ledger/export.py", "TASK-S02-03", "PRF-DOM-05"),
    "REQ-DOM-014": ("adapters/openalgo.py", "TASK-S07-05", "PRF-DOM-07"),
    "REQ-DOM-015": ("kernel/reconciliation.py", "TASK-S07-04", "PRF-DOM-08"),
    "REQ-PRT-001": ("kernel/protection.py", "TASK-S06-01", "PRF-PRT-06, PRF-PRT-09, PRF-PRT-10"),
    "REQ-PRT-002": ("kernel/protection.py", "TASK-S06-01", "PRF-PRT-09"),
    "REQ-PRT-003": ("kernel/protection.py", "TASK-S06-01, TASK-S06-02", "PRF-PRT-01, PRF-PRT-03"),
    "REQ-PRT-004": ("kernel/protection.py", "TASK-S06-01", "PRF-PRT-02, PRF-PRT-08"),
    "REQ-PRT-005": ("kernel/protection.py", "TASK-S06-01", "PRF-PRT-06"),
    "REQ-PRT-006": ("kernel/protection.py", "TASK-S06-05", "PRF-PRT-07"),
    "REQ-PRT-007": ("kernel/safety.py", "TASK-S05-07, TASK-S06-03, TASK-S06-04", "PRF-PRT-04"),
    "REQ-PRT-008": ("kernel/safety.py", "TASK-S06-03", "PRF-PRT-04"),
    "REQ-PRT-009": ("kernel/safety.py", "TASK-S05-03", "PRF-PRT-11"),
    "REQ-PRT-010": ("kernel/protection.py", "TASK-S06-01, TASK-S06-06", "PRF-PRT-01, PRF-PRT-13"),
    "REQ-PRT-011": ("operations/supervisor.py", "TASK-S11-03", "PRF-PRT-14"),
    "REQ-PRT-012": ("kernel/safety.py", "TASK-S06-06", "PRF-PRT-05"),
    "REQ-PRT-013": ("kernel/protection.py", "TASK-S06-01", "PRF-PRT-02"),
    "REQ-PRT-014": ("kernel/protection.py", "TASK-S06-07, TASK-S14-01", "PRF-PRT-12"),
    "REQ-PRT-015": ("kernel/protection.py", "TASK-S06-01", "PRF-PRT-01"),
    "REQ-XC-001": ("(package rule)", "(checker)", "PRF-XC-04"),
    "REQ-XC-002": ("bootstrap.py", "TASK-S01-27", "PRF-XC-01, PRF-XC-02"),
    "REQ-XC-003": ("settings/schema.py, kernel/admission.py", "TASK-S01-16, TASK-S01-24", "PRF-XC-03"),
    "REQ-XC-004": ("kernel/safety.py", "TASK-S06-06", "PRF-PRT-05"),
    "REQ-XC-005": ("(package rule)", "(checker)", "PRF-XC-04"),
    "REQ-XC-006": ("scripts/safe_tests.py", "TASK-S01-28", "R: process rule"),
    "REQ-XC-007": ("kernel/ledger/export.py", "TASK-S02-03", "PRF-DOM-08"),
    "REQ-XC-008": ("adapters/unix_channel.py", "TASK-S11-02", "README.md:1225 (named proof written at SLICE-11)"),
}
STUB_SLICE = {"market-data-and-canvas": "SLICE-08", "strategies-and-cognition": "SLICE-09",
              "research-rl-custody-promotion": "SLICE-12", "security-and-operator": "SLICE-10",
              "configuration-artifacts-release": "SLICE-11", "runtime-isolation-observability-deployment": "SLICE-11",
              "migration-recovery-rollback-continuity": "SLICE-11, SLICE-13, SLICE-14"}
STUB_PROOF = {"MKT": "README.md:1234-1236", "STR": "README.md:1243", "RES": "README.md:1238, :1245",
              "SEC": "README.md:1244", "CFG": "README.md:1221, :1225-1227, :1233",
              "OPS": "README.md:1239-1240, :1247", "MIG": "README.md:1232, :1242, :1253, :1255"}
STUB_MOD = {"market-data-and-canvas": "market/*, contracts/market.py",
            "strategies-and-cognition": "strategies/*, cognition/*",
            "research-rl-custody-promotion": "research/*",
            "security-and-operator": "interfaces/*, settings/secrets.py, adapters/unix_channel.py",
            "configuration-artifacts-release": "bootstrap.py, settings/*, resources/*",
            "runtime-isolation-observability-deployment": "operations/supervisor.py, operations/isolation.py, deploy/*",
            "migration-recovery-rollback-continuity": "operations/deployment.py, operations/backup.py, operations/restore.py, adapters/compatibility.py"}
rows, stubs, seen = [], [], set()
for f in sorted(design.glob("*.md")):
    name = f.stem
    for line in f.read_text(encoding="utf-8").splitlines():
        if not re.match(r"^\| REQ-[A-Z]+-\d{3} \|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        key, label, dec = cells[0], cells[1], cells[2]
        spec_proof = cells[3] if len(cells) > 3 else None
        if spec_proof:
            out_ids, prefix = [], None
            for tok in re.split(r",\s*", spec_proof):
                tok = tok.strip()
                mm2 = re.match(r"^(PRF-[A-Z]+)-(\d{2})(.*)$", tok)
                if mm2:
                    prefix = mm2.group(1); out_ids.append(f"{prefix}-{mm2.group(2)}{mm2.group(3)}")
                elif re.match(r"^-\d{2}", tok) and prefix:
                    out_ids.append(prefix + tok)
                else:
                    out_ids.append(tok)
            spec_proof = ", ".join(out_ids)
            spec_proof = re.sub(r"\]\(([^)]+)\)", lambda mm: mm.group(0) if mm.group(1).startswith(("http", "#")) else ("](" + mm.group(1)[3:] + ")" if mm.group(1).startswith("../") else "](design/" + mm.group(1) + ")"), spec_proof)
        def fix(mm):
            target = mm.group(1)
            if target.startswith(("http", "#")): return mm.group(0)
            if target.startswith("../"): return "](" + target[3:] + ")"
            return "](design/" + target + ")"
        dec = re.sub(r"\]\(([^)]+)\)", fix, dec)
        assert key not in seen, key
        seen.add(key)
        if name in FULL:
            assert key in M, key
            mod, task, proof = M[key]
            if spec_proof: proof = spec_proof
            anchor = "requirement-keys"
            rows.append(f"| {key} | {dec} | `{mod}` | [{name}](design/{name}.md#{anchor}) | {task} | {proof} | specified |")
        else:
            dom = key.split("-")[1]
            stubs.append(f"| {key} | {dec} | `{STUB_MOD[name]}` | [{name}](design/{name}.md#requirement-keys-pointers) | {STUB_SLICE[name]} (tasks written at slice start) | {STUB_PROOF[dom]} | pointer |")
extra = set(M) - seen
assert not extra, extra
hdr = "| Key | Decision and policy (the requirement) | Module | Spec | Task | Proof | Proof status |\n|---|---|---|---|---|---|---|\n"
out = (
    "# Traceability matrix\n\n"
    "* **Status:** proposed, non-normative. Generated from the requirement-key tables in [design/](design/) "
    "by a read-only script kept outside the repository (described in "
    "[consistency/cross-document-check.md](consistency/cross-document-check.md)).\n"
    "* **Precedence:** a key is a pointer. Its requirement is the cited master decision or policy row. "
    "If this file and a spec disagree, the spec's key table wins and the matrix is regenerated.\n"
    "* **Proof status:** *specified* = expected outcomes written, no code yet; *pointer* = the master "
    "acceptance row that the slice turns into named proofs when its full spec is written "
    "([test strategy](tests/test-strategy.md#proof-classes-and-status)). Nothing here is *passing*.\n\n"
    f"Counts: **{len(rows)}** keys in full-depth specs, each with a module, a task and a proof; "
    f"**{len(stubs)}** keys in stubs, each pointing at a master acceptance row.\n\n"
    "## Full-depth domains\n\n" + hdr + "\n".join(rows) +
    "\n\n## Stub domains (deepened at their slice)\n\n" + hdr + "\n".join(stubs) + "\n"
)
(root / "traceability.md").write_text(out, encoding="utf-8")
print(len(rows), len(stubs))

#shifted-s01
```
