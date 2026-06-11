# Design Audit — Lamplight polish pass (June 2026)

Method: app run locally, every screen visited and screenshotted at 390x844
(Playwright, logged-in test user), findings checked against the code.
This file is the plan for the `fix/design-polish` branch; the fixes below
were implemented in the commits that follow it.

## Honest overall verdict

The Lamplight identity does come through: warm near-black surfaces, serif
titles, muted format inks, gold reserved for focus/active/links. The feed
cards and detail headers look designed, not generic. Newsreader is loading
and rendering (self-hosted via next/font, verified in computed styles).
The button system is in much better shape than expected — nearly every
button already uses `.btn` / `.chip`. What actually makes the app feel
unfinished is (1) reading density, (2) one invisible and a few
off-vocabulary controls, (3) flat surface separation, and (4) a slow
Stats page.

## Findings, prioritized

### P1 — Reading experience (the core product) — FIX
1. `.prose-post` (17px / 1.7 serif, the specified reading voice) is defined
   in globals.css but used **nowhere**. All long-form sections render
   `text-base leading-relaxed` (16px / 1.625). Whole screens of prose are
   one notch too small and too tight. → Replace prose paragraph styling in
   all section components with `.prose-post`.
2. Sections use a uniform `px-5 py-6` wrapper separated only by hairlines;
   long posts read as one continuous run. → `px-6 py-8` so each section
   breathes; aligns with the detail header's `px-6`.
3. Feed cards use `px-5 py-5 gap-3` internally — a compressed block, not a
   page. → `px-6 py-6 gap-4`.

### P2 — Buttons — FIX
4. Post detail comment send is `sr-only` (Enter-to-submit only). On a
   touch device there is **no visible way to send a comment**. → visible
   round `.btn-primary` send button, same as chat.
5. Quiz answer options are cramped tap targets (`px-3 py-2 text-sm`).
   → `px-4 py-3 text-[15px]` (still field-radius, token colors).
6. Search Posts|Accounts toggle uses ad-hoc `bg-surface-1/3` boxes.
   → `.chip chip-on/chip-off`.
7. Stats logged-out links use ad-hoc `bg-surface-2 rounded-full`.
   → `.btn btn-ghost`.
8. Most everything else (follow/unfollow, chat send, create CTAs, settings
   rows, Following-tab CTAs) already uses the vocabulary — verified, left
   alone. Settings list rows and icon-only buttons are kept as patterns
   (a list row is not a button pill; icon buttons are quiet ink by design).

### P3 — Depth (previous feedback: "flat") — FIX
9. surface-1 cards on surface-0 with a 0.14-alpha edge separate, but only
   barely; large screens read as one black sheet. → add a paper-edge
   shadow to `.card`: 1px warm inner highlight on top + 1–2px dark drop
   below, both at very low opacity. Matte, no glow. Documented as a
   conscious extension of the token system (see below).

### P4 — Style reassessment (honest answers to the brief)
10. Warm palette: genuinely warm on screen, not zinc. No change.
11. Paper grain (`body::before`, opacity 0.05): effectively invisible at
    phone width; it is not noise, it is just subtle. Visible in the
    gutters on desktop. Verdict: keep as is.
12. Format inks: lightness is well matched across the seven inks; nothing
    reads neon or dead. Books sharing the lamp gold is a sensible brand
    choice. No rebalance.
13. Lamp accent audit: appears in focus rings, links, active nav, save
    state, chart accents — and not decoratively. Correct. No change.
14. Tab strip clips the rightmost tab label under the search button with a
    hard cut instead of a fade. Minor; noted, not fixed in this pass
    (layout risk for cosmetic gain).

### P5 — Stats performance — FIX (measured)
15. Measured warm timings against the running backend:
    `/api/stats/global` ≈ 830 ms (3.1 s cold), `/api/stats/me` ≈ 900 ms —
    on a database with 7 posts. The cost is not data volume: the handlers
    issue ~31 (global) and ~28 (me) **sequential** queries, each a network
    round trip to the remote Supabase Postgres (~27 ms each).
    → Backend: consolidate round trips (single-select overview counts,
    one grouped query instead of the 7-query per-format loop, derive
    weekday/hour series from the heatmap query, one grouped status count).
    → Frontend: prefetch `/api/stats/me` in parallel with
    `/api/stats/global` on page mount, so the Personal tab does not start
    a second full wait when opened. Friends tab is already parallelized
    (Promise.all) — verified, left alone.

## Conscious extensions to the Lamplight token system

- `.card` gains a paper-edge shadow (inner 1px warm highlight + small dark
  drop). Rationale: surfaces previously separated by tone + hairline only,
  which read flat (P3/#9). The shadow is matte and directional like a
  sheet of paper on a desk — within the "matte, not glossy" rule.
- No token values changed; no new colors introduced.
