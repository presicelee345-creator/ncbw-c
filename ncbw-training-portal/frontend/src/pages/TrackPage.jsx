import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import QuizModal from '../components/QuizModal'
import { getTracks, getTrack, enrollInTrack, completeCourse, getQuiz } from '../api'
import {
  CheckCircle2, Circle, Clock, BookOpen, FileQuestion, Lock,
  ChevronDown, ChevronUp, Award
} from 'lucide-react'

function ProgressBar({ value, width = 100, height = 6 }) {
  return (
    <div className="progress-wrap" style={{ width, height }}>
      <div className="progress-bar" style={{ width: `${value}%`, height: '100%' }} />
    </div>
  )
}

export default function TrackPage() {
  const { trackId } = useParams()
  const [tracks,     setTracks]     = useState([])
  const [enrolledIds,setEnrolledIds] = useState([])
  const [track,      setTrack]      = useState(null)
  const [quiz,       setQuiz]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [enrolling,  setEnrolling]  = useState(false)
  const [expanded,   setExpanded]   = useState(new Set())
  const [err,        setErr]        = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [allRes, trackRes] = await Promise.all([getTracks(), getTrack(trackId)])
      const all = allRes.data
      setTracks(all)
      setEnrolledIds(all.filter(t => t.enrolled).map(t => t.id))
      setTrack(trackRes.data)
      const moduleCount = trackRes.data.modules?.length || 0
      setExpanded(new Set(Array.from({ length: moduleCount }, (_, i) => i)))
    } catch { setErr('Failed to load track') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (trackId) loadData() }, [trackId])

  const handleEnroll = async () => {
    setEnrolling(true)
    try { await enrollInTrack(trackId); await loadData() }
    catch { setErr('Enrollment failed') }
    finally { setEnrolling(false) }
  }

  const handleComplete = async courseId => {
    try { await completeCourse(courseId); await loadData() }
    catch { setErr('Failed to mark complete') }
  }

  const handleOpenQuiz = async quizId => {
    try { const res = await getQuiz(quizId); setQuiz(res.data) }
    catch { setErr('Failed to load quiz') }
  }

  const toggleModule = idx => {
    setExpanded(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }

  const getModulePct = mod => {
    if (!mod.courses?.length) return 0
    return Math.round(mod.courses.filter(c => c.completed).length / mod.courses.length * 100)
  }

  const enrolled = track ? enrolledIds.includes(track.id) || track.enrolled : false
  const overallPct = track?.progress ?? 0

  if (loading) return (
    <div className="app-layout">
      <Sidebar tracks={tracks} enrolledTrackIds={enrolledIds} />
      <div className="main-content">
        <div className="loading-center"><div className="spinner" /><span className="text-muted text-sm">Loading track…</span></div>
      </div>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar tracks={tracks} enrolledTrackIds={enrolledIds} />
      <div className="main-content">
        <div className="top-bar">
          <div className="flex-between">
            <div>
              <div className="top-bar-title">Training Curriculum</div>
              <div className="top-bar-sub">Leadership Development Program</div>
            </div>
            {enrolled && overallPct > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-muted mb-1">Overall Progress</div>
                <div className="flex-center gap-2">
                  <ProgressBar value={overallPct} width={120} />
                  <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '.85rem' }}>{overallPct}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="page-body">
          {err && <div className="alert alert-error mb-4">{err}</div>}
          {!track ? (
            <div className="empty-state"><p>Track not found.</p></div>
          ) : (
            <div style={{ maxWidth: 860 }}>
              {/* Track header */}
              <div className="flex-between mb-6">
                <div>
                  <h2 className="page-title">{track.name}</h2>
                  {track.description && <p className="text-sm text-muted mt-1">{track.description}</p>}
                  <div className="flex-center gap-2 mt-2">
                    <span className={`badge ${enrolled ? 'badge-green' : 'badge-gray'}`}>
                      {enrolled ? <><CheckCircle2 size={11} /> Enrolled</> : 'Not Enrolled'}
                    </span>
                    <span className="badge badge-gray"><BookOpen size={11} /> {track.modules?.length || 0} modules</span>
                  </div>
                </div>
                {!enrolled && (
                  <button className="btn btn-gold" onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? 'Enrolling…' : 'Enroll in Track'}
                  </button>
                )}
              </div>

              {/* Modules */}
              {!track.modules?.length ? (
                <div className="empty-state card">
                  <BookOpen size={36} /><p>No modules yet.</p>
                </div>
              ) : track.modules.map((mod, idx) => {
                const pct       = getModulePct(mod)
                const isExpanded = expanded.has(idx)
                const isDone     = pct === 100

                return (
                  <div className="module-card" key={mod.id}>
                    <div className="module-header" onClick={() => toggleModule(idx)}>
                      <div className="flex-center gap-3">
                        <div className={`module-num ${isDone ? 'done' : pct > 0 ? 'in-prog' : 'not-start'}`}>
                          {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <div>
                          <div className="module-title">{mod.title}</div>
                          {mod.description && <div className="module-desc">{mod.description}</div>}
                        </div>
                      </div>
                      <div className="flex-center gap-3">
                        {enrolled && mod.courses?.length > 0 && (
                          <div className="flex-center gap-2">
                            <ProgressBar value={pct} width={80} />
                            <span className="text-xs text-muted">{pct}%</span>
                          </div>
                        )}
                        {isExpanded ? <ChevronUp size={16} style={{ color: '#aaa' }} /> : <ChevronDown size={16} style={{ color: '#aaa' }} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="module-body">
                        {mod.courses?.map((course, ci) => (
                          <div className={`course-row${course.completed ? ' course-done' : ''}`} key={course.id}>
                            <div className="flex-center gap-3">
                              {course.completed
                                ? <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                : <Circle       size={16} style={{ color: '#ccc', flexShrink: 0 }} />}
                              <div>
                                <div className="course-name">{course.title}</div>
                                <div className="course-meta">
                                  {course.source && <span className="badge badge-blue" style={{ fontSize: '.7rem' }}>{course.source}</span>}
                                  {course.duration_mins && <span><Clock size={11} /> {course.duration_mins} min</span>}
                                </div>
                              </div>
                            </div>
                            {enrolled && !course.completed && (
                              <button className="btn btn-gold btn-sm" onClick={() => handleComplete(course.id)}>
                                Mark Complete
                              </button>
                            )}
                            {course.completed && <span className="badge badge-green">Done</span>}
                          </div>
                        ))}

                        {mod.quizzes?.map(q => (
                          <div className="quiz-row" key={q.id}>
                            <div className="flex-center gap-3">
                              {q.passed
                                ? <Award         size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                                : <FileQuestion  size={16} style={{ color: '#b45309', flexShrink: 0 }} />}
                              <div>
                                <div className="quiz-name">{q.title}</div>
                                <div className="course-meta">
                                  <span className="badge badge-amber">Pass: {q.pass_percentage}%</span>
                                  <span><Clock size={11} /> {q.duration_mins} min</span>
                                </div>
                              </div>
                            </div>
                            {enrolled && (
                              q.passed
                                ? <span className="badge badge-green">Passed</span>
                                : <button className="btn btn-sm" style={{ background: '#b45309', color: '#fff' }} onClick={() => handleOpenQuiz(q.id)}>Take Quiz</button>
                            )}
                            {!enrolled && <Lock size={15} style={{ color: '#ccc' }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <QuizModal quiz={quiz} onClose={() => setQuiz(null)} onPassed={loadData} />
    </div>
  )
}
