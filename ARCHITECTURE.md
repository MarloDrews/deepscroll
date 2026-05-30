# Deepscroll Architecture

## FOLDER STRUCTURE

```
backend/
  requirements.txt              fastapi, uvicorn, sqlalchemy
  seed.py                       inserts 7 interests + 18 sample posts into the DB
  deepscroll.db                 SQLite database (gitignored)
  app/
    database.py                 engine, SessionLocal, Base, get_db dependency
    main.py                     FastAPI app, CORS for localhost:3000, router registration, create_all on startup
    models.py                   ORM models: Interest, Post, Event, post_interests join table
    schemas.py                  Pydantic models: InterestOut, PostOut, EventIn
    routers/
      interests.py              GET /api/interests
      feed.py                   GET /api/feed
      events.py                 POST /api/events

frontend/
  .env.example                  NEXT_PUBLIC_API_URL template
  .env.local                    actual env vars (gitignored)
  src/app/
    layout.tsx                  root layout, Geist font, title "Deepscroll"
    globals.css                 Tailwind import, Geist font wiring, heart-pop keyframe
    page.tsx                    home feed: 7-tab bar, horizontal snap between tabs, vertical snap within each, real-time indicator
    onboarding/
      page.tsx                  server component — fetches interests, passes to InterestPicker
      InterestPicker.tsx        client — pill selector, requires 2+, saves slugs to localStorage
    components/
      PostCard.tsx               full-screen snap card, gradient+radial glow, entry animation, dwell tracking
      LikeButton.tsx             heart toggle, spring pop animation, queues like event
    lib/
      eventQueue.ts             module-level batch queue; flushes every 5s or at 5 events to POST /api/events

.claude/skills/commit.md        conventional commit format rules for this project
```

## DATABASE

### interests
| column | type   | description                     |
|--------|--------|---------------------------------|
| name   | String | display label e.g. "Politics"   |
| slug   | String | filter key e.g. "politics"      |

### posts
| column  | type    | description                                           |
|---------|---------|-------------------------------------------------------|
| format  | String  | one of: books, facts, people, concepts, questions, stories |
| title   | String  |                                                       |
| body    | Text    |                                                       |
| source  | String? | attribution for book posts                            |

### post_interests
Join table linking posts ↔ interests (many-to-many).

### events
| column      | type     | description                              |
|-------------|----------|------------------------------------------|
| post_id     | FK→posts |                                          |
| event_type  | String   | "view" or "like"                         |
| duration_ms | Integer? | ms card was on screen; null for likes    |

## API ENDPOINTS

```
GET  /api/interests                                    → [{id, name, slug}]
GET  /api/feed  ?interests=slug1,slug2  ?format=books  → [{id, format, title, body, source, interests[]}]
POST /api/events  body: [{post_id, event_type, duration_ms?}]  → {stored: N}
GET  /health                                           → {status: "ok"}
```

## FRONTEND COMPONENTS

| file                   | responsibility                                                              |
|------------------------|-----------------------------------------------------------------------------|
| page.tsx               | 7-tab feed; each tab is an independent lazy-fetched vertical snap feed      |
| PostCard.tsx           | full-screen card; IntersectionObserver drives entry animation + dwell timer |
| LikeButton.tsx         | heart toggle with spring pop; fires like event on tap                       |
| InterestPicker.tsx     | onboarding pill grid; gates entry to feed via localStorage                  |
| eventQueue.ts          | batches view/like events and POSTs them in groups rather than one-by-one    |

## CURRENT STATUS

**Built**
- FastAPI backend with SQLite, CORS, 3 API endpoints
- SQLAlchemy models: Interest, Post, Event
- Seed script: 7 interests, 18 real-content posts across all formats
- Onboarding: interest picker → slugs saved to localStorage → gates feed
- Feed: 7-tab horizontal swipe (Instagram-style) + vertical snap scroll per tab
- Per-tab lazy fetch with in-memory cache (no re-fetch on tab revisit)
- Real-time sliding tab indicator (direct DOM writes, 60fps, color interpolation)
- Card entry animation (fade + slide-up, respects prefers-reduced-motion)
- Engagement tracking: dwell time per card, like events, batched to backend

**Next**
- User accounts and authentication
- Recommendation algorithm using collected events
- Content management for adding real posts
- Pagination / infinite scroll
- PostgreSQL migration
