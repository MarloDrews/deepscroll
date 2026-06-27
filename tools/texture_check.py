#!/usr/bin/env python3
"""
texture_check.py  -  mechanical layer of HUMAN_TEXTURE_STANDARD.md

Reads one post JSON and emits CANDIDATES, never verdicts. It never fails a post.
It surfaces the spots the model audit and the human spot-check should look at.

Usage:
    python3 texture_check.py path/to/books_example.json
    python3 texture_check.py path/to/post.json --format books
    python3 texture_check.py path/to/post.json --json

Scope note: Books and Facts are calibrated (HUMAN_TEXTURE_STANDARD v1.3). For an
uncalibrated format the script runs the universal checks with the Books band as a
placeholder and says so.

The numbers below come straight from the standard:
  - comma ceiling 3 per sentence, 4 only inside a genuine flat list, 5 is a rewrite
  - burstiness floor 2.0, target 3+, a short sentence (<=10w, up to ~15 if tight)
    present in every prose section of 3+ sentences; shortest >=25 is the drone
  - about 5-6 genuine inline 3+ lists per post, none adjacent
  - a prose section whose lengths mostly ascend and end on its longest sentence
    drifts upward even when the ratio passes the floor; raised as a candidate
"""

import argparse
import json
import re
import sys
from collections import Counter

# --------------------------------------------------------------------------
# calibration (per format). Only Books is real; the rest borrow it for now.
# --------------------------------------------------------------------------
BANDS = {
    "books": dict(
        burst_floor=2.0,      # ratio under this in a prose section is a flat drone
        short_word_max=10,    # a prose section of 3+ sentences should carry one this short
        short_word_tight=15,  # a tightly built section may run this as its shortest
        drone_shortest=25,    # shortest sentence this long means no real short sentence
        comma_candidate=4,    # 4 commas: candidate (genuine list, or stacking?)
        comma_rewrite=5,      # 5 commas: strong candidate, almost always a rewrite
        list_post_soft=6,     # about this many genuine inline 3+ lists per post
        parallel_monotone=0.75,  # share of one opening type that flags a parallel set
        drift_up_frac=0.75,   # share of ascending length-steps that, with an end on
                              # the longest sentence, flags a climb the ratio misses
    ),
    # Facts is calibrated (locked gold). The checker's thresholds are the universal
    # section-2 floors, identical across formats, so this mirrors the Books values
    # by design. What is genuinely Facts-specific is descriptive and lives in the
    # standard's section-3 band row (a shorter length center, ~14 vs ~18 words, and
    # a lower ceiling, ~31 vs ~37), which the audit reads, not a hard checker number.
    "facts": dict(
        burst_floor=2.0,
        short_word_max=10,
        short_word_tight=15,
        drone_shortest=25,
        comma_candidate=4,
        comma_rewrite=5,
        list_post_soft=5,
        parallel_monotone=0.75,
        drift_up_frac=0.75,
    ),
}
UNCALIBRATED_NOTE = "format not calibrated yet; using Books band as a placeholder"

# all seven format names, for filename detection. Distinct from BANDS, which holds
# only the calibrated bands (Books today); an extractor may exist before a band.
KNOWN_FORMATS = ["books", "facts", "people", "concepts", "questions", "stories",
                 "academy"]

# dated blacklist, mirrors HUMAN_TEXTURE_STANDARD v1.0 section 2.7 (2026 Q2)
BLACKLIST = [
    "emphasizing", "highlighting", "showcasing", "showcase", "enhance",
    "align with", "foster", "fostering", "seamless", "comprehensive",
    "elevate", "maximize", "delve", "tapestry", "testament", "realm",
    "underscore", "underscores", "navigate the", "leverage",
]
SYMBOLISM = [
    "represents", "embodies", "reflects", "underscores", "signifies",
    "symbolizes", "stands as", "stands for", "serves as a reminder",
]
CLOSURE = [
    r",\s+which is why\b", r",\s+which is what\b", r",\s+since\b",
    r",\s+because\b", r"\bwhich is why\b",
]

