"""One-time manual script: add the unified knowledge-score columns to `users`
and backfill them from the legacy per-format `user_elo` table.

The knowledge score (profile "Knowledge score") and the Train Elo are now a single
number stored on `users.knowledge_rating`, replacing the per-format `user_elo`
table. create_all only adds missing TABLES, never missing COLUMNS (see the note in
app/models.py), so the live Supabase database needs these columns added by hand.
Run manually from backend/ -- never imported or called by the app:

    venv\\Scripts\\python.exe scripts\\add_knowledge_columns.py

Idempotent: ADD COLUMN IF NOT EXISTS, and the backfill only fills rows still NULL,
so it is safe to re-run. The legacy `user_elo` table is left in place (unused);
drop it manually later once the migration is confirmed.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from sqlalchemy import create_engine, inspect, text  # noqa: E402

ADD_COLUMNS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS knowledge_rating DOUBLE PRECISION",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS knowledge_answered_count INTEGER NOT NULL DEFAULT 0",
]

# Backfill from the legacy table: rating = average of per-format ratings,
# answered_count = sum of per-format answered counts. Only touches users whose
# knowledge_rating is still NULL so re-runs do not clobber live scores.
BACKFILL = """
UPDATE users u
SET knowledge_rating = agg.avg_rating,
    knowledge_answered_count = agg.total_answered
FROM (
    SELECT user_id,
           AVG(rating) AS avg_rating,
           SUM(answered_count) AS total_answered
    FROM user_elo
    GROUP BY user_id
) AS agg
WHERE u.id = agg.user_id
  AND u.knowledge_rating IS NULL
"""


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set (expected in backend/.env)")
    engine = create_engine(url)
    with engine.begin() as conn:
        for stmt in ADD_COLUMNS:
            print(stmt)
            conn.execute(text(stmt))
        # Backfill only if the legacy table still exists.
        if inspect(conn).has_table("user_elo"):
            print("backfilling users.knowledge_rating from user_elo")
            result = conn.execute(text(BACKFILL))
            print(f"  rows updated: {result.rowcount}")
        else:
            print("no user_elo table found; skipping backfill")
    print("done")


if __name__ == "__main__":
    main()
