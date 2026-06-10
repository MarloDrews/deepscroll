from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base

post_interests = Table(
    "post_interests",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("interest_id", Integer, ForeignKey("interests.id"), primary_key=True),
)


class Interest(Base):
    __tablename__ = "interests"

    id   = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)


class Post(Base):
    __tablename__ = "posts"

    id         = Column(Integer, primary_key=True)
    format     = Column(String, nullable=False, index=True)
    title      = Column(String, nullable=False)
    feed_card  = Column(JSON, nullable=False)
    sections   = Column(JSON, nullable=False)
    author_id  = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status     = Column(String, nullable=False, default="published", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # False for official/seed content; True for user submissions.
    # Cannot be derived from author_id because seed posts also have an author.
    is_user_content = Column(Boolean, nullable=False, default=False)

    interests = relationship("Interest", secondary=post_interests)
    author    = relationship("User", back_populates="posts", foreign_keys=[author_id])

    @property
    def author_username(self):
        return self.author.username if self.author else None

    @property
    def author_is_verified(self):
        return self.author.is_verified if self.author else None


class Event(Base):
    __tablename__ = "events"

    id          = Column(Integer, primary_key=True)
    post_id     = Column(Integer, ForeignKey("posts.id"), nullable=False)
    event_type  = Column(String, nullable=False)
    duration_ms = Column(Integer, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=True)


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    email         = Column(String, unique=True, nullable=False, index=True)
    username      = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
    is_active     = Column(Boolean, default=True, nullable=False)
    is_verified   = Column(Boolean, default=False, nullable=False)
    is_private    = Column(Boolean, default=False, nullable=False)
    bio           = Column(String, nullable=True)
    avatar_url    = Column(String, nullable=True)

    posts = relationship("Post", back_populates="author", foreign_keys="Post.author_id")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)

    id           = Column(Integer, primary_key=True, index=True)
    follower_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status       = Column(String, default="accepted", nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)

    follower  = relationship("User", foreign_keys=[follower_id])
    following = relationship("User", foreign_keys=[following_id])


class UserElo(Base):
    __tablename__ = "user_elo"
    __table_args__ = (UniqueConstraint("user_id", "format", name="uq_user_elo"),)

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    format         = Column(String, nullable=False)
    rating         = Column(Float, nullable=False, default=1000.0)
    answered_count = Column(Integer, nullable=False, default=0)


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", "question_index", name="uq_quiz_answer"),
    )

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id        = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    question_index = Column(Integer, nullable=False)
    chosen_index   = Column(Integer, nullable=False)
    is_correct     = Column(Boolean, nullable=False)
    rating_delta   = Column(Float, nullable=False, default=0.0)
    created_at     = Column(DateTime, default=datetime.utcnow)


class Comment(Base):
    __tablename__ = "comments"

    id         = Column(Integer, primary_key=True)
    post_id    = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    body       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
