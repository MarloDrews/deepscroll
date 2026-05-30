from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models  # noqa: F401 — registers models with Base before create_all
from .routers import feed, interests as interests_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(interests_router.router, prefix="/api")
app.include_router(feed.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
