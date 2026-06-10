"""One-off helper: bring an existing backend/deepscroll.db up to the current schema.

create_all only adds missing tables, never missing columns, so a schema change
that adds a column to an existing table 500s the API until the column exists.
Run this instead of a full reset when you want to keep your data:
    .venv\\Scripts\\python.exe tests\\_db_inspect.py
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "deepscroll.db")

con = sqlite3.connect(DB_PATH)
cols = [r[1] for r in con.execute("PRAGMA table_info(users)")]
if "avatar_url" not in cols:
    con.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR")
    con.commit()
    print("added users.avatar_url")
else:
    print("users.avatar_url already present")
cols = [r[1] for r in con.execute("PRAGMA table_info(users)")]
print("users columns:", cols)
con.close()
