"""End-to-end smoke test against a throwaway database.

Run from anywhere:
    .venv\\Scripts\\python.exe tests\\smoke_test.py

The app's SQLite URL is relative to the working directory, so this script
chdirs into a temp directory BEFORE importing the app — the real
backend/deepscroll.db is never touched. Plain asserts, no pytest needed
(requires httpx for the TestClient).
"""

import os
import sys
import tempfile

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("JWT_SECRET", "smoke-test-secret")

_tmp = tempfile.mkdtemp(prefix="deepscroll_smoke_")
os.chdir(_tmp)

from pathlib import Path  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Post  # noqa: E402
from app.routers import auth as auth_router  # noqa: E402

# Redirect avatar uploads into the temp dir so the real user_uploads/ stays clean.
_upload_dir = Path(_tmp) / "user_uploads"
(_upload_dir / "images").mkdir(parents=True)
auth_router.UPLOAD_DIR = _upload_dir

Base.metadata.create_all(bind=engine)
client = TestClient(app)

PASS = 0


def check(name: str, condition: bool, detail: str = ""):
    global PASS
    assert condition, f"FAIL: {name} {detail}"
    PASS += 1
    print(f"ok: {name}")


def register(email: str, username: str) -> dict:
    r = client.post("/api/auth/register", json={
        "email": email, "username": username, "password": "password123",
    })
    assert r.status_code == 201, r.text
    return r.json()


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def seed_quiz_post(author_id: int | None, difficulty: int = 2) -> int:
    """Insert a minimal published post with a quiz section directly in the DB."""
    db = SessionLocal()
    post = Post(
        format="books",
        title="Smoke Test Book",
        feed_card={"title": "Smoke Test Book", "post_difficulty": difficulty},
        sections=[{
            "type": "quiz",
            "order": 1,
            "content": [
                {"question": "Q1?", "options": ["a", "b", "c", "d"],
                 "answer_index": 1, "explanation": "Because b."},
                {"question": "Q2?", "options": ["a", "b", "c", "d"],
                 "answer_index": 2, "explanation": "Because c."},
            ],
        }],
        author_id=author_id,
        status="published",
        is_user_content=False,
    )
    db.add(post)
    db.commit()
    post_id = post.id
    db.close()
    return post_id


