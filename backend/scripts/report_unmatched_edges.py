"""Read-only report: latent edges whose target identity matches no post.

A latent edge (post_edges.target_post_id NULL) is ambiguous: either the target
post genuinely does not exist yet (a real future post), or the connection ref's
key drifted (transliteration / alternate name / typo) so it no longer matches the
post it meant. The two look identical in the table. This lists every latent edge
whose (target_format, target_identity_key) matches NO post at all -- of any status
-- grouped by that pair with a count, sorted by count descending, and for each
shows the source post's title and the raw ref that produced the key so a typo is
obvious at a glance. The "should this have matched?" list.

It auto-resolves nothing and mutates nothing: a human reads it and fixes keys or
adds a discriminator (later, an alias -- see app/graph_identity.py). Run manually
from backend/, never imported or called by the app:

    .venv\\Scripts\\python.exe scripts\\report_unmatched_edges.py

Read-only: no DDL, no INSERT/UPDATE/DELETE. Safe to run any time.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

# Reuse the exact read-path function -- never a second copy of the query.
from app.graph_edges import unmatched_latent_edges  # noqa: E402


def _ref_str(ref) -> str:
    """Render a raw authoring ref compactly for the report line."""
    if isinstance(ref, dict):
        parts = ", ".join(f"{k}: {v!r}" for k, v in ref.items() if v is not None)
        return "{" + parts + "}"
    return repr(ref)


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set (expected in backend/.env)")
    engine = create_engine(url)

    with Session(engine) as db:
        groups = unmatched_latent_edges(db)

    if not groups:
        print("no unmatched latent edges -- every latent edge points at a known identity")
        return

    total_edges = sum(len(sources) for _, _, sources in groups)
    print(
        f"{len(groups)} unmatched identity pair(s) across {total_edges} latent edge(s) "
        f"-- target identity matches no post (any status):\n"
    )
    for fmt, key, sources in groups:
        print(f"[{fmt}] {key!r} -> {len(sources)} latent edge(s)")
        for source_id, title, ref in sources:
            label = repr(title) if title else "?"
            print(f"    <- post #{source_id} {label} ref {_ref_str(ref)}")
        print()

    print("read-only: nothing was written. Fix keys / add discriminators by hand.")


if __name__ == "__main__":
    main()
