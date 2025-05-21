import axios from 'axios'
import { toast } from 'vue3-toastify'

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: `${apiUrl}/api`,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Request interceptor for API calls
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// Response interceptor for API calls
api.interceptors.response.use(
    response => response,
    error => {
        const { status, data } = error.response || {}

        // Handle 401 Unauthorized
        if (status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (window.location.pathname !== '/login' && window.location.pathname !== '/delegate/auth') {
                window.location.href = '/login'
            }
        }

        // Show error toast
        toast.error(data?.error || 'An error occurred')

        return Promise.reject(error)
    }
)

// Auth services
export const authService = {
    // Regular authentication endpoints
    login: credentials => {
        // Check if this is a token-based authentication
        if (credentials.tokenAuth) {
            // For admin/presidium token authentication
            return api.post('/auth/token-login', { token: credentials.token });
        }
        // Regular username/password login
        return api.post('/auth/login', credentials);
    },

    // Delegate authentication using token
    delegateAuth: token => api.post('/auth/delegate', { token }),

    // Logout endpoint
    logout: () => api.post('/auth/logout'),

    // Generate token for QR code
    generateToken: username => api.get(`/auth/token/${username}`),
}

// Events services
export const eventsService = {
    getAll: filters => api.get('/events', { params: filters }),
    getById: id => api.get(`/events/${id}`),
    create: data => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: id => api.delete(`/events/${id}`)
}

// Committees services
export const committeesService = {
    getAll: () => api.get('/committees'),
    getForEvent: eventId => api.get(`/committees/event/${eventId}`),
    getById: id => api.get(`/committees/${id}`),
    getMyCommittee: () => api.get('/committees/me'),  // New endpoint for presidium's assigned committee
    create: data => api.post('/committees', data),
    update: (id, data) => api.put(`/committees/${id}`, data),
    delete: id => api.delete(`/committees/${id}`),
    getStatus: id => api.get(`/committees/${id}/status`),
    generateQRCodes: id => api.get(`/committees/${id}/qrcodes`, { responseType: 'blob' }),
    assignPresidium: (id, data) => api.post(`/committees/${id}/presidium`, data),
    removePresidium: (id, username) => api.delete(`/committees/${id}/presidium/${username}`),
    getPresidiumMembers: id => api.get(`/committees/${id}/presidium`)
}

// Sessions services
export const sessionsService = {
    getForCommittee: committeeId => api.get(`/sessions/committee/${committeeId}`),
    getById: id => api.get(`/sessions/${id}`),
    create: (committeeId, data) => api.post(`/sessions/committees/${committeeId}/sessions`, data),
    updateMode: (id, mode) => api.put(`/sessions/${id}/mode`, { mode }),
    updateRollCall: (id, presentCountries) => api.put(`/sessions/${id}/roll-call`, { presentCountries }),
    complete: id => api.put(`/sessions/${id}/complete`)
}

// Resolutions services
export const resolutionsService = {
    getForCommittee: committeeId => api.get(`/resolutions/committees/${committeeId}/resolutions`),
    getById: id => api.get(`/resolutions/${id}`),
    create: data => api.post('/resolutions', data),
    review: (id, data) => api.put(`/resolutions/${id}/review`, data),
    setAsWorkingDraft: id => api.put(`/resolutions/${id}/working`),
    confirmCoAuthor: id => api.put(`/resolutions/${id}/co-author`),
    getDelegateResolutions: committeeId => api.get(`/resolutions/committees/${committeeId}/delegate-resolutions`),
    rejectCoAuthor: id => api.put(`/resolutions/${id}/reject-co-author`),
}

// Amendments services
export const amendmentsService = {
    getForResolution: resolutionId => api.get(`/resolutions/${resolutionId}/amendments`),
    getById: id => api.get(`/amendments/${id}`),
    create: data => api.post('/amendments', data),
    review: (id, data) => api.put(`/amendments/${id}/review`, data)
}

// Votings services
export const votingsService = {
    getById: id => api.get(`/votings/${id}`),
    create: data => api.post('/votings', data),
    submitVote: (id, vote) => api.post(`/votings/${id}/vote`, { vote }),
    finalize: id => api.put(`/votings/${id}/finalize`),
    recordVote: (votingId, countryName, vote) => api.post(`/votings/${votingId}/record-vote`, { countryName, vote }),
}

// Statistics services
export const statisticsService = {
    recordActivity: data => api.post('/statistics/activities', data),
    getCommitteeStatistics: committeeId => api.get(`/statistics/committees/${committeeId}/statistics`),
    getDelegateStatistics: (committeeId, countryName) => api.get(`/statistics/committees/${committeeId}/delegates/${countryName}/statistics`),
    getCommitteeSummary: committeeId => api.get(`/statistics/committees/${committeeId}/summary`),
    exportStatistics: committeeId => api.get(`/statistics/committees/${committeeId}/export`, { responseType: 'blob' })
}

export const countriesService = {
    getAll: () => api.get('/countries'),
    getByCode: (code) => api.get(`/countries/${code}`),
    search: (query, language) => api.get('/countries/search', { params: { query, language } })
}

// WebSocket service
export const createWebSocket = committeeId => {
    const token = localStorage.getItem('token')
    if (!token) return null

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/committees/${committeeId}?token=${token}`)

    return ws
}