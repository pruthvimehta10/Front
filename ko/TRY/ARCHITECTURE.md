# EduFlow Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend                          │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │  │
│  │  │ Auth Pages   │  │  Homepage    │  │ Course Pages      │ │  │
│  │  │ (Signup/     │  │ (Featured    │  │ (Player/Exam)    │ │  │
│  │  │ Login)       │  │ Courses)     │  │                   │ │  │
│  │  └──────────────┘  └──────────────┘  └───────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │           Navigation & Layout                          │ │  │
│  │  │  • Navbar with Categories Dropdown                    │ │  │
│  │  │  • Search Functionality                               │ │  │
│  │  │  • Footer Navigation                                  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │           Reusable Components                          │ │  │
│  │  │  • CoursePlayer (Video + Playlist)                    │ │  │
│  │  │  • LessonQuizModal (Micro-Quizzes)                   │ │  │
│  │  │  • Shadcn/UI (40+ components)                         │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           (React 19)                               │
└─────────────────────────────────────────────────────────────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │  API Routes (Next.js)   │
                    │  /api/courses           │
                    │  /api/enrollments       │
                    │  /api/lessons/[id]      │
                    │  /api/quiz/submit       │
                    └─────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL PLATFORM                              │
├─────────────────────────────────────────────────────────────────────┤
│  • Automatic deployment from GitHub                                 │
│  • Edge caching and optimization                                   │
│  • Environment variables management                                │
│  • Function execution (API routes)                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE BACKEND                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                             │  │
│  │                                                              │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐   │  │
│  │  │ Authentication │  │ Course Data    │  │   Quiz      │   │  │
│  │  ├────────────────┤  ├────────────────┤  ├─────────────┤   │  │
│  │  │ • users        │  │ • courses      │  │ • questions │   │  │
│  │  │ • sessions     │  │ • lessons      │  │ • options   │   │  │
│  │  │ • tokens       │  │ • enrollments  │  │ • scores    │   │  │
│  │  │                │  │ • completions  │  │ • answers   │   │  │
│  │  └────────────────┘  └────────────────┘  └─────────────┘   │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │    Row Level Security (RLS) Policies                │   │  │
│  │  │    • Users see only their own data                  │   │  │
│  │  │    • Instructors can manage their courses           │   │  │
│  │  │    • Public courses visible to all                  │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Supabase Auth (PostgreSQL)                       │  │
│  │  • Email/Password authentication                             │  │
│  │  • JWT token management                                      │  │
│  │  • Session handling (HTTP-only cookies)                      │  │
│  │  • Email verification                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### 1. User Authentication Flow

```
┌─────────────┐
│   Signup    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Fill Email & Password               │
│ POST /api/auth/signup               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Supabase Auth Creates User          │
│ - Generate JWT token                │
│ - Send confirmation email           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ API Route Creates Profile Record    │
│ - Insert into 'users' table         │
│ - Link auth user to profile         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ User Confirms Email                 │
│ - Click verification link           │
│ - Email verified in Supabase Auth   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ User Logged In                      │
│ - JWT stored in secure cookie       │
│ - Access to authenticated routes    │
└─────────────────────────────────────┘
```

### 2. Course Enrollment & Progress Flow

```
┌──────────────────┐
│ Browse Courses   │
│ GET /api/courses │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Click "Enroll"                       │
│ POST /api/enrollments                │
└────────┬─────────────────────────────┘
         │ ┌─ Check user auth
         │ ├─ Create enrollment record
         │ └─ Set progress = 0%
         │
         ▼
┌──────────────────────────────────────┐
│ Load Course Player                   │
│ GET /api/courses/[id]                │
├──────────────────────────────────────┤
│ Returns:                             │
│ • Course metadata                    │
│ • Lesson list                        │
│ • User's progress                    │
│ • Locked/unlocked lessons            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Watch Lesson Video                   │
│ • Video URL fetched (if enrolled)    │
│ • Progress tracked in browser        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Video Ends → Quiz Prompt             │
│ Take Lesson Quiz Modal               │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Submit Lesson Quiz                   │
│ POST /api/quiz/submit                │
├──────────────────────────────────────┤
│ • Save quiz_score record             │
│ • Save individual answers            │
│ • Calculate score (% correct)        │
│ • Determine pass/fail (≥70%)         │
└────────┬─────────────────────────────┘
         │
         ▼ (if passed)
┌──────────────────────────────────────┐
│ Mark Lesson Complete                 │
│ POST /api/lessons/[id]/complete      │
├──────────────────────────────────────┤
│ • Create lesson_completion record    │
│ • Unlock next lesson                 │
│ • Update enrollment progress         │
└────────┬─────────────────────────────┘
         │
         ▼ (all lessons complete)
┌──────────────────────────────────────┐
│ Final Exam Unlocked                  │
│ View /courses/[id]/exam              │
├──────────────────────────────────────┤
│ • Show exam introduction              │
│ • List all exam questions             │
│ • Allow 1 attempt (or configurable)   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Submit Final Exam                    │
│ POST /api/quiz/submit                │
├──────────────────────────────────────┤
│ is_final_exam = true                 │
│ Calculate final score                │
└────────┬─────────────────────────────┘
         │
         ├─ Score < 70% → Retake exam
         │
         └─ Score ≥ 70% → Certificate eligible
```

### 3. Database Relationship Diagram

