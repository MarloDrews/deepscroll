# Roadmap and deferred decisions

What is decided but not yet built, so it is not forgotten. This is a memory aid,
not a spec. The specs live in the standards docs.

---

## Field glyph system (deferred, decided)

**Decision.** The five typographic formats (facts, concepts, questions, stories,
academy) show a small glyph at the right end of the field line on the card and in
the detail header. The glyph belongs to the **field** (the subject, e.g. Biology,
Astronomy, True Crime), not to the individual post, and not to the broad theme
category. These cards are typographic, with a small field glyph as the only mark.

**Why a fixed field list.** A free-text field would mean an unbounded, ever-growing
set of glyphs and a glyph to draw for every new field, which forces per-post glyph
generation. The theme category (the ten taxonomy groups) is too coarse to be a
real anchor (Biology and Astronomy would share one mark). So the field becomes a
**fixed, curated list**, a few fields per theme category, each with one drawn
glyph. New fields are added deliberately, with a glyph, like the tag taxonomy.

**To build, in order.**
1. Define the fixed field list, derived from the ten theme categories (a handful
   of fields each). This is the first concrete step, before any drawing.
2. Draw one compact glyph per field (compact viewBox, one mark, accent color, per
   `SVG_STANDARD.md` section 6).
3. Decide where the field-to-glyph mapping lives (a lookup keyed by field, seeded
   like the taxonomy) and have the card and detail header read the glyph from it.
4. Constrain `feed_card.field` to the fixed list (validation), so a post cannot
   invent a field with no glyph.
5. Once the lookup exists, generators stop carrying a per-post `card_visual.svg`;
   the glyph is resolved from the field. Until then, an example carries one glyph
   inline so the layout can be seen.

**Interim state.** The Facts benchmark carries a single inline pulse glyph in
`card_visual.svg` to show the typographic card. This is scaffolding, replaced by
the lookup later.

---

## Other open work (already known)

- Build the remaining six formats the way Facts was built: skeleton, then a fully
  worked benchmark example, propagating every Facts-contract decision (typographic
  card, field glyph, graph fields, image roles, prose tells, font floor). Then the
  per-format bulk generation prompts.
- Quiz interaction: show one question at a time; answer, read the explanation,
  then advance (the next slides in); Elo at the end. Separate frontend run.
- Mobile app parity: the React Native app still uses the older card and header;
  bring it to the typographic card, field glyph, and redesigned detail header
  after the frontend look is settled.
- Read-only unused-field report for Facts, then prune docs and JSON to match.
- Key-figure person card text is too small (frontend CSS); enlarge and raise
  contrast.
- Assess the 145-tag taxonomy for the three flagged gaps (paleontology, botany,
  microbiology) and the optional one (creativity).