def main():
    alice = register("alice@example.com", "alice")
    bob = register("bob@example.com", "bob")
    a_h = auth(alice["access_token"])
    b_h = auth(bob["access_token"])

    post_id = seed_quiz_post(author_id=bob["user"]["id"])

    # --- Quiz answers must be stripped from delivered posts ---
    r = client.get(f"/api/posts/{post_id}")
    check("get post", r.status_code == 200, r.text)
    quiz = next(s for s in r.json()["sections"] if s["type"] == "quiz")
    check("answer_index stripped", all("answer_index" not in q for q in quiz["content"]))
    check("explanation stripped", all("explanation" not in q for q in quiz["content"]))
    check("question kept", all("question" in q and "options" in q for q in quiz["content"]))

    # --- Anonymous answer: correctness only, no Elo ---
    r = client.post("/api/quiz/answer", json={"post_id": post_id, "question_index": 0, "chosen_index": 1})
    check("anon answer", r.status_code == 200, r.text)
    d = r.json()
    check("anon correct", d["correct"] is True and d["correct_index"] == 1)
    check("anon no elo", d["elo"] is None and d["scored"] is False)

    # --- Authed correct answer raises Elo ---
    r = client.post("/api/quiz/answer", headers=a_h,
                    json={"post_id": post_id, "question_index": 0, "chosen_index": 1})
    d = r.json()
    check("authed correct scored", d["correct"] and d["scored"], str(d))
    check("elo delta positive", d["elo"]["delta"] > 0, str(d))
    check("elo rating above start", d["elo"]["rating"] > 1000, str(d))
    rating_after_q1 = d["elo"]["rating"]

    # --- Re-answering the same question never re-scores ---
    r = client.post("/api/quiz/answer", headers=a_h,
                    json={"post_id": post_id, "question_index": 0, "chosen_index": 3})
    d = r.json()
    check("replay flagged", d["already_answered"] is True)
    check("replay keeps stored result", d["correct"] is True)
    check("replay no delta", d["elo"]["delta"] == 0 and d["elo"]["rating"] == rating_after_q1)

    # --- Wrong answer lowers Elo ---
    r = client.post("/api/quiz/answer", headers=a_h,
                    json={"post_id": post_id, "question_index": 1, "chosen_index": 0})
    d = r.json()
    check("wrong answer not correct", d["correct"] is False and d["correct_index"] == 2)
    check("wrong answer explanation returned", d["explanation"] == "Because c.")
    check("elo delta negative", d["elo"]["delta"] < 0, str(d))
    check("rating dropped", d["elo"]["rating"] < rating_after_q1)

    # --- Own post never moves Elo ---
    r = client.post("/api/quiz/answer", headers=b_h,
                    json={"post_id": post_id, "question_index": 0, "chosen_index": 1})
    d = r.json()
    check("own post unscored", d["correct"] is True and d["scored"] is False)

    # --- Quiz state restores answered questions ---
    r = client.get(f"/api/quiz/state/{post_id}", headers=a_h)
    d = r.json()
    check("state has both answers", len(d["answers"]) == 2)
    q1 = next(a for a in d["answers"] if a["question_index"] == 1)
    check("state includes correction", q1["correct_index"] == 2 and q1["explanation"] == "Because c.")

    # --- Public Elo endpoint ---
    r = client.get("/api/users/alice/elo")
    d = r.json()
    check("public elo", r.status_code == 200 and d["global_rating"] is not None)
    check("per-format elo", d["formats"]["books"]["answered_count"] == 2)
    r = client.get("/api/users/bob/elo")
    check("unscored user has no global elo", r.json()["global_rating"] is None)

    # --- Bad inputs rejected ---
    r = client.post("/api/quiz/answer", json={"post_id": post_id, "question_index": 99, "chosen_index": 0})
    check("bad question index rejected", r.status_code == 400)
    r = client.post("/api/quiz/answer", json={"post_id": post_id, "question_index": 0, "chosen_index": 7})
    check("bad option index rejected", r.status_code == 400)
    r = client.post("/api/quiz/answer", json={"post_id": 99999, "question_index": 0, "chosen_index": 0})
    check("missing post rejected", r.status_code == 404)

    # --- Stats include Elo and quiz accuracy ---
    r = client.get("/api/stats/me", headers=a_h)
    d = r.json()
    check("stats my_elo", d["my_elo"]["global_rating"] is not None)
    check("stats my_quiz", d["my_quiz"]["answered"] == 2 and d["my_quiz"]["correct"] == 1)
    check("stats posts_liked is real", d["overview"]["posts_liked"] >= 0)

    # --- Avatar upload (hardened image pipeline) ---
    import io
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), (200, 40, 40)).save(buf, format="PNG")
    r = client.post("/api/auth/me/avatar", headers=a_h,
                    files={"file": ("me.png", buf.getvalue(), "image/png")})
    check("avatar upload", r.status_code == 200, r.text)
    avatar_url = r.json()["avatar_url"]
    check("avatar url shape", avatar_url is not None and avatar_url.startswith("/uploads/images/"))
    r = client.post("/api/auth/me/avatar", headers=a_h,
                    files={"file": ("evil.png", b"#!/bin/sh\necho pwned", "image/png")})
    check("non-image avatar rejected", r.status_code == 400, r.text)

    # --- Avatar appears on the public profile ---
    r = client.get("/api/users/alice/profile")
    check("profile has avatar", r.json()["avatar_url"] == avatar_url)

    # --- User search ---
    r = client.get("/api/search/users", params={"q": "ali"})
    d = r.json()
    check("anon user search", r.status_code == 200 and len(d) == 1 and d[0]["username"] == "alice")
    check("anon search no follow status", d[0]["follow_status"] is None)
    r = client.get("/api/search/users", params={"q": "b"}, headers=a_h)
    d = r.json()
    bob_row = next(u for u in d if u["username"] == "bob")
    check("authed search follow status", bob_row["follow_status"] == "none")
    r = client.post("/api/users/bob/follow", headers=a_h)
    check("follow bob", r.status_code == 200 and r.json()["status"] == "accepted")
    r = client.get("/api/search/users", params={"q": "bob"}, headers=a_h)
    check("search reflects follow", r.json()[0]["follow_status"] == "accepted")
    r = client.get("/api/search/users", params={"q": "alice"}, headers=a_h)
    check("search marks self", r.json()[0]["is_self"] is True)
    r = client.get("/api/search/users", params={"q": ""})
    check("empty query returns nothing", r.json() == [])

    print(f"\nAll {PASS} checks passed.")


if __name__ == "__main__":
    main()
