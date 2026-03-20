// ─────────────────────────────────────────────────────────────────────────────
// AdminTrainees.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import {
  getAdminTrainees, getAdminTracks, createTrack, deleteTrack, addModule,
  deleteModule, addCourse, deleteCourse, getAdminQuizzes, createQuiz, deleteQuiz,
  getCertTemplates, createCertTemplate, deleteCertTemplate,
  getEmailTemplates, updateEmailTemplate, sendEmail,
  getReportsOverview, getTrackAnalytics, getEngagement, getRecentActivity,
} from '../../api'
import {
  Users, TrendingUp, BookOpen, UserCheck, Search, Plus, Trash2,
  ChevronDown, ChevronRight, Layers, X, Check, FileQuestion, Clock,
  Award, Mail, Edit2, Send, BarChart3, Download,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

function Spinner() { return <div className="loading-center"><div className="spinner" /></div> }
function Empty({ icon: Icon, text }) {
  return (
    <div className="empty-state">
      <Icon size={36} /><p>{text}</p>
    </div>
  )
}
function ProgressBar({ value, width = 80 }) {
  return (
    <div className="progress-wrap" style={{ width, height: 6 }}>
      <div className="progress-bar" style={{ width: `${value}%`, height: '100%' }} />
    </div>
  )
}

// ─── Trainees ────────────────────────────────────────────────────────────────
export function AdminTrainees() {
  const [trainees, setTrainees] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    getAdminTrainees().then(r => setTrainees(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = trainees.filter(t =>
    `${t.first_name} ${t.last_name} ${t.email} ${t.username}`.toLowerCase().includes(search.toLowerCase())
  )
  const avgProg  = trainees.length ? Math.round(trainees.reduce((s,t) => s + (t.progress||0), 0) / trainees.length) : 0
  const enrolled = trainees.filter(t => t.track).length

  return (
    <div className="page-body">
      <div className="section-header">
        <div>
          <div className="section-title">Trainees</div>
          <div className="section-sub">Manage and monitor trainee progress</div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Trainees',   value: trainees.length, icon: Users,      bg: 'var(--gold-light)',   color: 'var(--gold)' },
          { label: 'Enrolled',          value: enrolled,         icon: UserCheck,  bg: '#f0faf4',            color: 'var(--success)' },
          { label: 'Avg. Progress',     value: `${avgProg}%`,   icon: TrendingUp, bg: '#eff6ff',            color: 'var(--info)' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}><Icon size={18} style={{ color }} /></div>
            <div className="stat-val">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
        <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search trainees…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <Empty icon={Users} text={search ? 'No matching trainees' : 'No trainees yet'} />
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  {['Name', 'Email', 'Track', 'Progress', 'Quiz Avg', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.first_name} {t.last_name}</div>
                      <div className="text-xs text-muted">@{t.username}</div>
                    </td>
                    <td className="text-sm">{t.email}</td>
                    <td>
                      {t.track
                        ? <span className="flex-center gap-1 text-sm"><BookOpen size={13} style={{ color: 'var(--gold)' }} />{t.track}</span>
                        : <span className="text-xs" style={{ color: '#ccc' }}>Not enrolled</span>}
                    </td>
                    <td>
                      <div className="flex-center gap-2">
                        <ProgressBar value={t.progress || 0} />
                        <span className="text-xs text-muted">{t.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      {t.avg_quiz_score != null
                        ? <span style={{ fontWeight: 700, color: t.avg_quiz_score >= 70 ? 'var(--success)' : 'var(--danger)' }}>{t.avg_quiz_score}%</span>
                        : <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td><span className={`badge ${t.is_active ? 'badge-green' : 'badge-red'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tracks ───────────────────────────────────────────────────────────────────
export function AdminTracks() {
  const [tracks,   setTracks]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(new Set())

  const [showNewTrack,  setShowNewTrack]  = useState(false)
  const [newTrackName,  setNewTrackName]  = useState('')
  const [newTrackDesc,  setNewTrackDesc]  = useState('')
  const [savingTrack,   setSavingTrack]   = useState(false)

  const [newModTrack,   setNewModTrack]   = useState(null)
  const [newModTitle,   setNewModTitle]   = useState('')
  const [newCourseMod,  setNewCourseMod]  = useState(null)
  const [newCourse,     setNewCourse]     = useState({ title: '', source: '', duration_mins: '' })

  const load = () => {
    setLoading(true)
    getAdminTracks().then(r => setTracks(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleTrack = id => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleCreateTrack = async () => {
    if (!newTrackName.trim()) return
    setSavingTrack(true)
    try { await createTrack({ name: newTrackName, description: newTrackDesc }); load(); setShowNewTrack(false); setNewTrackName(''); setNewTrackDesc('') }
    finally { setSavingTrack(false) }
  }
  const handleDeleteTrack = async id => { if (confirm('Delete track?')) { await deleteTrack(id); load() } }
  const handleAddModule   = async tid => {
    if (!newModTitle.trim()) return
    await addModule(tid, { title: newModTitle }); load(); setNewModTitle(''); setNewModTrack(null)
  }
  const handleDeleteModule = async id => { if (confirm('Delete module?')) { await deleteModule(id); load() } }
  const handleAddCourse = async mid => {
    if (!newCourse.title.trim()) return
    await addCourse(mid, { title: newCourse.title, source: newCourse.source, duration_mins: newCourse.duration_mins ? Number(newCourse.duration_mins) : undefined })
    load(); setNewCourse({ title: '', source: '', duration_mins: '' }); setNewCourseMod(null)
  }
  const handleDeleteCourse = async id => { await deleteCourse(id); load() }

  return (
    <div className="page-body">
      <div className="section-header">
        <div>
          <div className="section-title">Tracks</div>
          <div className="section-sub">Manage leadership training tracks and curriculum</div>
        </div>
        <button className="btn btn-gold" onClick={() => setShowNewTrack(true)}><Plus size={15} />New Track</button>
      </div>

      {showNewTrack && (
        <div className="card" style={{ borderColor: 'var(--gold-border)', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>Create New Track</div>
          <div className="form-group">
            <input className="form-input" placeholder="Track name" value={newTrackName} onChange={e => setNewTrackName(e.target.value)} />
          </div>
          <div className="form-group">
            <input className="form-input" placeholder="Description (optional)" value={newTrackDesc} onChange={e => setNewTrackDesc(e.target.value)} />
          </div>
          <div className="flex-center gap-2">
            <button className="btn btn-gold btn-sm" onClick={handleCreateTrack} disabled={savingTrack || !newTrackName.trim()}>{savingTrack ? 'Creating…' : 'Create'}</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowNewTrack(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : tracks.length === 0 ? <div className="card"><Empty icon={BookOpen} text="No tracks yet" /></div> : (
        tracks.map(track => (
          <div className="track-card-admin" key={track.id}>
            <div className="track-card-header" onClick={() => toggleTrack(track.id)}>
              <div className="flex-center gap-2">
                {expanded.has(track.id) ? <ChevronDown size={16} style={{color:'#aaa'}} /> : <ChevronRight size={16} style={{color:'#aaa'}} />}
                <div>
                  <span style={{ fontWeight: 600 }}>{track.name}</span>
                  {track.description && <span className="text-xs text-muted" style={{ marginLeft: 8 }}>{track.description}</span>}
                </div>
              </div>
              <div className="flex-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="badge badge-gray">{track.modules?.length || 0} modules</span>
                <button className="btn btn-danger btn-icon" onClick={() => handleDeleteTrack(track.id)}><Trash2 size={13} /></button>
              </div>
            </div>

            {expanded.has(track.id) && (
              <div className="track-card-body">
                {track.modules?.map(mod => (
                  <div className="module-item" key={mod.id}>
                    <div className="module-item-header">
                      <div className="flex-center gap-2">
                        <Layers size={13} style={{ color: 'var(--gold)' }} />
                        <span className="text-sm" style={{ fontWeight: 500 }}>{mod.title}</span>
                        <span className="badge badge-gray">{mod.courses?.length || 0} courses</span>
                      </div>
                      <button className="btn btn-danger btn-icon" style={{ width: 24, height: 24 }} onClick={() => handleDeleteModule(mod.id)}><X size={12} /></button>
                    </div>

                    {mod.courses?.map(course => (
                      <div className="course-item" key={course.id}>
                        <div className="flex-center gap-2">
                          <BookOpen size={12} style={{ color: '#aaa' }} />
                          <span className="text-sm">{course.title}</span>
                          {course.source && <span className="badge badge-blue" style={{ fontSize: '.68rem' }}>{course.source}</span>}
                          {course.duration_mins && <span className="text-xs text-muted">{course.duration_mins}m</span>}
                        </div>
                        <button className="btn btn-danger btn-icon" style={{ width: 22, height: 22 }} onClick={() => handleDeleteCourse(course.id)}><X size={11} /></button>
                      </div>
                    ))}

                    {newCourseMod === mod.id ? (
                      <div className="inline-form" style={{ paddingLeft: 40, background: '#fff', borderTop: '1px solid #f5f5f3' }}>
                        <input className="form-input" placeholder="Course title" value={newCourse.title} onChange={e => setNewCourse(c=>({...c,title:e.target.value}))} style={{ flex: 1 }} />
                        <input className="form-input medium" placeholder="Platform" value={newCourse.source} onChange={e => setNewCourse(c=>({...c,source:e.target.value}))} />
                        <input className="form-input narrow" placeholder="Mins" type="number" value={newCourse.duration_mins} onChange={e => setNewCourse(c=>({...c,duration_mins:e.target.value}))} />
                        <button className="btn btn-gold btn-icon" onClick={() => handleAddCourse(mod.id)}><Check size={13} /></button>
                        <button className="btn btn-outline btn-icon" onClick={() => setNewCourseMod(null)}><X size={13} /></button>
                      </div>
                    ) : (
                      <div className="add-row" style={{ paddingLeft: 40, background: '#fafaf8', borderTop: '1px solid #f5f5f3' }}
                        onClick={() => setNewCourseMod(mod.id)}>
                        <Plus size={12} /> Add course
                      </div>
                    )}
                  </div>
                ))}

                {newModTrack === track.id ? (
                  <div className="inline-form">
                    <input className="form-input" placeholder="Module title" value={newModTitle} onChange={e => setNewModTitle(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-gold btn-sm" onClick={() => handleAddModule(track.id)}>Add</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setNewModTrack(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="add-row" onClick={() => setNewModTrack(track.id)}>
                    <Plus size={12} /> Add module
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [tracks,  setTracks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ module_id: '', title: '', duration_mins: '15', pass_percentage: '70' })

  const load = () => {
    setLoading(true)
    Promise.all([getAdminQuizzes(), getAdminTracks()]).then(([q, t]) => { setQuizzes(q.data); setTracks(t.data) }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const allModules = tracks.flatMap(t => (t.modules||[]).map(m => ({ id: m.id, label: `${t.name} → ${m.title}` })))

  const handleCreate = async () => {
    if (!form.title.trim() || !form.module_id) return
    await createQuiz({ module_id: Number(form.module_id), title: form.title, duration_mins: Number(form.duration_mins), pass_percentage: Number(form.pass_percentage) })
    load(); setShowForm(false); setForm({ module_id: '', title: '', duration_mins: '15', pass_percentage: '70' })
  }
  const handleDelete = async id => { if (confirm('Delete quiz?')) { await deleteQuiz(id); load() } }

  return (
    <div className="page-body">
      <div className="section-header">
        <div><div className="section-title">Quizzes</div><div className="section-sub">Manage module assessments</div></div>
        <button className="btn btn-gold" onClick={() => setShowForm(true)}><Plus size={15} />New Quiz</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--gold-border)', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>Create New Quiz</div>
          <div className="form-group">
            <label className="form-label">Module *</label>
            <select className="form-select" value={form.module_id} onChange={e => setForm(f=>({...f,module_id:e.target.value}))}>
              <option value="">Select module…</option>
              {allModules.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input className="form-input" placeholder="e.g. Module 1 Assessment" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Duration (mins)</label>
              <input className="form-input" type="number" value={form.duration_mins} onChange={e => setForm(f=>({...f,duration_mins:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Pass % </label>
              <input className="form-input" type="number" value={form.pass_percentage} min="1" max="100" onChange={e => setForm(f=>({...f,pass_percentage:e.target.value}))} />
            </div>
          </div>
          <div className="flex-center gap-2">
            <button className="btn btn-gold btn-sm" onClick={handleCreate}>Create Quiz</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : quizzes.length === 0 ? <div className="card"><Empty icon={FileQuestion} text="No quizzes yet" /></div> : (
        quizzes.map(q => (
          <div className="card flex-between mb-2" key={q.id} style={{ padding: '14px 18px' }}>
            <div className="flex-center gap-3">
              <div className="stat-icon" style={{ background: '#fffbeb', width: 36, height: 36, flexShrink: 0 }}>
                <FileQuestion size={16} style={{ color: '#b45309' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{q.title}</div>
                <div className="text-xs text-muted">{q.track_name}{q.module_title ? ` → ${q.module_title}` : ''}</div>
              </div>
            </div>
            <div className="flex-center gap-2">
              <span className="badge badge-gray"><Clock size={11} />{q.duration_mins}m</span>
              <span className="badge badge-amber">Pass: {q.pass_percentage}%</span>
              <button className="btn btn-danger btn-icon" onClick={() => handleDelete(q.id)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Certificates ─────────────────────────────────────────────────────────────
export function AdminCertificates() {
  const [templates, setTemplates] = useState([])
  const [tracks,    setTracks]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form, setForm] = useState({ name: '', track_id: '', template_type: 'standard', first_signature_name: 'Administrator Signature', second_signature_name: 'Chapter President' })

  const load = () => {
    setLoading(true)
    Promise.all([getCertTemplates(), getAdminTracks()]).then(([t, tr]) => { setTemplates(t.data); setTracks(tr.data) }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const getTrackName = id => id ? tracks.find(t => t.id === id)?.name || 'Unknown' : 'All Tracks'

  const handleCreate = async () => {
    if (!form.name.trim()) return
    await createCertTemplate({ name: form.name, track_id: form.track_id ? Number(form.track_id) : undefined, template_type: form.template_type })
    load(); setShowForm(false); setForm({ name: '', track_id: '', template_type: 'standard', first_signature_name: 'Administrator Signature', second_signature_name: 'Chapter President' })
  }
  const handleDelete = async id => { if (confirm('Delete template?')) { await deleteCertTemplate(id); load() } }

  return (
    <div className="page-body">
      <div className="section-header">
        <div><div className="section-title">Certificates</div><div className="section-sub">Manage completion certificate templates</div></div>
        <button className="btn btn-gold" onClick={() => setShowForm(true)}><Plus size={15} />New Template</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--gold-border)', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>New Certificate Template</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Template Name *</label>
              <input className="form-input" placeholder="Leadership Completion Certificate" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Track</label>
              <select className="form-select" value={form.track_id} onChange={e => setForm(f=>({...f,track_id:e.target.value}))}>
                <option value="">All Tracks</option>
                {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.template_type} onChange={e => setForm(f=>({...f,template_type:e.target.value}))}>
                <option value="standard">Standard</option>
                <option value="gold">Classic Gold</option>
                <option value="modern">Modern Black & Gold</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">First Signature</label>
              <input className="form-input" value={form.first_signature_name} onChange={e => setForm(f=>({...f,first_signature_name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Second Signature</label>
              <input className="form-input" value={form.second_signature_name} onChange={e => setForm(f=>({...f,second_signature_name:e.target.value}))} />
            </div>
          </div>
          <div className="flex-center gap-2">
            <button className="btn btn-gold btn-sm" onClick={handleCreate}>Create Template</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : templates.length === 0 ? <div className="card"><Empty icon={Award} text="No certificate templates yet" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {templates.map(t => (
            <div className="card" key={t.id}>
              <div className="flex-between mb-3">
                <div className="stat-icon" style={{ background: 'var(--gold-light)', width: 36, height: 36 }}>
                  <Award size={18} style={{ color: 'var(--gold)' }} />
                </div>
                <button className="btn btn-danger btn-icon" onClick={() => handleDelete(t.id)}><Trash2 size={13} /></button>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.name}</div>
              <div className="flex-center gap-1 flex-wrap">
                <span className="badge badge-gray">{getTrackName(t.track_id)}</span>
                <span className="badge badge-gold">{t.template_type}</span>
              </div>
              <div className="text-xs text-muted mt-3" style={{ lineHeight: 1.7 }}>
                Sig 1: {t.first_signature_name}<br />
                Sig 2: {t.second_signature_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Emails ───────────────────────────────────────────────────────────────────
export function AdminEmails() {
  const [templates, setTemplates] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [editId,    setEditId]    = useState(null)
  const [editForm,  setEditForm]  = useState({ subject: '', body_html: '' })
  const [sending,   setSending]   = useState(null)

  const load = () => { setLoading(true); getEmailTemplates().then(r => setTemplates(r.data)).finally(() => setLoading(false)) }
  useEffect(load, [])

  const startEdit = t => { setEditId(t.id); setEditForm({ subject: t.subject || '', body_html: t.body_html || '' }) }
  const handleSave = async id => { await updateEmailTemplate(id, editForm); setEditId(null); load() }
  const handleSend = async id => { setSending(id); try { await sendEmail(id) } finally { setSending(null) } }

  const typeColor = { welcome: 'badge-blue', completion: 'badge-green', reminder: 'badge-amber', reset: 'badge-gray' }

  return (
    <div className="page-body">
      <div className="section-header">
        <div><div className="section-title">Email Templates</div><div className="section-sub">Manage automated email communications</div></div>
      </div>

      {loading ? <Spinner /> : templates.length === 0 ? <div className="card"><Empty icon={Mail} text="No email templates configured" /></div> : (
        templates.map(t => (
          <div className="card mb-3" key={t.id}>
            <div className="flex-between mb-3">
              <div className="flex-center gap-3">
                <div className="stat-icon" style={{ background: 'var(--gold-light)', width: 36, height: 36, flexShrink: 0 }}>
                  <Mail size={16} style={{ color: 'var(--gold)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <span className={`badge ${typeColor[t.type] || 'badge-gray'}`} style={{ fontSize: '.68rem', marginTop: 3 }}>{t.type}</span>
                </div>
              </div>
              <div className="flex-center gap-2">
                {editId === t.id ? (
                  <>
                    <button className="btn btn-gold btn-sm" onClick={() => handleSave(t.id)}><Check size={13} />Save</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(t)}><Edit2 size={13} />Edit</button>
                    <button className="btn btn-gold btn-sm" onClick={() => handleSend(t.id)} disabled={sending === t.id}>
                      <Send size={13} />{sending === t.id ? 'Sending…' : 'Send'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {editId === t.id ? (
              <>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" placeholder="Email subject" value={editForm.subject} onChange={e => setEditForm(f=>({...f,subject:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Body (HTML)</label>
                  <textarea className="form-input" rows={6} placeholder="<p>Email body…</p>" value={editForm.body_html} onChange={e => setEditForm(f=>({...f,body_html:e.target.value}))} />
                </div>
              </>
            ) : (
              <div className="text-sm text-muted">
                {t.subject && <div><strong style={{ color: '#555' }}>Subject:</strong> {t.subject}</div>}
                {t.body_html && <div className="truncate">{t.body_html.replace(/<[^>]*>/g,' ').trim().slice(0,100)}…</div>}
                {!t.subject && !t.body_html && <em>No content yet. Click Edit to configure.</em>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────
const GOLD   = '#c6930a'
const COLORS = ['#c6930a','#2a7d4f','#1565c0','#9c27b0','#d4183d']

export function AdminReports() {
  const [overview,  setOverview]  = useState(null)
  const [analytics, setAnalytics] = useState([])
  const [engage,    setEngage]    = useState([])
  const [activity,  setActivity]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getReportsOverview(), getTrackAnalytics(), getEngagement(), getRecentActivity()])
      .then(([o, t, e, a]) => { setOverview(o.data); setAnalytics(t.data); setEngage(e.data); setActivity(a.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleExport = () => {
    if (!analytics.length) return
    const rows = [['Track','Enrolled','Avg Progress (%)','Completions'], ...analytics.map(t => [t.track_name||'N/A', t.enrolled||0, t.avg_progress||0, t.completions||0])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = `ncbw-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const statCards = overview ? [
    { label: 'Total Trainees',   value: overview.total_trainees||0,   icon: Users,      bg: 'var(--gold-light)', color: 'var(--gold)' },
    { label: 'Active This Month',value: overview.active_this_month||0, icon: TrendingUp, bg: '#f0faf4',          color: 'var(--success)' },
    { label: 'Tracks',           value: overview.total_tracks||0,      icon: BookOpen,   bg: '#eff6ff',          color: 'var(--info)' },
    { label: 'Completions',      value: overview.total_completions||0, icon: BarChart3,  bg: '#faf0ff',          color: '#9c27b0' },
  ] : []

  if (loading) return <div className="page-body"><Spinner /></div>

  return (
    <div className="page-body">
      <div className="section-header">
        <div><div className="section-title">Reports & Analytics</div><div className="section-sub">Training program performance overview</div></div>
        <button className="btn btn-gold" onClick={handleExport}><Download size={15} />Export CSV</button>
      </div>

      {statCards.length > 0 && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {statCards.map(({ label, value, icon: Icon, bg, color }) => (
            <div className="stat-card" key={label}>
              <div className="stat-icon" style={{ background: bg }}><Icon size={18} style={{ color }} /></div>
              <div className="stat-val">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="charts-grid">
        <div className="card">
          <div className="card-title mb-4">Enrollment by Track</div>
          {analytics.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="track_name" tick={{fontSize:11,fill:'#888'}} />
                <YAxis tick={{fontSize:11,fill:'#888'}} />
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}} />
                <Bar dataKey="enrolled" fill={GOLD} radius={[4,4,0,0]} name="Enrolled" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{height:200}}>No data yet</div>}
        </div>

        <div className="card">
          <div className="card-title mb-4">Avg Progress by Track (%)</div>
          {analytics.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="track_name" tick={{fontSize:11,fill:'#888'}} />
                <YAxis domain={[0,100]} tick={{fontSize:11,fill:'#888'}} />
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={v=>[`${v}%`,'Progress']} />
                <Bar dataKey="avg_progress" fill="#2a7d4f" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{height:200}}>No data yet</div>}
        </div>

        <div className="card">
          <div className="card-title mb-4">Engagement (30 days)</div>
          {engage.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={engage} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#888'}} />
                <YAxis tick={{fontSize:11,fill:'#888'}} />
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}} />
                <Line type="monotone" dataKey="active_users" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{height:200}}>No engagement data yet</div>}
        </div>

        <div className="card">
          <div className="card-title mb-4">Track Distribution</div>
          {analytics.filter(t=>(t.enrolled||0)>0).length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={analytics.filter(t=>(t.enrolled||0)>0)} dataKey="enrolled" nameKey="track_name"
                  cx="50%" cy="50%" outerRadius={75}
                  label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {analytics.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{height:200}}>No enrollment data yet</div>}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Recent Activity</div>
        {activity.length === 0
          ? <div className="empty-state" style={{ height: 80 }}>No recent activity</div>
          : activity.slice(0,10).map((a, i) => (
            <div key={i} className="flex-between" style={{ padding: '11px 20px', borderBottom: '1px solid #f8f8f6' }}>
              <div className="flex-center gap-3">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                <div>
                  <div className="text-sm">{a.description}</div>
                  {a.user && <div className="text-xs text-muted">{a.user}</div>}
                </div>
              </div>
              <span className="text-xs text-muted">
                {a.timestamp ? new Date(a.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
