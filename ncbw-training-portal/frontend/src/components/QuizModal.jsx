import { useState } from 'react'
import { submitQuiz } from '../api'
import { CheckCircle2, XCircle, Clock, ChevronRight, ChevronLeft, X } from 'lucide-react'

export default function QuizModal({ quiz, onClose, onPassed }) {
  const [answers,   setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [currentQ,  setCurrentQ]  = useState(0)
  const [err,       setErr]       = useState(null)

  if (!quiz) return null

  const questions = quiz.questions || []
  const total     = questions.length
  const answered  = Object.keys(answers).length
  const pct       = total > 0 ? Math.round((answered / total) * 100) : 0
  const currentQuestion = questions[currentQ]

  const handleSelect = (qId, optId) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qId]: optId }))
  }

  const handleSubmit = async () => {
    if (answered < total) { setErr(`Please answer all ${total} questions.`); return }
    setLoading(true); setErr(null)
    try {
      const res = await submitQuiz(quiz.id, answers)
      const { score, passed } = res.data
      setResult({ score, passed })
      setSubmitted(true)
      if (passed) onPassed()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to submit quiz')
    } finally { setLoading(false) }
  }

  const handleClose = () => {
    setAnswers({}); setSubmitted(false); setResult(null)
    setCurrentQ(0); setErr(null); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <div className="modal-title">{quiz.title}</div>
            <div className="flex-center gap-2 mt-1">
              <span className="badge badge-gold"><Clock size={11} /> {quiz.duration_mins} min</span>
              <span className="badge badge-gray">Pass: {quiz.pass_percentage}%</span>
              <span className="badge badge-gray">{total} questions</span>
            </div>
            {!submitted && (
              <div style={{ marginTop: 10 }}>
                <div className="flex-between mb-1">
                  <span className="text-xs text-muted">{answered} of {total} answered</span>
                  <span className="text-xs text-muted">Q {currentQ + 1} / {total}</span>
                </div>
                <div className="progress-wrap" style={{ height: 5 }}>
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
          <button className="modal-close" onClick={handleClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Result */}
          {submitted && result && (
            <div className="text-center" style={{ padding: '20px 0' }}>
              {result.passed
                ? <CheckCircle2 size={56} style={{ color: '#2a7d4f', margin: '0 auto 12px', display: 'block' }} />
                : <XCircle     size={56} style={{ color: '#d4183d', margin: '0 auto 12px', display: 'block' }} />}
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
                {result.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 8 }}>
                {result.score}%
              </div>
              <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
                {result.passed
                  ? 'Congratulations! The next module is now unlocked.'
                  : `You need ${quiz.pass_percentage}% to pass. Review and try again.`}
              </p>
              <button className="btn btn-gold" onClick={handleClose}>Close</button>
            </div>
          )}

          {/* Question */}
          {!submitted && currentQuestion && (
            <>
              {err && <div className="alert alert-error mb-2">{err}</div>}
              <p className="text-xs text-muted mb-2">Question {currentQ + 1}</p>
              <p style={{ fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>
                {currentQuestion.question_text}
              </p>
              {currentQuestion.options.map(opt => (
                <button
                  key={opt.id}
                  className={`quiz-option${answers[currentQuestion.id] === opt.id ? ' selected' : ''}`}
                  onClick={() => handleSelect(currentQuestion.id, opt.id)}
                >
                  {opt.option_text}
                </button>
              ))}

              {/* Nav dots */}
              <div className="quiz-dots mt-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    className={`quiz-dot ${i === currentQ ? 'current' : answers[questions[i].id] ? 'answered' : 'unanswered'}`}
                    onClick={() => setCurrentQ(i)}
                  >{i + 1}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer nav */}
        {!submitted && (
          <div className="modal-footer">
            <button className="btn btn-outline btn-sm"
              onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0}>
              <ChevronLeft size={15} /> Prev
            </button>
            {currentQ < total - 1 ? (
              <button className="btn btn-gold btn-sm"
                onClick={() => setCurrentQ(q => q + 1)}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button className="btn btn-gold btn-sm"
                onClick={handleSubmit}
                disabled={loading || answered < total}>
                {loading ? 'Submitting…' : 'Submit Quiz'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
