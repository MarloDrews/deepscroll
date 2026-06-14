// Train marathon data layer types.
//
// IMPORTANT (mock phase): `answerIndex` lives CLIENT-SIDE only because there is
// no Train backend yet. Correctness is decided here in the app against the mock
// pool. When the real backend exists, correctness MUST be decided server-side
// and `answerIndex` (plus `explanation`) MUST be stripped from the question
// payload before it reaches the client — exactly how PostOut strips
// `answer_index`/`explanation` from QuizItem today (see mobile/src/types/post.ts
// and backend/app/routers/quiz.py, where /quiz/answer compares server-side and
// answer_index never leaves the server).

// Maps to the Elo opponent rating the question is played against:
// 1 -> 800, 2 -> 1000, 3 -> 1200 (mirrors backend DIFFICULTY_RATING).
export type Difficulty = 1 | 2 | 3

export interface MarathonQuestion {
  id: string // stable unique id
  prompt: string // the question text (broad, general-knowledge, not topic-specific)
  options: string[] // 2-5 options, multiple choice only
  answerIndex: number // index into options (CLIENT-SIDE for now; see top-of-file note)
  difficulty: Difficulty
  explanation?: string // shown after answering
  topic?: string // optional coarse tag, NOT used for filtering the marathon
}

export interface AnswerResult {
  correct: boolean
  correctIndex: number
  explanation?: string
  eloBefore: number
  eloAfter: number
  delta: number // signed, already rounded
  answerMs: number // time taken to answer
  questionRating: number // the Elo opponent rating (800/1000/1200)
}
