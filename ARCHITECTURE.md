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
    models.py                   ORM models: Interest, Post (author_id FK→users nullable, status string default "published", image_path), Event (user_id nullable FK), User (posts relationship), Comment, post_interests join table
    auth.py                     hash_password, verify_password, create_access_token, decode_access_token, get_current_user, get_optional_user (returns User|None, used for optional auth)
    schemas.py                  Pydantic models: InterestOut, PostOut (author_username, status, is_user_content), PostCreate, EventIn, UploadResponse, SvgUploadResponse
    sanitize.py                 validate_image() — chunked read, magic-byte check, animated-GIF reject, Pillow re-encode; sanitize_svg() / sanitize_svg_text() — defusedxml XXE check, lxml element+attribute whitelist, dangerous-pattern rejection
    upload_config.py            UPLOAD_DIR (absolute path at repo root/user_uploads/), size limits (5 MB images, 512 KB SVGs)
    rate_limit.py               in-memory per-user rate limiter (dict of timestamps); check_rate_limit(user_id, key, max, window_secs)
    scoring.py                    score_posts() — interest match (tier-scaled), format engagement, repeat penalty
    routers/
      interests.py              GET /api/interests
      feed.py                   GET /api/feed — three-tier: direct matches → related co-tags → all remaining

      events.py                 POST /api/events (captures user_id when auth token present; deduplicates "like" events per user+post for auth users); GET /api/posts/{id}/likes → {count, liked}
      auth.py                   POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, PATCH /api/auth/me (update username/password), DELETE /api/auth/me (delete account)
      search.py                 GET /api/search — case-insensitive substring search across title, hook, body, author, known_for, the_question; ranked by title-match then recency; limit 50
      comments.py               GET /api/posts/{id}/comments?count=true → {count} or full list; POST /api/posts/{id}/comments (auth); DELETE /api/comments/{id} (auth, own comment only)
      uploads.py                POST /api/upload/image (10/hr, validate_image, UUID filename); POST /api/upload/svg (10/hr, sanitize_svg, returns svg_content string not URL)
      posts.py                  GET /api/posts/mine (auth, any status); POST /api/posts (auth, 20/day, status="pending"); GET /api/posts/{id} (pending visible to author only)
    lib/
      savedPosts.ts             getSavedPostIds, savePost, unsavePost, isPostSaved; localStorage key "deepscroll_saved"; server-safe (typeof window check); TODO: replace with backend endpoint

