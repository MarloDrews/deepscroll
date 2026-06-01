# Deepscroll Architecture

## FOLDER STRUCTURE

```
backend/
  requirements.txt              fastapi, uvicorn, sqlalchemy, passlib[bcrypt], python-jose[cryptography], python-dotenv, email-validator
  .env.example                  JWT_SECRET template (copy to .env, never commit .env)
  seed.py                       idempotent: get-or-create 145 interests from taxonomy; delete-and-reseed posts from seed_content.json
  deepscroll.db                 SQLite database (gitignored)
  app/
    database.py                 engine, SessionLocal, Base, get_db dependency
    main.py                     FastAPI app, CORS for localhost:3000, router registration, create_all on startup
    models.py                   ORM models: Interest, Post, Event, User, post_interests join table
    auth.py                     hash_password, verify_password, create_access_token, decode_access_token, get_current_user dependency
    schemas.py                  Pydantic models: InterestOut, PostOut, EventIn
    scoring.py                    score_posts() — interest match (tier-scaled), format engagement, repeat penalty
    routers/
      interests.py              GET /api/interests
      feed.py                   GET /api/feed — three-tier: direct matches → related co-tags → all remaining
      posts.py                  GET /api/posts/{id}
      events.py                 POST /api/events
      auth.py                   POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, PATCH /api/auth/me (update username/password), DELETE /api/auth/me (delete account)
      search.py                 GET /api/search — case-insensitive substring search across title, hook, body, author, known_for, the_question; ranked by title-match then recency; limit 50
      comments.py               GET /api/posts/{id}/comments (public); POST /api/posts/{id}/comments (auth); DELETE /api/comments/{id} (auth, own comment only)

frontend/
  .env.example                  NEXT_PUBLIC_API_URL template
  .env.local                    actual env vars (gitignored)
  src/app/
    layout.tsx                  root layout, Geist font, title "Deepscroll"
    globals.css                 Tailwind import, Geist font wiring, heart-pop keyframe
    page.tsx                    home feed: 7-tab bar, horizontal snap between tabs, vertical snap within each, real-time indicator; BottomNav (feed active)
    onboarding/
      page.tsx                  server component — renders InterestPicker (no props)
      InterestPicker.tsx        client — fetches /api/interests, groups 145 pills into 10 categories, sticky header/footer, saves slugs to localStorage
    login/
      page.tsx                  login form: email + password, inline error messages, redirects to / on success or if already logged in
    register/
      page.tsx                  register form: email + username + password, inline error messages, redirects to / on success or if already logged in
    profile/
      page.tsx                  account page: avatar (initials), @username, email, inline forms for change username / change password / sign out / delete account; BottomNav (profile active)
    search/
      page.tsx                  search input + format chips + compact result cards; debounced 300ms; navigates to post detail; BottomNav (search active)
    post/
      [id]/
        page.tsx                full-screen detail page; structured layout with image, meta, key points, format-specific sections, takeaway, source link; slide-up animation, overscroll-to-close
    components/
      PostCard.tsx               full-screen snap card; format-aware layout with image, stat/meta highlight, hook, inline SVG; exports Post interface and FORMAT_STYLES
      BottomNav.tsx              fixed bottom nav: Search / Feed (flame) / Profile; active item highlighted; safe-area-inset-bottom aware
      LikeButton.tsx             heart toggle, spring pop animation, queues like event
      Providers.tsx              "use client" boundary; wraps children with AuthProvider so layout.tsx stays a Server Component
    lib/
      eventQueue.ts             module-level batch queue; flushes every 5s or at 5 events to POST /api/events
      useWikipediaImage.ts      hook — fetches portrait from Wikipedia REST API for people posts without image_url; returns thumbnail or original size
      auth.tsx                  AuthContext + AuthProvider: stores JWT in localStorage under "deepscroll_token", restores session via /api/auth/me on load, exposes user/login/register/logout/updateUser/loading
      api.ts                    apiFetch wrapper: prepends NEXT_PUBLIC_API_URL, attaches Authorization: Bearer header when token present

.claude/skills/commit.md        conventional commit format rules for this project
```

## DATABASE

### interests
| column | type   | description                     |
|--------|--------|---------------------------------|
| name   | String | display label e.g. "Politics"   |
| slug   | String | filter key e.g. "politics"      |

### posts
| column            | type    | description                                                   |
|-------------------|---------|---------------------------------------------------------------|
| format            | String  | one of: books, facts, people, concepts, questions, stories    |
| title             | String  |                                                               |
| body              | Text    | deprecated fallback; use structured fields below              |
| source            | String? | attribution for book posts                                    |
| hook              | String? | one compelling opening sentence                               |
| key_points        | JSON?   | list of 2-4 short bullet strings                              |
| takeaway          | String? | closing "what you take away" sentence                         |
| source_url        | String? | link to the original source                                   |
| image_url         | String? | URL to cover, portrait, or atmospheric image                  |
| image_attribution | String? | source/license of the image                                   |
| related_slugs     | JSON?   | list of related post slugs, for future use                    |
| details           | JSON?   | format-specific fields; keys documented in models.py          |

### post_interests
Join table linking posts ↔ interests (many-to-many).

