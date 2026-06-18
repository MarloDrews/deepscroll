# Layout standard

Cross-format. How a post is composed on the feed card and at the top of the
detail page. This owns *composition and order of the chrome around the content*.
Its siblings: the skeletons and `SKELETON_COMMENT_STANDARD.md` own the sections
inside a post; `SVG_STANDARD.md` owns how a drawn visual looks; `IMAGE_STANDARD.md`
owns how a sourced image is licensed and shown; `STYLE_GUIDE_LONGFORM.md` owns
language. The app is dark only.

This is a frontend contract. Generators do not control layout; they fill the
fields, and the frontend composes them as described here. When a new format is
built, its card and detail page follow this document.

---

## 1. Two card looks, chosen by the format

The feed card has two looks. Which one a format uses is fixed, not per post.

- **Typographic formats** (facts, concepts, questions, stories, academy): the
  card is clean and typographic, an accent bar down the left, a field line (label
  plus a small glyph), the large serif headline, teasers, footer. The glyph is the
  only drawn mark.
- **Cover formats** (books, people): the card shows a real image, a hochkant book
  cover or a portrait, beside the headline. This is the current books and people
  layout and does not change.

Photos earn their place inside the post body (see `IMAGE_STANDARD.md`), not on the
typographic cards. The cards stay a coherent, typographic Plexive face; the body
is where real images give the eye a rest.

---

## 2. Feed card, top to bottom (typographic formats)

1. **Field line**: the field label small in the accent color ("BIOLOGY") at the
   left, and a **small glyph at the right end** of the same line. If the field is
   long it wraps to two lines and the glyph stays at the right. Accent bar runs
   down the left edge of the card.
2. **Headline**, full width, large serif, the key number emphasized. The star.
3. **Teasers**, exactly three.
4. **Footer**: creator (round avatar + name), reading time, difficulty (the
   three-dot scale).

The footer carries only creator, reading time, and difficulty. Per-format
metadata is deliberately not shown on the card; it varies between formats and
looks inconsistent across the feed.

The glyph belongs to the **field**, not the post, and is meant to come from a
fixed field-to-glyph set (see `ROADMAP.md`). Until that set exists, an example may
carry one glyph inline in `card_visual.svg`. Cover formats use the same parts with
the cover or portrait beside the headline instead of a glyph.

---

## 3. Detail page header, top to bottom

The detail header opens straight into the post; the headline appears exactly once.
Continuity from the tapped card comes from the shared field line, glyph, and accent
bar.

1. **App top bar**: back, the format label with its accent dot, audio. (App frame.)
2. **Field line**: field label (accent) with the small glyph at its right end,
   same as the card.
3. **Headline**, once, large serif, accent number. The first impression; it owns
   the top of the page.
4. **Meta row**: round avatar + creator name, then reading time, then difficulty.
   The creator here and on the card come from one source and always match.
5. **Quiz badge**.
6. **Sections**, in their defined order.
7. **Tags**, at the end, as small chips near the sources. Not in the header: the
   field label already orients the reader, and tags are the network and filter
   system, which belongs at the foot of the post.

Cover formats (books, people) may show their cover or portrait in the header; that
is settled when those formats get their own pass.

---

## 4. Creator identity

The creator shown on the feed card and on the detail page resolve from the same
source and always match. Never a hardcoded fallback such as the app name.

---

## 5. Scrolling

Hide scrollbars, vertical and any horizontal, for a clean surface. A horizontal
scrollbar almost always means real overflow, usually an element wider than its
container (an over-wide element such as a body SVG). Fix the overflow at its
source; do
not only mask the bar.

---

## 6. Headline alignment (open taste call)

Centered reads like a title page; left-aligned matches the card more seamlessly.
Both are acceptable. Decide at the rendered look, not in the abstract. This is the
one part of the header that is taste, not rule.
