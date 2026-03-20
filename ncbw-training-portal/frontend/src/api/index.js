import api from './client'

// Auth
export const login          = (data) => api.post('/auth/login', data)
export const register       = (data) => api.post('/auth/register', data)
export const getMe          = ()     => api.get('/auth/me')
export const changePassword = (data) => api.put('/auth/change-password', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword  = (data) => api.post('/auth/reset-password', data)

// Tracks
export const getTracks      = ()     => api.get('/tracks/')
export const getTrack       = (id)   => api.get(`/tracks/${id}`)
export const enrollInTrack  = (id)   => api.post(`/tracks/${id}/enroll`)
export const completeCourse = (id)   => api.post(`/tracks/courses/${id}/complete`)
export const getTrackProgress = (id) => api.get(`/tracks/progress/${id}`)

// Quizzes
export const getQuiz        = (id)          => api.get(`/quizzes/${id}`)
export const submitQuiz     = (id, answers) => api.post(`/quizzes/${id}/submit`, { answers })
export const getQuizAttempts= (id)          => api.get(`/quizzes/${id}/attempts`)

// Admin – Trainees
export const getAdminTrainees = ()   => api.get('/admin/trainees')
export const getAdminTrainee  = (id) => api.get(`/admin/trainees/${id}`)

// Admin – Tracks
export const getAdminTracks = ()         => api.get('/admin/tracks')
export const createTrack    = (data)     => api.post('/admin/tracks', data)
export const updateTrack    = (id, data) => api.put(`/admin/tracks/${id}`, data)
export const deleteTrack    = (id)       => api.delete(`/admin/tracks/${id}`)
export const addModule      = (tid, data)=> api.post(`/admin/tracks/${tid}/modules`, data)
export const updateModule   = (id, data) => api.put(`/admin/modules/${id}`, data)
export const deleteModule   = (id)       => api.delete(`/admin/modules/${id}`)
export const addCourse      = (mid, data)=> api.post(`/admin/modules/${mid}/courses`, data)
export const deleteCourse   = (id)       => api.delete(`/admin/courses/${id}`)

// Admin – Quizzes
export const getAdminQuizzes = ()       => api.get('/admin/quizzes')
export const createQuiz      = (data)   => api.post('/admin/quizzes', data)
export const deleteQuiz      = (id)     => api.delete(`/admin/quizzes/${id}`)

// Admin – Certificates
export const getCertTemplates    = ()         => api.get('/admin/certificate-templates')
export const createCertTemplate  = (data)     => api.post('/admin/certificate-templates', data)
export const updateCertTemplate  = (id, data) => api.put(`/admin/certificate-templates/${id}`, data)
export const deleteCertTemplate  = (id)       => api.delete(`/admin/certificate-templates/${id}`)

// Admin – Emails
export const getEmailTemplates   = ()         => api.get('/admin/email-templates')
export const updateEmailTemplate = (id, data) => api.put(`/admin/email-templates/${id}`, data)
export const sendEmail           = (id)       => api.post(`/admin/email-templates/${id}/send`)

// Reports
export const getReportsOverview = () => api.get('/reports/overview')
export const getTrackAnalytics  = () => api.get('/reports/track-analytics')
export const getEngagement      = () => api.get('/reports/engagement')
export const getRecentActivity  = () => api.get('/reports/recent-activity')
