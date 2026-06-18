"""One-time manual script: add the `slug` column to the `posts` table.

`slug` is the stable per-post identity for seed/official content (the JSON
filename stem). It is NULL for user-created posts and unique so seed.py can key
its upsert on it -- re-running the seed updates each post in place instead of
creating duplicates. create_all only adds missing TABLES, never missing COLUMNS
(see the note in app/models.py), so the live Supabase database needs this column
added by hand. Run manually from backend/ -- never imported or called by the app:

    .venv\\Scripts\\python.exe scripts\\add_slug_column.py

Idempotent: ADD COLUMN IF NOT EXISTS + CREATE UNIQUE INDEX IF NOT EXISTS, so it
is safe to re-run. Postgres allows multiple NULLs under a UNIQUE index, so the
existing user-content rows (slug NULL) are unaffected.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from sqlalchemy import create_engine, text  # noqa: E402

STATEMENTS = [
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug VARCHAR",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_posts_slug ON posts (slug)",
]


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set (expected in backend/.env)")
    engine = create_engine(url)
    with engine.begin() as conn:
        for stmt in STATEMENTS:
            print(stmt)
            conn.execute(text(stmt))
    print("done")


if __name__ == "__main__":
    main()
