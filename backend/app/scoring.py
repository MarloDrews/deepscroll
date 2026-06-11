import random
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from .models import Event, Post

# Scoring formula (plain English):
# Each post starts with a base score of 1.0.
# Posts whose interest tags overlap with the user's selected interests gain +2.0 per matching tag.
# Posts in formats the user has engaged with over the last 30 days gain a bonus of 0 to +3.0,
#   calculated as (avg view duration in ms + like count for that format), normalised so the
#   most-engaged format receives 3.0 and all others scale proportionally.
# Posts that have been viewed before lose 1.0 per recorded view event (last 30 days), with a
#   floor of 0 so the score never goes negative.
# The final score is multiplied by random.uniform(0.85, 1.15) to keep the feed from being
#   perfectly deterministic on every load.


def score_posts(
    posts: List[Post],
    interest_slugs: List[str],
    db: Session,
    tier_map: Optional[dict] = None,
) -> List[Post]:
    # tier_map: post_id -> tier (1 = direct match, 2 = related, 3 = fallback)
    # Tier 1 gets full interest bonus, Tier 2 gets half, Tier 3 gets none.
    # TODO: once user authentication exists, pass user_id here and filter
    # events to that user so bonuses reflect individual rather than global engagement.

    cutoff = datetime.utcnow() - timedelta(days=30)
    # One joined tuple query instead of loading full Event ORM objects and
    # then re-querying posts for their formats (the join also covers events
    # on posts filtered out by ?format= or ?interests=, like the old
    # two-query version did).
    recent_rows = (
        db.query(Event.post_id, Event.event_type, Event.duration_ms, Post.format)
        .join(Post, Post.id == Event.post_id)
        .filter(Event.created_at >= cutoff)
        .all()
    )

    # Accumulate per-format engagement stats and per-post view counts.
    format_view_durations: dict[str, list[int]] = {}
    format_like_counts: dict[str, int] = {}
    post_view_counts: dict[int, int] = {}

    for post_id, event_type, duration_ms, fmt in recent_rows:
        if event_type == "view":
            if duration_ms is not None:
                format_view_durations.setdefault(fmt, []).append(duration_ms)
            post_view_counts[post_id] = post_view_counts.get(post_id, 0) + 1
        elif event_type == "like":
            format_like_counts[fmt] = format_like_counts.get(fmt, 0) + 1

    # Raw engagement score per format: avg view duration (ms) + like count.
    # Units differ but normalisation below makes the scale irrelevant.
    all_formats = set(format_view_durations) | set(format_like_counts)
    format_raw: dict[str, float] = {}
    for fmt in all_formats:
        durations = format_view_durations.get(fmt, [])
        avg_dur = sum(durations) / len(durations) if durations else 0.0
        format_raw[fmt] = avg_dur + format_like_counts.get(fmt, 0)

    max_raw = max(format_raw.values(), default=0.0)
    format_bonus: dict[str, float] = {
        fmt: (raw / max_raw) * 3.0 if max_raw > 0 else 0.0
        for fmt, raw in format_raw.items()
    }

    interest_set = set(interest_slugs)

    def compute_score(post: Post) -> float:
        score = 1.0

        # Interest match: post.interests is already eager-loaded by the caller.
        # Multiply bonus by 1.0 (Tier 1), 0.5 (Tier 2), or 0.0 (Tier 3).
        tier = tier_map.get(post.id, 1) if tier_map else 1
        interest_multiplier = {1: 1.0, 2: 0.5, 3: 0.0}.get(tier, 1.0)
        for interest in post.interests:
            if interest.slug in interest_set:
                score += 2.0 * interest_multiplier

        # Format engagement bonus.
        score += format_bonus.get(post.format, 0.0)

        # Repeat penalty.
        score -= post_view_counts.get(post.id, 0) * 1.0
        score = max(score, 0.0)

        # Small random jitter keeps the feed fresh across loads.
        score *= random.uniform(0.85, 1.15)

        return score

    return sorted(posts, key=compute_score, reverse=True)
