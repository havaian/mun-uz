import axios from 'axios'

// Create axios instance
const api = axios.create({
    baseURL: '/api',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Add request interceptor for authentication
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        const { status } = error.response || {}

        // If token is invalid, redirect to login
        if (status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (window.location.pathname !== '/login' && window.location.pathname !== '/delegate/auth') {
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

// Auth service
export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    delegateAuth: (token) => api.post('/auth/delegate', { token }),
    logout: () => api.post('/auth/logout')
}

// Events service
export const eventsService = {
    getAll: (filter) => api.get('/events', { params: filter }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`)
}

// Committees service
export const committeesService = {
    getAll: () => api.get('/committees'),
    getForEvent: (eventId) => api.get(`/committees/event/${eventId}`),
    getById: (id) => api.get(`/committees/${id}`),
    create: (data) => api.post('/committees', data),
    update: (id, data) => api.put(`/committees/${id}`, data),
    delete: (id) => api.delete(`/committees/${id}`),
    getStatus: (id) => api.get(`/committees/${id}/status`),
    generateQRCodes: (id) => api.get(`/committees/${id}/qrcodes`, { responseType: 'blob' }),
    assignPresidium: (id, data) => api.post(`/committees/${id}/presidium`, data),
    removePresidium: (id, username) => api.delete(`/committees/${id}/presidium/${username}`)
}

// Sessions service
export const sessionsService = {
    getForCommittee: (committeeId) => api.get(`/sessions/committee/${committeeId}`),
    getById: (id) => api.get(`/sessions/${id}`),
    create: (committeeId, data) => api.post(`/committees/${committeeId}/sessions`, data),
    updateMode: (id, mode) => api.put(`/sessions/${id}/mode`, { mode }),
    updateRollCall: (id, presentCountries) => api.put(`/sessions/${id}/roll-call`, { presentCountries }),
    complete: (id) => api.put(`/sessions/${id}/complete`)
}

// Resolutions service
export const resolutionsService = {
    getForCommittee: (committeeId) => api.get(`/committees/${committeeId}/resolutions`),
    getById: (id) => api.get(`/resolutions/${id}`),
    create: (data) => api.post('/resolutions', data),
    review: (id, data) => api.put(`/resolutions/${id}/review`, data),
    setAsWorkingDraft: (id) => api.put(`/resolutions/${id}/working`),
    confirmCoAuthor: (id) => api.put(`/resolutions/${id}/co-author`)
}

// Amendments service
export const amendmentsService = {
    getForResolution: (resolutionId) => api.get(`/resolutions/${resolutionId}/amendments`),
    getById: (id) => api.get(`/amendments/${id}`),
    create: (data) => api.post('/amendments', data),
    review: (id, data) => api.put(`/amendments/${id}/review`, data)
}

// Votings service
export const votingsService = {
    getById: (id) => api.get(`/votings/${id}`),
    create: (data) => api.post('/votings', data),
    submitVote: (id, vote) => api.post(`/votings/${id}/vote`, { vote }),
    finalize: (id) => api.put(`/votings/${id}/finalize`)
}

// Statistics service
export const statisticsService = {
    recordActivity: (data) => api.post('/statistics/activities', data),
    getCommitteeStatistics: (committeeId) => api.get(`/statistics/committees/${committeeId}/statistics`),
    getDelegateStatistics: (committeeId, countryName) => api.get(`/statistics/committees/${committeeId}/delegates/${countryName}/statistics`),
    getCommitteeSummary: (committeeId) => api.get(`/statistics/committees/${committeeId}/summary`),
    exportStatistics: (committeeId) => api.get(`/statistics/committees/${committeeId}/export`, { responseType: 'blob' })
}

// Countries service
export const countriesService = {
    getAll: () => api.get('/countries'),
    getByCode: (code) => api.get(`/countries/${code}`),
    search: (query, language) => api.get('/countries/search', { params: { query, language } })
}

// WebSocket service
export const createWebSocket = (committeeId) => {
    const token = localStorage.getItem('token')
    if (!token) return null

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/committees/${committeeId}?token=${token}`)

    return ws
}