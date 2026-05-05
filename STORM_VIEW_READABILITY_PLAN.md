# Storm View Readability Fix Plan

## Audit Findings (from live site screenshots, 2026-03-28)

### Issue 1 — Surround Labels Collide in Dense Zones
**Where:** Center of canvas — "Capital Markets Revival", "Rate & Credit Risk", "Climate & Weather", "Commodity Super-Cycle" all overlap. Also AI/Semis zone: "AI Infrastructure", "Artificial Intelligence", "Antitrust & Regulatory" collide.

**Root cause:** Labels are rendered at `boxMinY - innerPad - 28` (always above the surround). When surrounds are close together vertically, labels from adjacent clusters land on the same Y band and pile up. The `resolveLabels()` function (line 2510) runs 80 push-apart iterations but is only used for inside-surround positioning — the SVG rendering at line 3590 uses its OWN independent position calculation, ignoring `resolveLabels()` entirely.

**Fix — Smart Label Placement with Leader Lines:**
1. Use `resolveLabels()` output (which already collision-resolves) as the authoritative label position.
2. If the resolved position is inside the surround bounding box and doesn't overlap any ticker pill, render the label **inside** the surround (no stem line needed — just the label pill floating inside).
3. If the label was pushed outside the surround (or the surround is too tight), render it **outside** with a 45° angled leader line from the label to the nearest surround edge point.
4. Leader line spec: same cluster color, 1px stroke, 0.5 opacity, with a small dot (r=2) at the surround anchor point.
5. Respect user-dragged offsets — apply `labelOffsets[c.id]` after collision resolution so manual positioning still works.

**Code changes:**
- Lines 3590–3597: Replace the independent `boxMinY` / `boxCx` calculation with the collision-resolved position from `resolveLabels()`.
- Lines 3622–3625: Replace vertical stem line with angled leader line. Compute the nearest point on the surround path to the label center, draw a line from label bottom-center to that point.
- Pass `resolvedLabels` array into the render block via a `useMemo` that calls `resolveLabels(visibleClusters, nodes, innerPad)`.

---

### Issue 2 — Ticker Pills Overlap at Low Offset
**Where:** Defense cluster (LMT, RTX, NOC, GD, BA, HII) at tight/6px offset — pills visually overlap. Also GOOGL/MSFT in Software zone.

**Root cause:** `FORCE_REPEL_DIST = TICKER_PW + 16 = 60px` defines the repulsion threshold. But `TICKER_PW = 44` is only the base pill width — pills with STORM badges, signal dots, or long ticker names can be wider. Also, the repulsion force is "soft" (linear falloff) — at high cluster gravity and low alpha, pills can settle at distances < 60px because gravity overwhelms the repulsion before the simulation cools.

**Fix — Hard Minimum Distance Enforcement:**
1. After the soft physics tick, add a **hard constraint pass** that guarantees no two pills are closer than `FORCE_REPEL_DIST` center-to-center.
2. Implementation: after line 2878 (boundary clamp), add a projection pass:
   ```
   for each pair (i, j):
     dist = distance(i, j)
     if dist < FORCE_REPEL_DIST:
       push both apart along their connecting axis until dist == FORCE_REPEL_DIST
       (split the correction 50/50 unless one is pinned)
   ```
3. Run this projection 2–3 times per tick for convergence (similar to Verlet constraint solving).
4. This guarantees pills can touch (at exactly 60px center-to-center) but never overlap, regardless of force balance.

**Code changes:**
- Lines 2869–2878: After the existing integration step, add a hard constraint loop.
- No change to FORCE_REPEL_DIST value — 60px (44px pill + 16px gap) is correct for "touching but not overlapping."

---

### Issue 3 — Threads Slider Does Nothing Visible
**Where:** THREADS slider (line 3341) controls `gravity` state. But `gravity` is ONLY used at lines 3649–3650 to gate thread visibility and set opacity. The threads themselves are 0.7px wide with max 0.35 opacity — nearly invisible on any monitor.

**Root cause:** Three compounding problems:
- Thread stroke is too thin (0.7px) to see at normal zoom
- Thread opacity caps at 0.35 (gravity * 0.35 at max gravity=1.0)
- The slider has no effect on the force physics — `gravity` is never passed to `useForceLayout`

**Fix — Make Threads Visually Meaningful:**

**A) Visual improvements (threads should be visible):**
1. Increase stroke width from 0.7 to a range: `1.0 + gravity * 1.5` (1.0–2.5px)
2. Increase opacity from `gravity * 0.35` to `gravity * 0.65` (0–0.65 range)
3. Remove dash pattern at "full" setting — solid lines at gravity=1, dashed at gravity<0.7
4. Add a subtle glow: duplicate the line with a wider stroke (4px), low opacity (0.1), and blur filter for a "energy thread" effect at full setting

**B) Physics coupling (slider should affect layout):**
1. Pass `gravity` into `useForceLayout` as a parameter
2. Use it to modulate `FORCE_CLUSTER_K`: `clusterK = FORCE_CLUSTER_K * (0.3 + gravity * 0.7)`
   - At gravity=0 (off): cluster pull is 30% of normal → tickers drift apart, looser layout
   - At gravity=1 (full): cluster pull is 100% → tickers cluster tightly
3. When gravity changes, call `reheat()` so the simulation re-settles with the new force balance
4. This gives the slider a double function: controls both thread visibility AND layout density

**Code changes:**
- Line 2765: Make `FORCE_CLUSTER_K` a base value, modulated by gravity parameter
- Lines 2787–2927 (useForceLayout): Accept `gravity` in the dependency/parameter list, use it in the cluster gravity section
- Lines 3649–3667: Update thread rendering with new stroke width, opacity, and optional glow
- Line 2938: Keep `gravity` state, but also pass it to force layout hook

---

## Implementation Order

| Step | Issue | Risk | Effort |
|------|-------|------|--------|
| 1 | Hard pill overlap constraint (Issue 2) | Low — additive physics pass, no existing behavior changes | Small |
| 2 | Thread visibility + physics (Issue 3) | Low — visual + one new parameter to force hook | Medium |
| 3 | Smart label placement + leader lines (Issue 1) | Medium — replaces label positioning pipeline | Medium-Large |

Steps 1 and 2 are independent and could be done in parallel. Step 3 is the most involved but yields the biggest visual improvement.

---

## Acceptance Criteria
- [ ] At tight offset (6px), no two ticker pills visually overlap — they may touch edge-to-edge
- [ ] Surround labels never overlap each other or ticker pills
- [ ] Labels inside spacious surrounds render without leader lines; cramped labels pull to the side with 45° leaders
- [ ] THREADS slider at "off" visibly loosens the layout; at "full" tightens clusters and shows bold threads
- [ ] All changes work at every OFFSET preset (tight/normal/loose) and every THREADS preset (off/soft/full)
