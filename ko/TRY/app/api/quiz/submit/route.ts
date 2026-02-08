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