user_uploads/                 gitignored; absolute path outside backend/ so files are never importable as Python modules; subdirs: images/, svgs/

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
      page.tsx                  account page: avatar (initials), @username, email, "My posts →" link, inline forms for change username / change password / sign out / delete account; BottomNav (profile active)
    search/
      page.tsx                  search input + format chips + compact result cards; debounced 300ms; navigates to post detail; BottomNav (search active); attribution (@user or Deepscroll) below title in result cards
    create/
      page.tsx                  3-step post creation wizard: format selection (6 cards), duplicate check (debounced search), structured form with image/SVG upload; submits to POST /api/posts; success screen links to /my-posts; BottomNav (create active)
    my-posts/
      page.tsx                  lists the current user's own posts with format badge, status badge (pending/published), and relative timestamps; fetches GET /api/posts/mine; empty state links to /create; BottomNav (create active); attribution (@username) below title in post list cards
    saved-posts/
      page.tsx                  bookmarked posts: reads IDs from localStorage via getSavedPostIds, fetches each via GET /api/posts/{id} (auth optional; pending author-only posts load correctly), renders as full-screen snap-scroll PostCards; skips missing/deleted posts silently; empty state with bookmark icon; BottomNav (profile active)
    post/
      [id]/
        page.tsx                full-screen detail page; structured layout with image, meta, key points, format-specific sections, takeaway, source link, comments section; sticky comment bar at bottom with like-only heart button on the right (no count, no share/save); floating action column removed; slide-up animation, overscroll-to-close; attribution line below format badge (Submitted by @user for user content, Deepscroll + violet verified icon for seed/official)
    components/
      PostCard.tsx               full-screen snap card; format-aware layout with image, stat/meta highlight, hook, inline SVG; exports Post interface and FORMAT_STYLES
      BottomNav.tsx              fixed bottom nav: Search / Stats / Feed (flame) / Create (plus-circle, center, white when logged in) / Profile; 5 buttons; active item highlighted; safe-area-inset-bottom aware
      LikeButton.tsx             heart button (one-way), spring pop animation; liked/count/onToggle/size props
      Providers.tsx              "use client" boundary; wraps children with AuthProvider so layout.tsx stays a Server Component
    lib/
      eventQueue.ts             module-level batch queue; flushes every 5s or at 5 events to POST /api/events; exports hasPendingLike/cancelPendingLike so unlike-before-flush can cancel an in-flight event; deduplicates "like" events per post_id within the current queue
      useWikipediaImage.ts      hook — fetches portrait from Wikipedia REST API for people posts without image_url; returns thumbnail or original size
      auth.tsx                  AuthContext + AuthProvider: stores JWT in localStorage under "deepscroll_token", restores session via /api/auth/me on load, exposes user/login/register/logout/updateUser/loading
      api.ts                    apiFetch wrapper: prepends NEXT_PUBLIC_API_URL, attaches Authorization: Bearer header when token present
      likedPosts.ts             isPostLiked, likePost, unlikePost, getLikedPostIds; localStorage key "deepscroll_liked"; getCachedLikeCount/setCachedLikeCount; key "deepscroll_like_counts"; isLikeSent/markLikeSent/unmarkLikeSent; key "deepscroll_like_sent" tracks posts whose like event reached the backend — used in the server-count reconciliation formula; one-time migration seeds sent-key from liked-key; server-safe; TODO: replace with backend endpoint
      savedPosts.ts             isPostSaved, savePost, unsavePost, getSavedPostIds; localStorage key "deepscroll_saved"; server-safe; TODO: replace with backend endpoint

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
| author_id         | Int FK? | FK→users.id; null = official/seed content                    |
| status            | String  | "published" (default, seed) or "pending" (user submission)    |
| image_path        | String? | server filesystem path to uploaded image file                 |

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
| user_id     | FK→users, nullable | set when auth token present; used by GET /likes to determine liked state |

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
GET  /api/posts/{id}/comments?count=true                   → {count: N}  404 if post not found
POST /api/posts/{id}/comments  Authorization: Bearer <token>  body: {body}  → CommentOut  201  404 if post not found  422 if body empty or >2000 chars
DELETE /api/comments/{id}      Authorization: Bearer <token>  → 204  403 if not the comment's author  404 if not found
GET  /api/posts/{id}/likes                                 → {count: N, liked: bool}  auth optional; liked=true only when token present and user has a like event for this post
POST /api/upload/image  Authorization: Bearer <token>      multipart file field "file"  → {url: "/uploads/images/{uuid}.ext"}  10/hr rate limit  validates magic bytes + Pillow re-encode
POST /api/upload/svg    Authorization: Bearer <token>      multipart file field "file"  → {svg_content: "<sanitized SVG>"}  10/hr rate limit  defusedxml+lxml whitelist sanitization
POST /api/posts         Authorization: Bearer <token>      body: PostCreate JSON        → PostOut 201  status="pending"  20/day rate limit  unknown interest slug → 400
GET  /api/posts/mine    Authorization: Bearer <token>                                   → [PostOut]  all statuses  ordered by created_at DESC
```

## SECURITY

Comment body is untrusted user input stored as plain text. React's default JSX text rendering
writes to the DOM via `.textContent`, which the browser treats as literal characters — `<script>`
becomes `&lt;script&gt;` and cannot execute. `dangerouslySetInnerHTML` bypasses this by injecting
raw HTML directly into the DOM, enabling XSS if the string contains `<script>` tags or event
attributes. Never use `dangerouslySetInnerHTML` to render comment text.

### User-uploaded file security

- **SVG sanitized twice**: upload endpoint (sanitize_svg) + post creation (sanitize_svg_text) as defense-in-depth
- **SVG rendering**: user SVGs (is_user_content=true) rendered as `<img src="data:image/svg+xml;base64,…">` — JavaScript cannot execute in image context. Official/seed SVGs may use dangerouslySetInnerHTML (controlled pipeline); marked with a comment in PostCard.tsx and post/[id]/page.tsx
- **Image re-encoding**: Pillow converts to RGB and re-saves at quality=85, stripping steganographic payloads and ICC profiles
- **Magic-byte check**: file bytes inspected before Pillow to reject non-image content disguised with an image extension
- **Animated GIFs**: rejected outright (hard to sanitize safely)
- **UUID filenames**: upload filenames always UUID-generated — user-provided filenames are never used (prevents path traversal like `../../etc/passwd`)
- **Upload directory**: absolute path outside backend/ (`user_uploads/` at repo root) — files are never on Python's module search path
- **image_url validation**: user-submitted posts must use `/uploads/` prefix — no external image URLs accepted
- **File size enforced via chunked reads**: Content-Length header is not trusted; reads stop as soon as the running total exceeds the limit
- **Rate limits**: 10 image uploads/hr, 10 SVG uploads/hr, 20 post submissions/day per user (in-memory, no external dependency)

## FRONTEND COMPONENTS

| file                   | responsibility                                                              |
|------------------------|-----------------------------------------------------------------------------|
| page.tsx               | 7-tab feed; each tab is an independent lazy-fetched vertical snap feed; BottomNav (feed active) |
| PostCard.tsx           | full-screen card; format-aware layout; exports Post interface + FORMAT_STYLES; bottom-right button column (like/comment/save/share); all four buttons use identical div wrapper (gap-1, w-6 h-6 icon); handleLike() shared by small button and double-tap; double-tap on already-liked does nothing; save state via savedPosts.ts with heart-pop animation; share uses paper-plane icon + Web Share API with clipboard fallback + Toast |
| BottomNav.tsx          | fixed bottom nav: Search / Stats / Feed (flame) / Create (plus-circle, white when logged in) / Profile; 5 buttons; active item highlighted; safe-area-inset-bottom aware |
| saved-posts/page.tsx   | bookmarked posts feed: reads IDs from localStorage, fetches each via GET /api/posts/{id}, snap-scroll PostCards; skips missing posts; empty state; BottomNav (profile active) |
| search/page.tsx        | search input + format chips + compact result cards; debounced 300ms; links to post detail; BottomNav (search active) |
| LikeButton.tsx         | controlled heart toggle; liked/count/onToggle/size props; size="md" (w-6 h-6, feed) or "sm" (w-5 h-5, detail); heart-pop spring animation; no internal event queuing (parent handles queueEvent) |
| InterestPicker.tsx     | onboarding pill grid; 10 category sections + Other; fetches own data; gates entry to feed via localStorage |
| eventQueue.ts          | batches view/like events and POSTs them in groups rather than one-by-one    |
| useWikipediaImage.ts   | fetches Wikipedia portrait for people posts lacking image_url; thumbnail or original size |
| auth.tsx               | AuthContext/Provider: JWT in localStorage, session restore via /me, login/register/logout/loading |
| api.ts                 | apiFetch: adds Authorization header when token present                      |
| Providers.tsx          | client boundary so layout.tsx (Server Component) can mount AuthProvider     |
| profile/page.tsx       | account settings: avatar, identity display, change username/password, sign out, delete account; BottomNav (profile active) |
| CommentsSection.tsx    | read-only display component; receives comments/currentUsername/onDelete/deletingId as props; relative timestamps (UTC-aware); plain-text only (no dangerouslySetInnerHTML); exports Comment interface |
| CommentsBottomSheet.tsx | bottom sheet modal for feed card comments; self-contained state (fetch/post/delete); drag-to-close on handle bar; sticky input; fixed overlay with max-w-[430px] sheet |
| Toast.tsx              | fixed bottom-center pill notification; visible prop controls opacity via CSS transition; pointer-events-none |

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
