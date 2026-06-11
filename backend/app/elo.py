"""Elo-style knowledge score.

Each user has one rating per format (starting at 1000). Every quiz question
acts as an opponent whose rating is derived from the post's difficulty:
post_difficulty 1 -> 800, 2 -> 1000, 3 -> 1200.

Standard Elo update: R' = R + K * (S - E) where S is 1 (correct) or 0 (wrong)
and E = 1 / (1 + 10^((Q - R) / 400)) is the expected score against a question
rated Q. Wrong answers therefore always cost points, so guessing has a cost.

K is 32 for a user's first 30 answers in a format (ratings converge quickly
while provisional) and 16 afterwards (stable scores move slowly). Ratings are
floored at 100 so a losing streak can never produce absurd negative numbers.

The global score is the average of the user's per-format ratings, over the
formats where the user has answered at least one question.
"""

from sqlalchemy.orm import Session

from .models import UserElo

START_RATING = 1000.0
FLOOR_RATING = 100.0
K_PROVISIONAL = 32.0
K_STABLE = 16.0
PROVISIONAL_ANSWERS = 30

DIFFICULTY_RATING = {1: 800.0, 2: 1000.0, 3: 1200.0}


def question_rating(post_difficulty) -> float:
    return DIFFICULTY_RATING.get(post_difficulty, DIFFICULTY_RATING[2])


def expected_score(user_rating: float, q_rating: float) -> float:
    return 1.0 / (1.0 + 10.0 ** ((q_rating - user_rating) / 400.0))


def get_or_create_elo(db: Session, user_id: int, fmt: str) -> UserElo:
    row = db.query(UserElo).filter(
        UserElo.user_id == user_id, UserElo.format == fmt
    ).first()
    if row is None:
        row = UserElo(user_id=user_id, format=fmt, rating=START_RATING, answered_count=0)
        db.add(row)
        db.flush()
    return row


def apply_answer(db: Session, user_id: int, fmt: str, post_difficulty, correct: bool) -> tuple[UserElo, float]:
    """Update the user's per-format rating for one first-time answer.

    Returns the UserElo row and the rating delta. Caller commits.
    """
    row = get_or_create_elo(db, user_id, fmt)
    k = K_PROVISIONAL if row.answered_count < PROVISIONAL_ANSWERS else K_STABLE
    expected = expected_score(row.rating, question_rating(post_difficulty))
    actual = 1.0 if correct else 0.0
    delta = k * (actual - expected)
    row.rating = max(FLOOR_RATING, row.rating + delta)
    row.answered_count += 1
    return row, delta


def elo_summary(db: Session, user_id: int) -> tuple[int | None, dict[str, dict]]:
    """Global rating and per-format ratings from a single query.

    Global is the average of per-format ratings, None until the user has
    answered a quiz. Every caller needs both values, so fetching them
    together saves a round trip to the remote DB.
    """
    rows = db.query(UserElo).filter(UserElo.user_id == user_id).all()
    formats = {
        r.format: {"rating": round(r.rating), "answered_count": r.answered_count}
        for r in rows
    }
    global_rating = round(sum(r.rating for r in rows) / len(rows)) if rows else None
    return global_rating, formats
