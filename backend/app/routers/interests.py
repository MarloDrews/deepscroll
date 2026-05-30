from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Interest
from ..schemas import InterestOut

router = APIRouter()


@router.get("/interests", response_model=List[InterestOut])
def get_interests(db: Session = Depends(get_db)):
    return db.query(Interest).all()