# --------------------------------------------------------------------------
# text utilities
# --------------------------------------------------------------------------
def split_sentences(text):
    """Approximate sentence split. Protects decimals; treats a closing quote as
    part of the sentence. Good enough for candidate generation, not perfect."""
    t = re.sub(r"(\d)\.(\d)", r"\1<DOT>\2", text)
    # mark a boundary after . ? ! (plus an optional closing quote) when followed by
    # whitespace and a capital letter or an opening quote, then split on the marker.
    # keeps the closing quote with its own sentence and avoids variable-width
    # lookbehind (which Python's re rejects).
    t = re.sub(r"([.?!]['\"\u2019\u201d]?)\s+(?=[A-Z'\"\u2018\u201c])", r"\1<SPLIT>",
               t.strip())
    parts = t.split("<SPLIT>")
    out = []
    for p in parts:
        p = p.replace("<DOT>", ".").strip()
        if p:
            out.append(p)
    return out

def words(s):
    return len(s.split())

def clause_commas(s):
    """Count commas. (The audit decides which are genuine list commas vs stacked
    clause commas; the script only counts.)"""
    return s.count(",")

INLINE_LIST = re.compile(
    r"\b[\w'\-]+(?:\s[\w'\-]+){0,3},\s[\w'\-]+(?:\s[\w'\-]+){0,3},\s(?:and|or)\s[\w'\-]+"
)

def opening_type(s):
    """Coarse opening-shape bucket. Not a parser: it groups by the first word, so
    a genuine imperative and an unrecognised opener both land in 'other'. Good
    enough to spot a monotone set, not a grammar claim."""
    s = s.strip()
    if s.endswith("?"):
        return "question"
    toks = s.split()
    if not toks:
        return "other"
    first = re.sub(r"[^\w']", "", toks[0]).lower()
    if first in {"when", "if", "before", "faced", "once", "after", "while",
                 "given", "as", "unless"}:
        return "conditional"
    if first in {"the", "a", "an", "this", "that", "these", "those", "it",
                 "what", "how", "each", "both", "most", "every", "there",
                 "in", "across", "for", "by", "with", "from", "at", "on",
                 "then", "here", "now", "they", "we", "you", "his", "her",
                 "their", "its", "one", "two", "three", "part"}:
        return "declarative"
    return "other"

# --------------------------------------------------------------------------
# Books extractor: pull the exact reader-facing fields
# --------------------------------------------------------------------------
def extract_books(data):
    by = {s["type"]: s for s in data.get("sections", [])}
    prose = []          # (label, text) -> full burstiness/comma/closure checks
    parallel = {}       # label -> [items]  -> shape-variety check
    light = []          # (label, text) -> blacklist/symbolism only (short fields)
    exempt = []         # quote texts, never checked

    def add_prose(label, sec, key="content"):
        if sec and isinstance(sec.get(key), str) and sec[key].strip():
            prose.append((label, sec[key]))

    add_prose("why_read_it", by.get("why_read_it"))
    add_prose("heart", by.get("heart"))
    add_prose("influence", by.get("influence"))
    add_prose("world_context", by.get("world_context"))
    add_prose("critique", by.get("critique"))

    if "takeaway" in by:
        b = by["takeaway"].get("content", {}).get("body", "")
        if b.strip():
            prose.append(("takeaway.body", b))
    if "author_context" in by:
        b = by["author_context"].get("content", {}).get("body", "")
        if b.strip():
            prose.append(("author_context.body", b))

    if "structure" in by and isinstance(by["structure"].get("content"), list):
        parallel["structure items"] = [x for x in by["structure"]["content"] if x.strip()]

    if "core_ideas" in by:
        titles, ips = [], []
        for i, it in enumerate(by["core_ideas"].get("content", [])):
            if it.get("body", "").strip():
                prose.append((f"core_ideas[{i}].body", it["body"]))
            if it.get("title", "").strip():
                titles.append(it["title"])
            if isinstance(it.get("in_practice"), str) and it["in_practice"].strip():
                ips.append(it["in_practice"])
            if isinstance(it.get("quote"), str) and it["quote"].strip():
                exempt.append(it["quote"])
        if titles:
            parallel["core_ideas titles"] = titles
        if ips:
            parallel["core_ideas in_practice"] = ips

    if "voices" in by:
        for q in by["voices"].get("content", []):
            if q.get("quote", "").strip():
                exempt.append(q["quote"])

    if "quiz" in by:
        for q in by["quiz"].get("content", []):
            if q.get("explanation", "").strip():
                light.append(("quiz.explanation", q["explanation"]))

    fc = data.get("feed_card", {})
    if fc.get("one_line", "").strip():
        light.append(("feed_card.one_line", fc["one_line"]))
    for t in fc.get("teasers", []):
        if t.strip():
            light.append(("feed_card.teaser", t))

    return prose, parallel, light, exempt

