from typing import List

from pydantic import BaseModel, ConfigDict, field_validator


class InterestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    format: str
    title: str
    body: str
    source: str | None
    interests: List[str]

    @field_validator("interests", mode="before")
    @classmethod
    def extract_names(cls, v):
        if v and hasattr(v[0], "name"):
            return [interest.name for interest in v]
        return v
