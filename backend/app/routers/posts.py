from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user, get_optional_user
from ..database import get_db
from ..models import Interest, Post
from ..rate_limit import check_rate_limit
from ..sanitize import sanitize_svg_text
from ..schemas import PostCreate, PostOut

router = APIRouter()


# IMPORTANT: /posts/mine must be registered before /posts/{post_id} so FastAPI
# does not treat the literal string "mine" as an integer post_id.
@router.get("/posts/mine", response_model=List[PostOut])
def get_my_posts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Post)
        .options(selectinload(Post.interests), selectinload(Post.author))
        .filter(Post.author_id == current_user.id)
        .order_by(Post.created_at.desc())
        .all()
    )


@router.post("/posts", response_model=PostOut, status_code=201)
def create_post(
    data: PostCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    check_rate_limit(current_user.id, "create_post", 20, 86400)

    # Validate every interest slug exists
    interest_objects = []
    for slug in data.interests:
        interest = db.query(Interest).filter(Interest.slug == slug).first()
        if interest is None:
            raise HTTPException(status_code=400, detail=f"Unknown interest slug: {slug!r}")
        interest_objects.append(interest)

    # Defense-in-depth: re-sanitize visual_svg even if it came from our own upload endpoint
    details = dict(data.details) if data.details else None
    if details and "visual_svg" in details:
        try:
            details["visual_svg"] = sanitize_svg_text(str(details["visual_svg"]))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid SVG in details: {exc}")

    post = Post(
        format=data.format,
        title=data.title,
        body="",  # deprecated field; kept non-null for schema compatibility
        hook=data.hook,
        key_points=data.key_points,
        takeaway=data.takeaway,
        source=data.source,
        source_url=data.source_url,
        image_url=data.image_url,
        details=details,
        author_id=current_user.id,
        status="pending",
    )
    post.interests = interest_objects
    db.add(post)
    db.commit()
    db.refresh(post)
    post_id = post.id

    # Re-query to load relationships for PostOut serialization
    return (
        db.query(Post)
        .options(selectinload(Post.interests), selectinload(Post.author))
        .filter(Post.id == post_id)
        .first()
    )


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    current_user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    post = (
        db.query(Post)
        .options(selectinload(Post.interests), selectinload(Post.author))
        .filter(Post.id == post_id)
        .first()
    )
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.status == "pending":
        if current_user is None or post.author_id != current_user.id:
            raise HTTPException(status_code=404, detail="Post not found")

    return post