def extract_facts(data):
    """Facts extractor: pull the exact reader-facing fields for the Facts schema.
    Facts is calibrated (locked gold): the checker thresholds are the universal
    section-2 floors, and the Facts-specific calibration (shorter length center,
    lower ceiling) is descriptive in standard section 3. Closes the gap where
    Facts ran on the generic Books-band walk."""
    by = {s["type"]: s for s in data.get("sections", [])}
    prose, parallel, light, exempt = [], {}, [], []

    def add_prose(label, sec, key="content"):
        if sec and isinstance(sec.get(key), str) and sec[key].strip():
            prose.append((label, sec[key]))

    # multi-sentence prose sections (surprises is the Facts key section, the reframe)
    add_prose("surprises", by.get("surprises"))
    add_prose("how_we_know", by.get("how_we_know"))
    add_prose("bigger_picture", by.get("bigger_picture"))

    if "story" in by:
        b = by["story"].get("content", {}).get("body", "")
        if b.strip():
            prose.append(("story.body", b))

    if "open_questions" in by:
        oq = by["open_questions"].get("content", {})
        if isinstance(oq, dict):
            if oq.get("body", "").strip():
                prose.append(("open_questions.body", oq["body"]))
            items = [x for x in oq.get("items", []) if isinstance(x, str) and x.strip()]
            if items:
                parallel["open_questions items"] = items
                light.extend(("open_questions.item", x) for x in items)

    if "angles" in by and isinstance(by["angles"].get("content"), list):
        titles = []
        for i, a in enumerate(by["angles"]["content"]):
            if isinstance(a, dict):
                if a.get("body", "").strip():
                    prose.append((f"angles[{i}].body", a["body"]))
                if a.get("title", "").strip():
                    titles.append(a["title"])
        if titles:
            parallel["angles titles"] = titles

    if "tangible" in by and isinstance(by["tangible"].get("content"), dict):
        items = [x for x in by["tangible"]["content"].get("items", [])
                 if isinstance(x, str) and x.strip()]
        if items:
            parallel["tangible items"] = items
            light.extend(("tangible.item", x) for x in items)

    if "misconceptions" in by and isinstance(by["misconceptions"].get("content"), list):
        myths, realities = [], []
        for m in by["misconceptions"]["content"]:
            if isinstance(m, dict):
                if m.get("myth", "").strip():
                    myths.append(m["myth"])
                    light.append(("misconceptions.myth", m["myth"]))
                if m.get("reality", "").strip():
                    realities.append(m["reality"])
                    light.append(("misconceptions.reality", m["reality"]))
        if myths:
            parallel["misconceptions myth"] = myths
        if realities:
            parallel["misconceptions reality"] = realities

    if "quiz" in by:
        for q in by["quiz"].get("content", []):
            if isinstance(q, dict):
                if q.get("explanation", "").strip():
                    light.append(("quiz.explanation", q["explanation"]))
                if q.get("question", "").strip():
                    light.append(("quiz.question", q["question"]))

    if "headline" in by and isinstance(by["headline"].get("content"), str):
        light.append(("headline", by["headline"]["content"]))
    fc = data.get("feed_card", {})
    for t in fc.get("teasers", []):
        if isinstance(t, str) and t.strip():
            light.append(("feed_card.teaser", t))

    return prose, parallel, light, exempt

