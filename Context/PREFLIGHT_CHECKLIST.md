# Perfect Storm — Pre-Deploy Preflight Checklist
*Last Updated: May 4, 2026*

> Run this before every `git push`. The goal is to catch crashes before Netlify deploys them to production. Perfect Storm has a single `App.jsx` of ~13,600 lines — one unclosed bracket or bad insertion silently kills the whole app.

---

## Quick Reference — Known Crash Patterns

These are the bugs that have actually crashed the app in the past. Check these first.

| # | Crash Pattern | Symptom | Cause | Prevention |
|---|--------------|---------|-------|------------|
| 1 | Unclosed `pills:[]` array | White screen / build error | Missing `]` after last pill object in a `STOCKS` entry | Use Python to insert, grep to verify |
| 2 | Duplicate closing `];` | Nation View white screen | Python `rfind('];')` hit `NATIONS` bracket instead of `RAW_STOCKS` | Always find `];` between `RAW_STOCKS` and `NATIONS` positions |
| 3 | Missing comma between objects | Parse error | `}` followed by `{` with no `,` | Always add trailing comma to last element before insertion point |
| 4 | Broken Dropbox git ref | `fatal: cannot lock ref 'HEAD'` | Dropbox empties `.git/refs/heads/master` | Use `python3 -c "open('.git/refs/heads/master','w').write('HASH\n')"` |
| 5 | `git push` blocked | `403 proxy error` | Sandbox HTTP proxy blocks GitHub HTTPS | Eugene must push in PowerShell, not from sandbox |
| 6 | Netlify extension error | Build fails at "Installing extensions" | Neon DB extension left enabled | Remove from Netlify Site > Extensions |
| 7 | Undefined variable in JSX | White screen at runtime | Forward reference to a component/const not yet defined | Verify all new components defined BEFORE their usage |
| 8 | `SIGNAL_RULES` duplicate ID | Silent: last rule with same ID wins | Copy-paste error on SR-0XX | grep for duplicate IDs before push |
| 9 | Invalid regex in SIGNAL_RULES | Runtime crash on first article | Unescaped special char, unbalanced groups | Test regex with `new RegExp(pattern).test("test")` in console |
| 10 | `pills:[]` cluster pill missing closing `}` | Syntax error, full build crash | Malformed cluster pill object | Always use consistent `{ dir:'risk', cat:'X', label:'...', state:'active' }` |
| 11 | Hook declared after `useMemo` that uses it | **White screen — build succeeds, runtime crashes** | `const` TDZ: `const [x] = useState()` at line N used in `useMemo(()=>{...x...}, [...x...])` at line M where M < N | Run Step 1e (hook ordering check) after any new `useState`/`useMemo` addition |
| 12 | Apostrophe in single-quoted JS string | Build error: `Expected "}" but found "s"` | `label:'McDonald's...'` — unescaped `'` terminates the string | Use `\'` inside single-quoted labels, or switch to double-quoted strings |
| 13 | Orphaned objects at RAW_STOCKS root | White screen — `normalizePillCategories` (`Bp` in bundle) crashes on `undefined.map()` | Bare `{dir:..., label:...}` pill objects accidentally left at the top level of `RAW_STOCKS` array (no `ticker`/`pills` field) | Run orphan check: `python3 -c "import re; c=open('src/App.jsx').read(); s=c[c.find('const RAW_STOCKS'):c.find('const STOCKS_STATIC')]; print('OK' if len(re.findall(r'ticker:', s)) == s.count('pills:[') else 'ORPHANS FOUND')"` |

---

## Pre-Push Checklist — Run Every Time

### Step 1 — Syntax Verification (2 min)

