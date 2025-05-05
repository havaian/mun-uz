import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/api'
import { toast } from 'vue3-toastify'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null)
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

    const isAuthenticated = computed(() => !!token.value)

    const getDefaultRoute = computed(() => {
        switch (user.value?.role) {
            case 'admin':
                return '/admin'
            case 'presidium':
                return '/presidium'
            case 'delegate':
                return '/delegate'
            default:
                return '/login'
        }
    })

    async function login(credentials) {
        try {
            const response = await authService.login(credentials)
            setAuthData(response.data)
            return response.data
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed')
            throw error
        }
    }

    async function delegateAuth(token) {
        try {
            const response = await authService.delegateAuth(token)
            setAuthData(response.data)
            return response.data
        } catch (error) {
            toast.error(error.response?.data?.error || 'Authentication failed')
            throw error
        }
    }

    async function logout() {
        try {
            await authService.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            clearAuthData()
        }
    }

    function setAuthData(data) {
        token.value = data.token
        user.value = data.user
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
    }

    function clearAuthData() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return {
        token,
        user,
        isAuthenticated,
        getDefaultRoute,
        login,
        delegateAuth,
        logout
    }
})