def extract_generic(data):
    """Fallback for uncalibrated formats: walk for body/content strings, exempt
    quotes. Coarser than the Books extractor."""
    prose, exempt = [], []

    def walk(node, key=None):
        if isinstance(node, str):
            if key == "quote":
                exempt.append(node)
            elif key in {"body", "content"} and len(node.split()) >= 8:
                prose.append((key, node))
        elif isinstance(node, dict):
            for k, v in node.items():
                walk(v, k)
        elif isinstance(node, list):
            for v in node:
                walk(v, key)

    walk(data)
    return prose, {}, [], exempt

# --------------------------------------------------------------------------
# checks
# --------------------------------------------------------------------------
def check_prose(label, text, band, cand):
    ss = split_sentences(text)
    lens = [words(s) for s in ss]
    rec = {"section": label, "sentences": len(ss),
           "min": min(lens) if lens else 0, "max": max(lens) if lens else 0}
    rec["ratio"] = round(rec["max"] / rec["min"], 1) if rec["min"] else 0.0

    if len(ss) >= 3:
        if rec["ratio"] < band["burst_floor"]:
            cand.append(("burstiness", label,
                         f"flat: ratio {rec['ratio']} (floor {band['burst_floor']}), "
                         f"lengths {sorted(lens)}"))
        if rec["min"] >= band["drone_shortest"]:
            cand.append(("burstiness", label,
                         f"no short sentence: shortest is {rec['min']} words"))
        elif rec["min"] > band["short_word_tight"]:
            cand.append(("burstiness", label,
                         f"weak short sentence: shortest is {rec['min']} words "
                         f"(aim for one <= {band['short_word_max']})"))

    for s in ss:
        c = clause_commas(s)
        if c >= band["comma_rewrite"]:
            cand.append(("comma density", label,
                         f"{c} commas (>= {band['comma_rewrite']}, usually a rewrite): {s}"))
        elif c >= band["comma_candidate"]:
            cand.append(("comma density", label,
                         f"{c} commas (genuine list or stacked clauses?): {s}"))

    for pat in CLOSURE:
        for m in re.finditer(pat, text):
            frag = text[max(0, m.start() - 20):m.end() + 25]
            cand.append(("over-closure", label, f"...{frag.strip()}..."))

    low = text.lower()
    for w in SYMBOLISM:
        if w in low:
            cand.append(("symbolism register", label, f'"{w}"'))

    return rec, ss

def check_blacklist(all_texts, cand):
    hits = Counter()
    where = {}
    for label, text in all_texts:
        low = text.lower()
        for w in BLACKLIST:
            n = low.count(w)
            if n:
                hits[w] += n
                where.setdefault(w, []).append(label)
    total = sum(hits.values())
    if total:
        detail = ", ".join(f'"{w}" x{c}' for w, c in hits.most_common())
        sev = "cluster" if total >= 2 else "single hit"
        cand.append(("blacklist (2026 Q2)", "post", f"{sev}: {detail}"))
    return total

def check_inline_lists(prose_sentences, cand):
    total = 0
    flat = []  # (label, sentence_index, sentence)
    for label, ss in prose_sentences:
        for i, s in enumerate(ss):
            if INLINE_LIST.search(s):
                total += 1
                flat.append((label, i, s))
    # adjacency: two list-bearing sentences in a row inside the same section
    for label, ss in prose_sentences:
        idxs = [i for (lab, i, s) in flat if lab == label]
        for a, b in zip(idxs, idxs[1:]):
            if b == a + 1:
                cand.append(("inline lists", label, "two inline 3+ lists in adjacent sentences"))
    # the raw post total is reported descriptively in POST TOTALS, not as a
    # candidate: the regex also catches appositive pairs, so the count is noisy.
    # only the adjacency signal (two list-bearing sentences in a row) is raised.
    return total