### comments
| column     | type      | description                              |
|------------|-----------|------------------------------------------|
| id         | Integer   | primary key                              |
| post_id    | FK→posts  |                                          |
| user_id    | FK→users  |                                          |
| body       | Text      | plain text; max 2000 chars enforced by API |
| created_at | DateTime  | default now                              |

### events
| column      | type     | description                              |
|-------------|----------|------------------------------------------|
| post_id     | FK→posts |                                          |
| event_type  | String   | "view" or "like"                         |
| duration_ms | Integer? | ms card was on screen; null for likes    |

### users
| column        | type     | description                               |
|---------------|----------|-------------------------------------------|
| id            | Integer  | primary key                               |
| email         | String   | unique, indexed, not null                 |
| username      | String   | unique, not null                          |
| password_hash | String   | bcrypt hash; plaintext never stored       |
| created_at    | DateTime | default now                               |
| is_active     | Boolean  | default true; false = soft-deleted        |

## API ENDPOINTS

```
GET  /api/interests                                    → [{id, name, slug}]
GET  /api/feed  ?interests=slug1,slug2  ?format=books  → [{id, format, title, body, source, hook, key_points, takeaway, source_url, image_url, image_attribution, related_slugs, details, interests[]}]
GET  /api/posts/{id}                                   → {id, format, title, body, source, hook, key_points, takeaway, source_url, image_url, image_attribution, related_slugs, details, interests[]}  404 if not found
GET  /api/search  ?q=...  ?format=books                → [{...PostOut}]  limit 50, title matches ranked first; empty list if q is blank
POST /api/events  body: [{post_id, event_type, duration_ms?}]  → {stored: N}
GET  /health                                           → {status: "ok"}
POST /api/auth/register  body: {email, username, password}  → {access_token, token_type, user: {id, email, username, created_at}}  400 on duplicate email/username
POST /api/auth/login     body: {email, password}            → {access_token, token_type, user: {id, email, username, created_at}}  401 on bad credentials (same msg for unknown email or wrong password)
GET  /api/auth/me        Authorization: Bearer <token>      → {id, email, username, created_at}  401 if invalid/missing token
PATCH /api/auth/me      Authorization: Bearer <token>      body: {username?, new_password?, current_password?}  → updated UserOut  400 on bad current_password or duplicate username
DELETE /api/auth/me     Authorization: Bearer <token>      body: {current_password}  → 204  400 on bad current_password
GET  /api/posts/{id}/comments                              → [{id, post_id, username, body, created_at}]  newest first  404 if post not found
POST /api/posts/{id}/comments  Authorization: Bearer <token>  body: {body}  → CommentOut  201  404 if post not found  422 if body empty or >2000 chars
DELETE /api/comments/{id}      Authorization: Bearer <token>  → 204  403 if not the comment's author  404 if not found
```

## SECURITY

Comment body is untrusted user input stored as plain text. React's default JSX text rendering
writes to the DOM via `.textContent`, which the browser treats as literal characters — `<script>`
becomes `&lt;script&gt;` and cannot execute. `dangerouslySetInnerHTML` bypasses this by injecting
raw HTML directly into the DOM, enabling XSS if the string contains `<script>` tags or event
attributes. Never use `dangerouslySetInnerHTML` to render comment text.

## FRONTEND COMPONENTS

| file                   | responsibility                                                              |
|------------------------|-----------------------------------------------------------------------------|
| page.tsx               | 7-tab feed; each tab is an independent lazy-fetched vertical snap feed; BottomNav (feed active) |
| PostCard.tsx           | full-screen card; format-aware layout (image, stat, meta, hook, SVG); exports Post interface + FORMAT_STYLES |
| BottomNav.tsx          | fixed bottom nav: Search / Feed (flame) / Profile; active item highlighted; respects safe-area-inset-bottom |
| search/page.tsx        | search input + format chips + compact result cards; debounced 300ms; links to post detail; BottomNav (search active) |
| LikeButton.tsx         | heart toggle with spring pop; fires like event on tap                       |
| InterestPicker.tsx     | onboarding pill grid; 10 category sections + Other; fetches own data; gates entry to feed via localStorage |
| eventQueue.ts          | batches view/like events and POSTs them in groups rather than one-by-one    |
| useWikipediaImage.ts   | fetches Wikipedia portrait for people posts lacking image_url; thumbnail or original size |
| auth.tsx               | AuthContext/Provider: JWT in localStorage, session restore via /me, login/register/logout/loading |
| api.ts                 | apiFetch: adds Authorization header when token present                      |
| Providers.tsx          | client boundary so layout.tsx (Server Component) can mount AuthProvider     |
| profile/page.tsx       | account settings: avatar, identity display, change username/password, sign out, delete account; BottomNav (profile active) |

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
- User accounts: JWT auth (bcrypt + python-jose), register/login/me endpoints, password min 8 / max 72 bytes
- Frontend auth UI: AuthContext, login/register pages, JWT in localStorage, session restore, account indicator in feed
- Profile page: account settings with inline forms, PATCH/DELETE /api/auth/me backend endpoints, profile icon in tab bar

**Next**
- Recommendation algorithm using collected events
- Content management for adding real posts
- Pagination / infinite scroll
- PostgreSQL migration