```bash
# 1a. Check App.jsx can be parsed by Node (catches most syntax errors)
node --input-type=module < src/App.jsx 2>&1 | head -20
# If this fails, you have a parse error. Do NOT push.

# 1b. Count opening vs closing brackets in STOCKS array
# (Should be balanced — open braces = close braces)
python3 -c "
import re
with open('src/App.jsx') as f:
    content = f.read()
start = content.find('const RAW_STOCKS')
end = content.find('const NATIONS', start)
segment = content[start:end]
opens = segment.count('{')
closes = segment.count('}')
print(f'RAW_STOCKS braces: {{ {opens} vs }} {closes} — {\"OK\" if opens==closes else \"MISMATCH\"}')"

# 1c. Check SIGNAL_RULES has no duplicate IDs
python3 -c "
import re
with open('src/App.jsx') as f:
    content = f.read()
ids = re.findall(r'id:\"(SR-\d+)\"', content)
from collections import Counter
dupes = [id for id, count in Counter(ids).items() if count > 1]
print('Duplicate SR IDs:', dupes if dupes else 'None — OK')"

# 1d. Check no unclosed JSX in new components
# (Look for asymmetric JSX tags in any new components added)
grep -n "return (" src/App.jsx | tail -20   # sanity check for last few render functions

# 1e. *** Hook ordering check — catches white-screen TDZ crashes ***
# Run this after adding ANY new useState or useMemo. Build will pass but app
# crashes at runtime if a useMemo dep references a const declared after it.
python3 - <<'PYEOF'
import re
with open('src/App.jsx') as f:
    lines = f.readlines()

func_starts = []
for i, line in enumerate(lines, 1):
    if re.match(r'^function \w+|^const \w+ = \(|^export default function', line.strip()):
        func_starts.append(i)

def find_comp(n):
    c = None
    for fs in func_starts:
        if fs <= n: c = fs
        else: break
    return c

hook_decls, usememo_refs = {}, []
for i, line in enumerate(lines, 1):
    m = re.match(r'const \[(\w+),', line.strip())
    if m: hook_decls[m.group(1)] = i
    m2 = re.search(r'\}, \[([^\]]+)\]\)', line.strip())
    if m2:
        usememo_refs.append((i, [d.strip() for d in m2.group(1).split(',')]))

issues = []
for memo_line, deps in usememo_refs:
    mc = find_comp(memo_line)
    for dep in deps:
        if dep in hook_decls:
            dl = hook_decls[dep]
            if find_comp(dl) == mc and dl > memo_line:
                issues.append(f"Line {memo_line}: '{dep}' declared at {dl} (AFTER useMemo!)")

if issues:
    print(f"⚠️  {len(issues)} hook ordering issue(s):")
    for i in issues: print(f"    {i}")
    print("FIX: move the useState for each flagged var to BEFORE the useMemo that uses it.")
else:
    print("✓ Hook ordering OK")
PYEOF
```

---

### Step 2 — Content Verification (1 min)

```bash
# 2a. Verify total pill count is sane (should be ~1900+)
grep -c "dir:\"risk\"\|dir:\"opp\"\|dir:'risk'\|dir:'opp'" src/App.jsx

# 2b. Verify SIGNAL_RULES count (should be 62+)
grep -c "id:\"SR-" src/App.jsx

# 2c. Confirm PILL_EPOCH is gone (removed May 2026 — do not re-introduce)
grep "PILL_EPOCH" src/App.jsx
# Should return nothing. If it appears, remove it — the correct model is:
# pills with no lastChecked → daysSinceReview=Infinity → needsReview=true immediately

# 2d. Check for accidentally committed test data
grep "dateAdded.*2025\|dateAdded.*2026-01\|dateAdded.*2026-02" src/App.jsx
# If results: verify these are intentional (not test/debugging pills left behind)

# 2e. Verify no API keys in source
grep -E "BRAVE_SEARCH_KEY|NEWSAPI_KEY|api_key|apiKey|Bearer " src/App.jsx
# Should return nothing — keys live in Netlify env, never in source
```

---

### Step 3 — Git State Verification (1 min)

```bash
# 3a. Check git status — nothing unexpected staged
git status
# Should only show the files you intentionally modified

# 3b. Check diff summary
git diff --stat HEAD
# Review: does file count and line change count match what you expect?

# 3c. Verify git ref is intact (Dropbox corruption check)
cat .git/refs/heads/master
# Should be a 40-char hex hash. If empty/missing → fix before committing:
# python3 -c "open('.git/refs/heads/master','w').write('LAST_KNOWN_HASH\n')"

# 3d. Get last 5 commits to ensure history is intact
git log --oneline -5
```

---

### Step 4 — Specific Insertion Point Checks

Run these when you've added to `RAW_STOCKS`, `NATIONS`, `SIGNAL_RULES`, or `CLUSTERS`:

```bash
# After inserting into RAW_STOCKS:
python3 -c "
with open('src/App.jsx') as f: content = f.read()
raw_start = content.find('const RAW_STOCKS')
nations_start = content.find('const NATIONS', raw_start)
segment = content[raw_start:nations_start]
# Verify no double-closing bracket
if '];' not in segment:
    print('WARNING: RAW_STOCKS closing ]; not found between RAW_STOCKS and NATIONS')
else:
    print('RAW_STOCKS bracket: OK')"

# After adding a SIGNAL_RULES entry:
python3 -c "
import re
with open('src/App.jsx') as f: content = f.read()
rules = re.findall(r'\{ id:\"(SR-\d+)\"', content)
expected = list(range(1, len(rules)+1))
actual = sorted([int(r.replace('SR-','')) for r in rules])
missing = [n for n in expected if n not in actual]
print(f'Rules: {len(rules)} found. Missing IDs: {missing if missing else \"None — OK\"}')"

# After adding a new component:
python3 -c "
import re
with open('src/App.jsx') as f: content = f.read()
# Find all function/const declarations that look like components
components = re.findall(r'^(function|const) ([A-Z][A-Za-z]+)', content, re.MULTILINE)
print('Components defined:', len(components))"
```

