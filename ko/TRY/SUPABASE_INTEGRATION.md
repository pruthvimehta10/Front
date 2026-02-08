# Supabase Integration Guide for EduFlow

This guide shows how to integrate Supabase authentication and real-time data syncing into your EduFlow EdTech platform.

## Phase 1: Authentication Integration

### Step 1: Install Supabase Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Step 2: Create Supabase Client (Server-Side)

Create `/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle server component cookie setting
          }
        },
      },
    }
  )
}
```

### Step 3: Create Supabase Client (Client-Side)

Create `/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}
```

### Step 4: Integrate Auth in Login Page

Update `/app/auth/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // ... existing JSX
  )
}
```

### Step 5: Integrate Auth in Signup Page

Update `/app/auth/signup/page.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
            window.location.origin,
        },
      })

      if (authError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: authError.message,
        })
        return
      }

      // Create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
          })

        if (profileError) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create profile',
          })
          return
        }
      }

      toast({
        title: 'Success',
        description: 'Check your email to confirm your account',
      })

      router.push('/auth/login')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Signup failed',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // ... existing JSX
  )
}
```

## Phase 2: Course Data Integration

### Step 1: Create API Route for Courses

Create `/app/api/courses/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(courses)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 2: Create API Route for Course Details with Lessons

Create `/app/api/courses/[id]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (courseError) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', params.id)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      course,
      lessons,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 3: Create Enrollment API

Create `/app/api/enrollments/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { courseId } = await req.json()
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(enrollment)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Phase 3: Lesson Completion Tracking

### Create API Route for Marking Lesson Complete

Create `/app/api/lessons/[id]/complete/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark lesson as completed
    const { data: completion, error } = await supabase
      .from('lesson_completions')
      .insert({
        user_id: user.id,
        lesson_id: params.id,
      })
      .select()
      .single()

    if (error && error.code !== '23505') {
      // 23505 = unique constraint violation (already completed)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Phase 4: Quiz Scoring

### Create API Route for Submitting Quiz Results

Create `/app/api/quiz/submit/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lessonId, answers, isFinalExam, timeTaken } = await req.json()
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate score
    let correctCount = 0
    answers.forEach((answer: any) => {
      if (answer.isCorrect) correctCount++
    })
    const score = Math.round((correctCount / answers.length) * 100)
    const passed = score >= 70

    // Save quiz score
    const { data: scoreRecord, error: scoreError } = await supabase
      .from('quiz_scores')
      .insert({
        user_id: user.id,
        lesson_id: isFinalExam ? null : lessonId,
        is_final_exam: isFinalExam,
        score,
        passed,
        time_taken_seconds: timeTaken,
      })
      .select()
      .single()

    if (scoreError) {
      return NextResponse.json(
        { error: scoreError.message },
        { status: 400 }
      )
    }

    // Save individual answers
    const answerRecords = answers.map((answer: any, index: number) => ({
      score_id: scoreRecord.id,
      question_id: answer.questionId,
      selected_option_index: answer.selectedIndex,
      is_correct: answer.isCorrect,
    }))

    await supabase.from('quiz_answers').insert(answerRecords)

    return NextResponse.json({
      score,
      passed,
      scoreId: scoreRecord.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Usage Example in Components

### Fetching Courses

```typescript
'use client'

import { useEffect, useState } from 'react'

export function CoursesList() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/courses')
        const data = await response.json()
        setCourses(data)
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {courses.map((course: any) => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  )
}
```

### Submitting a Quiz

```typescript
const handleSubmitQuiz = async () => {
  const response = await fetch('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({
      lessonId: currentLessonId,
      answers: selectedAnswers,
      isFinalExam: false,
      timeTaken: Math.round((Date.now() - startTime) / 1000),
    }),
  })

  const result = await response.json()
  setScore(result.score)
  setPassed(result.passed)
}
```

## Environment Variables

Add these to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

## Testing Checklist

- [ ] Signup creates user and profile in database
- [ ] Login with valid credentials works
- [ ] Logout clears session
- [ ] Can fetch courses list
- [ ] Can enroll in a course
- [ ] Can mark lessons as complete
- [ ] Quiz results are saved correctly
- [ ] Final exam results trigger certificate eligibility
- [ ] RLS policies prevent unauthorized access

## Deployment

When deploying to production:

1. Set production environment variables in Vercel
2. Enable email confirmation in Supabase Auth
3. Set `emailRedirectTo` to production URL
4. Enable HTTPS-only cookies
5. Set up database backups in Supabase
6. Monitor Supabase usage and quotas

---

This integration covers authentication, data persistence, and the complete EdTech workflow. Adjust API routes and data structures based on your specific requirements.
