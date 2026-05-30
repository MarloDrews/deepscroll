from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Interest, Post
from ..schemas import PostOut

router = APIRouter()


@router.get("/feed", response_model=List[PostOut])
def get_feed(
    format: Optional[str] = None,
    interests: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Post)

    if format:
        query = query.filter(Post.format == format)

    if interests:
        slugs = [s.strip() for s in interests.split(",")]
        query = query.join(Post.interests).filter(Interest.slug.in_(slugs)).distinct()

    return query.order_by(func.random()).all()
