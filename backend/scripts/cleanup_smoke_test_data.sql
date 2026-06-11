-- Cleanup for smoke-test data accidentally written to the live database on
-- 2026-06-11. The test suite's throwaway-DB guard was broken by the Supabase
-- migration (fixed in tests/_throwaway_db.py); one smoke_test run reached the
-- real database before the problem was caught.
--
-- What it created (and what this script removes):
--   users  alice@example.com / bob@example.com  (weak known passwords)
--   post   "Smoke Test Book" authored by bob (published, visible in feed)
--   quiz_answers + user_elo rows for those users / that post
-- The test aborted before creating follows, comments, events or chats, but
-- those deletes are included defensively (they match nothing otherwise).
--
-- NOT covered by SQL: one orphaned avatar in Supabase Storage, bucket
-- "uploads", object  images/78bfb500-6022-4f49-851e-85b8afa63aad.png
-- - delete it in the Supabase dashboard (Storage > uploads > images).
--
-- Run manually against the Supabase DB (do not run from the app):
--   psql "$DATABASE_URL" -f backend/scripts/cleanup_smoke_test_data.sql

BEGIN;

CREATE TEMPORARY TABLE _smoke_users ON COMMIT DROP AS
    SELECT id FROM users WHERE email IN ('alice@example.com', 'bob@example.com');

CREATE TEMPORARY TABLE _smoke_posts ON COMMIT DROP AS
    SELECT id FROM posts
    WHERE title = 'Smoke Test Book'
      AND author_id IN (SELECT id FROM _smoke_users);

DELETE FROM quiz_answers
    WHERE user_id IN (SELECT id FROM _smoke_users)
       OR post_id IN (SELECT id FROM _smoke_posts);
DELETE FROM user_elo WHERE user_id IN (SELECT id FROM _smoke_users);
DELETE FROM events
    WHERE user_id IN (SELECT id FROM _smoke_users)
       OR post_id IN (SELECT id FROM _smoke_posts);
DELETE FROM comments
    WHERE user_id IN (SELECT id FROM _smoke_users)
       OR post_id IN (SELECT id FROM _smoke_posts);
DELETE FROM follows
    WHERE follower_id IN (SELECT id FROM _smoke_users)
       OR following_id IN (SELECT id FROM _smoke_users);
DELETE FROM messages WHERE sender_id IN (SELECT id FROM _smoke_users);
DELETE FROM conversation_participants WHERE user_id IN (SELECT id FROM _smoke_users);
DELETE FROM post_interests WHERE post_id IN (SELECT id FROM _smoke_posts);
DELETE FROM posts WHERE id IN (SELECT id FROM _smoke_posts);
DELETE FROM users WHERE id IN (SELECT id FROM _smoke_users);

COMMIT;
