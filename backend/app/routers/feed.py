from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Interest, Post
from ..schemas import PostOut
from ..scoring import score_posts

router = APIRouter()

FEED_MIN = 10  # minimum posts before fallback tiers kick in


@router.get("/feed", response_model=List[PostOut])
def get_feed(
    format: Optional[str] = None,
    interests: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Base query — format filter applies to all tiers.
    base = db.query(Post).options(selectinload(Post.interests), selectinload(Post.author))
    base = base.filter(Post.status == "published")
    if format:
        base = base.filter(Post.format == format)

    slugs: List[str] = [s.strip() for s in interests.split(",")] if interests else []

    if not slugs:
        # No interest filter — return everything scored by engagement only.
        return score_posts(base.all(), [], db)

    # Tier 1: posts directly tagged with the user's selected slugs.
    tier1 = (
        base.join(Post.interests)
            .filter(Interest.slug.in_(slugs))
            .distinct()
            .all()
    )
    tier1_ids = {p.id for p in tier1}
    tier_map = {p.id: 1 for p in tier1}

    # Tier 2: posts co-tagged with any interest that appears on a Tier 1 post.
    # The related slugs come from the eager-loaded interests on Tier 1 posts —
    # no extra DB query needed.
    tier2: List[Post] = []
    if len(tier1) < FEED_MIN:
        related_slugs = {
            i.slug
            for p in tier1
            for i in p.interests
            if i.slug not in slugs
        }
        if related_slugs:
            tier2 = (
                base.join(Post.interests)
                    .filter(Interest.slug.in_(related_slugs))
                    .filter(Post.id.notin_(tier1_ids))
                    .distinct()
                    .all()
            )
        tier_map.update({p.id: 2 for p in tier2})

    # Tier 3: any remaining posts regardless of interests.
    tier3: List[Post] = []
    if len(tier1) + len(tier2) < FEED_MIN:
        tier12_ids = tier1_ids | {p.id for p in tier2}
        tier3 = base.filter(Post.id.notin_(tier12_ids)).all()
        tier_map.update({p.id: 3 for p in tier3})

    return score_posts(tier1 + tier2 + tier3, slugs, db, tier_map)
