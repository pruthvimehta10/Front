'use client'

import { useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Navbar } from '@/components/navbar'

// Mock exam questions
const examQuestions = [
  {
    id: '1',
    question: 'What is the primary purpose of responsive web design?',
    options: [
      'To make websites look good on all devices',
      'To reduce file sizes',
      'To improve SEO rankings',
      'To increase server capacity',
    ],
    correctAnswer: 0,
  },
  {
    id: '2',
    question: 'Which CSS property controls text spacing?',
    options: ['margin', 'padding', 'letter-spacing', 'line-height'],
    correctAnswer: 2,
  },
  {
    id: '3',
    question: 'What does REST stand for?',
    options: [
      'Representational State Transfer',
      'Remote Endpoint Service Token',
      'Reliable Energy Storage Technology',
      'Response Event Server Token',
    ],
    correctAnswer: 0,
  },
  {
    id: '4',
    question: 'In JavaScript, what is a closure?',
    options: [
      'A function that closes a variable',
      'A function that has access to variables from another function scope',
      'A way to end a program',
      'A method to clear memory',
    ],
    correctAnswer: 1,
  },
  {
    id: '5',
    question: 'What is the difference between const and let?',
    options: [
      'No difference',
      'const creates constants, let creates variables',
      'let has block scope, const has function scope',
      'const cannot be reassigned, let can be reassigned',
    ],
    correctAnswer: 3,
  },
]

interface ExamState {
  status: 'intro' | 'taking' | 'results'
  currentQuestion: number
  selectedAnswers: number[]
  score: number
  startTime: number
  endTime: number | null
}

export default function ExamPage({ params }: { params: { id: string } }) {
  const [examState, setExamState] = useState<ExamState>({
    status: 'intro',
    currentQuestion: 0,
    selectedAnswers: [],
    score: 0,
    startTime: 0,
    endTime: null,
  })

  const handleStartExam = () => {
    setExamState({
      ...examState,
      status: 'taking',
      startTime: Date.now(),
      selectedAnswers: new Array(examQuestions.length).fill(-1),
    })
  }

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...examState.selectedAnswers]
    newAnswers[examState.currentQuestion] = optionIndex
    setExamState({
      ...examState,
      selectedAnswers: newAnswers,
    })
  }

  const handleNext = () => {
    if (examState.currentQuestion < examQuestions.length - 1) {
      setExamState({
        ...examState,
        currentQuestion: examState.currentQuestion + 1,
      })
    }
  }

  const handlePrevious = () => {
    if (examState.currentQuestion > 0) {
      setExamState({
        ...examState,
        currentQuestion: examState.currentQuestion - 1,
      })
    }
  }

  const handleSubmitExam = () => {
    let correctCount = 0
    examQuestions.forEach((q, index) => {
      if (examState.selectedAnswers[index] === q.correctAnswer) {
        correctCount++
      }
    })
    const finalScore = Math.round((correctCount / examQuestions.length) * 100)

    setExamState({
      ...examState,
      status: 'results',
      score: finalScore,
      endTime: Date.now(),
    })
  }

  const question = examQuestions[examState.currentQuestion]
  const isPassed = examState.score >= 70

  // Intro Screen
  if (examState.status === 'intro') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Final Exam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-secondary/50 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Exam Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <span>This exam is only available after completing all lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Estimated time: 15-20 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Passing score: 70%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">About this Exam</h3>
                <p className="text-foreground/80">
                  This comprehensive final exam covers all the material from the course. You will be
                  asked {examQuestions.length} questions testing your knowledge of the concepts
                  learned throughout the course.
                </p>
                <p className="text-foreground/80 mt-4">
                  You must score at least 70% to pass and receive your certificate of completion.
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Once you start the exam, you cannot pause it. Make sure you have a quiet,
                  uninterrupted environment.
                </p>
              </div>

              <Button onClick={handleStartExam} size="lg" className="w-full">
                Start Exam
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Taking Exam Screen
  if (examState.status === 'taking') {
    const answeredCount = examState.selectedAnswers.filter((a) => a !== -1).length

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Question {examState.currentQuestion + 1}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {answeredCount} of {examQuestions.length} answered
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {examState.currentQuestion + 1}/{examQuestions.length}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${((examState.currentQuestion + 1) / examQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 py-6">
              {/* Question */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">{question.question}</h3>

                {/* Options */}
                <RadioGroup
                  value={
                    examState.selectedAnswers[examState.currentQuestion]?.toString() ?? ''
                  }
                  onValueChange={(value) => handleSelectAnswer(parseInt(value))}
                >
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handlePrevious} disabled={examState.currentQuestion === 0}>
                  Previous
                </Button>

                {examState.currentQuestion === examQuestions.length - 1 ? (
                  <Button
                    onClick={handleSubmitExam}
                    disabled={examState.selectedAnswers.some((a) => a === -1)}
                    className="flex-1"
                  >
                    Submit Exam
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="flex-1">
                    Next Question
                  </Button>
                )}
              </div>

              {examState.selectedAnswers.some((a) => a === -1) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please answer all questions before submitting the exam.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Results Screen
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Exam Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {isPassed ? (
                  <CheckCircle className="h-20 w-20 text-green-600" />
                ) : (
                  <AlertCircle className="h-20 w-20 text-amber-600" />
                )}
              </div>
              <div>
                <h2 className="text-5xl font-bold text-primary">{examState.score}%</h2>
                <p className="text-xl text-foreground mt-2">
                  {isPassed ? '🎉 Congratulations! You passed the exam!' : 'You can retake the exam'}
                </p>
              </div>
            </div>

            {/* Score Breakdown */}
            <Card className="bg-secondary/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round((examState.score / 100) * examQuestions.length)}/
                      {examQuestions.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Passing Score</p>
                    <p className="text-2xl font-bold">70%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isPassed && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  You have successfully completed this course! Your certificate is ready to download.
                </AlertDescription>
              </Alert>
            )}

            {!isPassed && (
              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 dark:text-amber-100">
                  You need a score of 70% to pass. Review the course material and retake the exam.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent">
                Review Answers
              </Button>
              {isPassed ? (
                <Button className="flex-1">Download Certificate</Button>
              ) : (
                <Button className="flex-1">Retake Exam</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