def check_parallel(parallel, band, cand):
    out = {}
    for label, items in parallel.items():
        types = [opening_type(it) for it in items]
        firsts = [re.sub(r"[^\w']", "", it.split()[0]).lower() for it in items if it.split()]
        tc = Counter(types)
        out[label] = dict(types=dict(tc), first_words=firsts)
        n = len(items)
        if n >= 3:
            # opening-TYPE monotony is only a real tell where the sentence shape
            # itself is the contract (in_practice). For titles and structure items
            # the opener word is a weak proxy and over-flags, so skip it there.
            if "in_practice" in label:
                top_type, top_n = tc.most_common(1)[0]
                if top_n / n >= band["parallel_monotone"]:
                    cand.append(("parallel-field sameness", label,
                                 f"{top_n}/{n} items share one opening shape; vary it"))
            # repeated opening WORD is a tell in any set
            fc = Counter(firsts)
            w, wn = fc.most_common(1)[0]
            if wn >= 3:
                cand.append(("parallel-field sameness", label,
                             f"'{w}' opens {wn} items; vary the opening word"))
            # internal-shape proxy: many items carrying an embedded 3+ list often
            # share the "opener, embedded list, and a closing clause" template.
            # Weak proxy; the deeper shared-shape tell is audit-led.
            with_list = sum(1 for it in items if INLINE_LIST.search(it))
            if with_list / n >= 0.5:
                cand.append(("parallel-field sameness", label,
                             f"{with_list}/{n} items carry an embedded 3+ list; "
                             f"check for a shared internal shape (audit-led)"))
    return out
    return out

def check_drift(prose_sentences, band, cand):
    """Catch a section the ratio passes but that still drones upward: lengths that
    mostly ascend and end on the section's longest sentence. The min-to-max ratio
    can clear the floor on such a section (a single short opener is enough), so
    this looks at the trajectory, not the spread. Conservative on purpose: it fires
    only when both signals agree, so a section that merely ends on a near-ceiling
    sentence but swings on the way (an earned long close) is left alone. Candidate,
    not a verdict."""
    for label, ss in prose_sentences:
        lens = [words(s) for s in ss]
        if len(lens) < 5:
            continue
        mn, mx = min(lens), max(lens)
        ratio = mx / mn if mn else 0.0
        if ratio < band["burst_floor"]:
            continue  # already raised by the flat-drone burstiness check
        trans = [b - a for a, b in zip(lens, lens[1:])]
        up_frac = sum(1 for t in trans if t > 0) / len(trans) if trans else 0.0
        down_steps = sum(1 for t in trans if t < 0)
        # Two ways a section climbs to its longest sentence as the close:
        #  - mostly ascending steps (the original signal), or
        #  - monotone non-decreasing, where plateaus/ties carry it to the max
        #    without a single drop. The second hid angles[2] (5,5,9,10,19,19):
        #    the ties pulled the strict-ascend fraction under the threshold even
        #    though nothing ever descends and it ends at the max.
        mostly_ascends = up_frac >= band["drift_up_frac"]
        monotone_climb = down_steps == 0
        if lens[-1] == mx and (mostly_ascends or monotone_climb):
            shape = (f"{up_frac:.0%} of steps ascend" if mostly_ascends
                     else "rises with no drop, a plateau into the longest that the "
                          "ascend fraction alone misses")
            cand.append(("rhythm drift", label,
                         f"climbs to its longest sentence ({shape}, ends on the "
                         f"{lens[-1]}-word max); the ratio passes but the shape drifts "
                         f"up. Swing, do not end on the longest sentence. lengths {lens}"))

