// Response shapes of GET /api/stats/global and GET /api/stats/me plus the
// Friends-tab fan-out aggregate, copied verbatim from the web stats page
// (frontend/src/app/stats/page.tsx).

export interface GlobalStats {
  overview: {
    total_posts: number
    total_users: number
    total_comments: number
    total_likes: number
    avg_posts_per_user: number
  }
  top_creators_by_posts: { username: string; is_verified: number; post_count: number }[]
  top_creators_by_likes: { username: string; is_verified: number; like_count: number }[]
  top_creators_by_comments: { username: string; is_verified: number; comment_count: number }[]
  top_creators_by_avg_read_time: { username: string; is_verified: number; avg_duration_ms: number }[]
  top_creators_per_format: Record<string, { username: string; post_count: number }[]>
  top_posts_by_likes: { post_id: number; title: string; format: string; author: string; like_count: number }[]
  posts_over_time: { period: string; count: number }[]
  users_over_time: { period: string; count: number }[]
  comments_over_time: { period: string; count: number }[]
  likes_over_time: { period: string; count: number }[]
  posts_by_format: Record<string, number>
  comments_by_format: Record<string, number>
  likes_by_format: Record<string, number>
  activity_by_weekday: { weekday: string; count: number }[]
  activity_by_hour: { hour: number; count: number }[]
  activity_heatmap: { weekday: number; hour: number; count: number }[]
  post_quality_over_time: { period: string; avg_likes_per_post: number }[]
  pending_vs_published: { published: number; pending: number }
  comment_activity_by_user: { username: string; comment_count: number }[]
}

export interface MyStats {
  overview: {
    posts_created: number
    posts_published: number
    posts_pending: number
    likes_received: number
    comments_received: number
    posts_saved: number
    posts_liked: number
  }
  my_posts_over_time: { period: string; count: number }[]
  my_likes_received_over_time: { period: string; count: number }[]
  my_comments_received_over_time: { period: string; count: number }[]
  my_posts_by_format: Record<string, number>
  my_activity_by_weekday: { weekday: string; count: number }[]
  my_activity_by_hour: { hour: number; count: number }[]
  my_activity_heatmap: { weekday: number; hour: number; count: number }[]
  my_top_posts_by_likes: { post_id: number; title: string; format: string; like_count: number }[]
  my_top_posts_by_comments: { post_id: number; title: string; format: string; comment_count: number }[]
  my_avg_read_time_per_format: { format: string; avg_duration_ms: number }[]
  my_avg_read_time_over_time: { period: string; avg_duration_ms: number }[]
  my_comments_written: number
  my_comments_written_by_format: { format: string; count: number }[]
  my_ranking: { by_posts: number; by_likes: number; total_users: number }
  my_engagement_score: number
  my_streak: { current_days: number; best_days: number }
  my_milestones: { label: string; achieved: boolean; achieved_at: string | null }[]
  my_likes_given_by_format: { format: string; count: number }[]
  my_elo: {
    global_rating: number | null
    formats: Record<string, { rating: number; answered_count: number }>
  }
  my_quiz: { answered: number; correct: number; accuracy: number }
}

export interface FriendStats {
  username: string
  is_verified: number
  global_rating: number | null
  formats: Record<string, { rating: number; answered_count: number }>
  post_count: number
  follower_count: number
  following_count: number
}