---

### Step 5 — Commit & Push Protocol

```bash
# Stage only the specific files you changed (never git add -A or git add .)
git add src/App.jsx
# Add other files if changed:
# git add src/ps-feeds.js
# git add netlify/functions/pill-articles.js
# git add netlify/functions/export.js

# Write commit message following this format:
# <type>(<scope>): <what changed>
# 
# Types: feat / fix / content / refactor / docs
# Scope: pills / rules / feeds / ui / api / config
# 
# Examples:
#   content(pills): refresh AAPL/NVDA/DAL curated pills for May 2026
#   feat(rules): add India-Pakistan escalation signal SR-063
#   fix(config): reset PILL_EPOCH to 2026-05-04

git commit -m "your message"

# ⚠️ THEN: Eugene pushes from PowerShell (sandbox proxy blocks GitHub HTTPS)
# git push  ← run this in PowerShell, not from sandbox
```

---

### Step 6 — Post-Deploy Verification (3 min)

After Eugene runs `git push` and Netlify deploys (~2 min build):

```
□ Open https://perfect-storm.app in browser
□ App loads without white screen
□ Top-right shows "LIVE" within 30 seconds (not "OFFLINE")
□ RISKS / OPENINGS / STORMS counters are non-zero
□ Signal Feed shows articles
□ Click on one ticker → Reference Card opens, pills are visible
□ Card View sorts correctly (highest storm score at top)
□ Check browser console for errors (F12 → Console) — should be no red errors
```

---

## Emergency Recovery Procedures

### White Screen After Deploy

1. Check Netlify deploy log at `app.netlify.com` → your site → Deploys
2. If build passed but app shows white screen: open browser console (F12) for the JS error
3. Common culprits and their error messages:
   - `Uncaught SyntaxError` → un-merged bracket/paren — run Step 1a/1b
   - `ReferenceError: Cannot access 'X' before initialization` → **hook ordering bug** — a `useState` for `X` is declared after a `useMemo` that uses `X` in its dep array. Run Step 1e to find and fix it.
   - `Uncaught ReferenceError: X is not defined` → component/const defined after use
   - `Cannot read properties of undefined (reading 'something')` → data shape mismatch — check new pill/stock fields for unexpected undefined
   - `Expected "}" but found "s"` (build error) → apostrophe in single-quoted JS string — grep for `label:'[^']*'[^']*'` to find them
4. **After fixing one error, always re-run Step 1e** — white screens sometimes have multiple root causes. Fix the first error, run the hook-ordering check again, confirm the console is clean.
5. Fix in App.jsx, re-run Steps 1–5, re-push

### git ref corruption

```bash
# Symptoms: "fatal: cannot lock ref 'HEAD': unable to resolve reference 'refs/heads/master': reference broken"
git log --all --oneline | head -5   # get recent commit hash
# Copy the hash, then:
python3 -c "open('.git/refs/heads/master','w').write('PASTE_HASH_HERE\n')"
# Then retry: git add ... && git commit ...
```

### Netlify Build Failing

Check for:
1. Extension errors → Netlify Dashboard → Site → Extensions → remove any non-essential ones (the Neon DB extension previously caused failures)
2. Node version mismatch → add `NODE_VERSION=18` in Netlify env vars
3. Missing env var → check that `BRAVE_SEARCH_KEY` / `NEWSAPI_KEY` are set if Netlify functions reference them

---

## Change Type Risk Matrix

Use this to calibrate how carefully to run the checklist:

| Change Type | Risk | Checklist Steps Required |
|-------------|------|--------------------------|
| Add/edit curated pills only (no new code) | Low | Steps 1b, 2a, 3a–3d, 5, 6 |
| Add new SIGNAL_RULES entry | Low | Steps 1c, 2b, 3a–3d, 5, 6 |
| Add/edit feeds in ps-feeds.js | Low | Steps 3a–3d, 5, 6 |
| Add new React component | Medium | All steps |
| Modify score calculation logic | High | All steps + manual score spot-check |
| Insert into RAW_STOCKS/NATIONS | High | All steps + Step 4 insertion checks |
| Modify force-worker.js | High | All steps + visual layout check in browser |
| Add Netlify function | Medium | Steps 3, 5, 6 + check function logs in Netlify dashboard |