```
users (Supabase Auth)
  │
  ├──> enrollments
  │      │
  │      └──> courses
  │             │
  │             └──> lessons
  │                    │
  │                    ├──> lesson_completions ──> users
  │                    │
  │                    └──> quiz_questions
  │                           │
  │                           ├──> quiz_options
  │                           │
  │                           └──> quiz_answers
  │                                  │
  │                                  └──> quiz_scores ──> users
  │
  ├──> lesson_completions
  │      └──> lessons
  │
  └──> quiz_scores
         └──> quiz_questions
```

## Component Architecture

### Page Components (Route Handlers)

```
app/
├── page.tsx                    # Homepage (RSC)
│   └── CourseCard components
│
├── auth/
│   ├── login/page.tsx         # Client component
│   │   └── useToast hook
│   │
│   └── signup/page.tsx        # Client component
│       └── useToast hook
│
└── courses/
    ├── [id]/
    │   ├── page.tsx           # Client component
    │   │   ├── CoursePlayer
    │   │   └── LessonQuizModal
    │   │
    │   └── exam/page.tsx      # Client component
    │       └── Exam UI
    │
    └── ... (other routes)
```

### Reusable Components

```
components/
├── navbar.tsx                  # Global navigation
│   ├── Categories dropdown
│   ├── Search bar
│   └── Auth buttons
│
├── course-player.tsx          # Video player
│   ├── Video player
│   ├── Playlist sidebar
│   ├── Lesson info
│   └── Quiz prompt
│
├── lesson-quiz-modal.tsx      # Quiz modal
│   ├── Question display
│   ├── Answer options
│   ├── Progress bar
│   └── Results screen
│
└── ui/                        # Shadcn components
    ├── button
    ├── card
    ├── input
    ├── dialog
    ├── tabs
    ├── badge
    └── ... (40+ more)
```

## API Route Architecture

```
/api/
│
├── courses/
│   ├── route.ts              # GET /api/courses (list all)
│   └── [id]/
│       ├── route.ts          # GET /api/courses/[id] (detail)
│       └── exam/
│           └── route.ts      # Final exam endpoints
│
├── lessons/
│   └── [id]/
│       └── complete/
│           └── route.ts      # POST mark lesson complete
│
├── enrollments/
│   └── route.ts              # POST create enrollment
│
├── quiz/
│   └── submit/
│       └── route.ts          # POST submit quiz/exam
│
└── auth/
    ├── signup/
    │   └── route.ts          # POST user signup
    └── login/
        └── route.ts          # POST user login
```

## State Management Strategy

### Client-Side State (React hooks)
```typescript
// Quiz modal state
const [currentQuestion, setCurrentQuestion] = useState(0)
const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
const [submitted, setSubmitted] = useState(false)
const [score, setScore] = useState(0)

// Course player state
const [currentLessonId, setCurrentLessonId] = useState('')
const [isVideoEnded, setIsVideoEnded] = useState(false)
```

### Server State (Database)
```sql
-- User progress stored in DB
enrollments.progress               -- Course completion %
lesson_completions                -- Which lessons completed
quiz_scores.score                  -- Quiz/exam scores
quiz_scores.passed                 -- Pass/fail status
```

### Session State (Supabase Auth)
```typescript
// JWT token stored in secure HTTP-only cookie
const user = await supabase.auth.getUser()
const session = await supabase.auth.getSession()
```

## Security Architecture

### Authentication
```
1. User enters credentials
   ↓
2. Supabase Auth validates
   ↓
3. JWT token generated
   ↓
4. Token stored in HTTP-only cookie
   ↓
5. API routes verify token
   ↓
6. Access database via RLS-protected queries
```

### Authorization (Row Level Security)
```sql
-- Users can only see their own enrollments
CREATE POLICY "users_see_own_enrollments" ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only complete lessons from enrolled courses
CREATE POLICY "complete_enrolled_lessons" ON lesson_completions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN lessons l ON l.course_id = e.course_id
      WHERE e.user_id = auth.uid()
      AND l.id = lesson_id
    )
  );
```

### Data Protection
- **SQL Injection:** Parameterized queries (Supabase client handles)
- **XSS:** React escapes JSX content automatically
- **CSRF:** Next.js middleware handles CSRF tokens
- **Video Piracy:** CSS overlay + no-download attributes

## Deployment Architecture

```
GitHub Repository
       │
       ▼ (webhook on push)
Vercel Build Pipeline
       │
       ├─ Install dependencies
       ├─ Run build
       ├─ Type check
       ├─ Generate static pages
       └─ Package for deployment
       │
       ▼
Vercel Edge Network
       │
       ├─ CDN for static assets
       ├─ Serverless functions (API routes)
       └─ Automatic HTTPS
       │
       ▼
Supabase Database
       │
       ├─ PostgreSQL instance
       ├─ Auto backups
       ├─ RLS enforcement
       └─ Real-time subscriptions
```

## Performance Optimization Strategy

1. **Code Splitting:** Routes split automatically by Next.js
2. **Image Optimization:** Use `next/image` component
3. **Lazy Loading:** Use `dynamic()` for heavy components
4. **Caching:** Leverage Vercel's edge caching
5. **Database:** Index frequently queried columns
6. **API:** Pagination for large result sets

## Scaling Considerations

### Current State (MVP)
- Single Supabase project
- Basic Vercel free tier
- No caching layer
- No CDN for videos

### Growth Phase (1-10K users)
- Add Redis caching (Upstash)
- Implement database connection pooling
- Video CDN (Mux, Cloudinary)
- Monitoring (Sentry)

### Scale Phase (10K+ users)
- Database read replicas
- Multi-region deployment
- Advanced caching strategy
- Content delivery network
- Load balancing

---

This architecture is designed to be secure, scalable, and maintainable while following Next.js and React best practices.