def check_repeated_openings(prose_sentences, cand):
    for label, ss in prose_sentences:
        firsts = [re.sub(r"[^\w']", "", s.split()[0]).lower() for s in ss if s.split()]
        fc = Counter(firsts)
        for w, n in fc.items():
            if n >= 3 and w not in {"the", "it", "a", "an"}:
                cand.append(("repeated opening", label, f"'{w}' opens {n} sentences"))

# --------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------
def run(path, fmt=None):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if fmt is None:
        stem = path.split("/")[-1].lower()
        fmt = next((k for k in KNOWN_FORMATS if k in stem), None) or "books"
    calibrated = fmt in BANDS
    band = BANDS.get(fmt, BANDS["books"])

    if fmt == "books":
        prose, parallel, light, exempt = extract_books(data)
    elif fmt == "facts":
        prose, parallel, light, exempt = extract_facts(data)
    else:
        prose, parallel, light, exempt = extract_generic(data)

    cand = []
    recs, prose_sentences = [], []
    for label, text in prose:
        rec, ss = check_prose(label, text, band, cand)
        recs.append(rec)
        prose_sentences.append((label, ss))

    list_total = check_inline_lists(prose_sentences, cand)
    par = check_parallel(parallel, band, cand)
    check_drift(prose_sentences, band, cand)
    check_repeated_openings(prose_sentences, cand)
    bl_total = check_blacklist(prose + light, cand)
    # symbolism on light fields too
    for label, text in light:
        low = text.lower()
        for w in SYMBOLISM:
            if w in low:
                cand.append(("symbolism register", label, f'"{w}"'))

    return dict(format=fmt, calibrated=calibrated, band=band, recs=recs,
                parallel=par, inline_lists=list_total, blacklist=bl_total,
                exempt_quotes=len(exempt), candidates=cand)

def print_report(r):
    print("=" * 72)
    print(f"texture check  -  format: {r['format']}"
          + ("" if r["calibrated"] else f"  ({UNCALIBRATED_NOTE})"))
    print("=" * 72)

    print("\nPER-SECTION RHYTHM (stats are descriptive, not pass/fail)")
    print(f"  {'section':28} {'sents':>5} {'min':>4} {'max':>4} {'ratio':>6}")
    for rec in r["recs"]:
        print(f"  {rec['section']:28} {rec['sentences']:>5} {rec['min']:>4} "
              f"{rec['max']:>4} {rec['ratio']:>6}")

    if r["parallel"]:
        print("\nPARALLEL-FIELD SETS (opening-shape mix)")
        for label, info in r["parallel"].items():
            print(f"  {label}: {info['types']}")

    print(f"\nPOST TOTALS")
    print(f"  inline 3+ list matches : {r['inline_lists']}  (soft target ~6)")
    print(f"  blacklist hits         : {r['blacklist']}")
    print(f"  exempt quotes (skipped): {r['exempt_quotes']}")

    cand = r["candidates"]
    print(f"\nCANDIDATES  ({len(cand)})  -  spots to look at, NOT failures")
    if not cand:
        print("  none flagged")
    else:
        by_kind = {}
        for kind, label, msg in cand:
            by_kind.setdefault(kind, []).append((label, msg))
        for kind in sorted(by_kind):
            print(f"\n  [{kind}]")
            for label, msg in by_kind[kind]:
                print(f"    {label}: {msg}")

    print("\n" + "-" * 72)
    print("Candidates are for the audit and the human read, never an automatic")
    print("fail. Verbatim quotes are out of scope by design.")

def main():
    ap = argparse.ArgumentParser(description="Mechanical texture checker (candidates, not verdicts).")
    ap.add_argument("path")
    ap.add_argument("--format", default=None, help="books|facts|people|concepts|questions|stories|academy")
    ap.add_argument("--json", action="store_true", help="emit raw JSON instead of a report")
    a = ap.parse_args()
    r = run(a.path, a.format)
    if a.json:
        print(json.dumps(r, indent=2, ensure_ascii=False))
    else:
        print_report(r)
    # exit 0 always: this tool never fails a post
    sys.exit(0)

if __name__ == "__main__":
    main()
