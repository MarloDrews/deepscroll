"""One-time manual script: add the graph identity substrate to the live DB.

Adds posts.identity_key (the normalized graph identity, see app/graph_identity.py)
plus its index, creates the post_edges table, and backfills identity_key for any
existing post that does not have one yet. create_all only adds missing TABLES,
never missing COLUMNS (see the note in app/models.py), so the live Supabase
database needs the column and index added by hand. Run manually from backend/ --
never imported or called by the app:

    .venv\\Scripts\\python.exe scripts\\add_identity_and_edges.py

Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS, the table is
created with checkfirst, and the backfill only touches rows where identity_key is
still NULL, so it is safe to re-run. It creates no edges -- edge derivation and
activation are a later block. Within-format identity collisions are printed at the
end for a human to resolve (by adding a discriminator); they are never merged.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

# Reuse the exact write-path function -- never a second copy of the normalization.
from app.graph_identity import find_identity_collisions, post_identity_key  # noqa: E402
from app.models import Post, PostEdge  # noqa: E402

DDL = [
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS identity_key VARCHAR",
    "CREATE INDEX IF NOT EXISTS ix_posts_identity_key ON posts (identity_key)",
]


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set (expected in backend/.env)")
    engine = create_engine(url)

    with engine.begin() as conn:
        for stmt in DDL:
            print(stmt)
            conn.execute(text(stmt))

    # Create post_edges (and its indexes) from the model definition, idempotently.
    print("create table post_edges if not exists")
    PostEdge.__table__.create(bind=engine, checkfirst=True)

    # Backfill identity_key only where it is still NULL.
    with Session(engine) as db:
        pending = db.query(Post).filter(Post.identity_key.is_(None)).all()
        updated = 0
        for post in pending:
            key = post_identity_key(post.format, post.feed_card)
            if key is not None:
                post.identity_key = key
                updated += 1
        db.commit()
        print(f"backfilled identity_key for {updated} of {len(pending)} rows without one")

        collisions = find_identity_collisions(db)
        if collisions:
            print(f"\nWARNING: {len(collisions)} within-format identity collision(s) -- resolve by hand:")
            for post_format, key, ids in collisions:
                print(f"  [{post_format}] {key!r} -> post ids {ids}")
        else:
            print("no within-format identity collisions")

    print("done")


if __name__ == "__main__":
    main()
