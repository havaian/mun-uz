<template>
    <header class="bg-white shadow">
        <nav class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <router-link to="/" class="flex items-center">
                <span class="text-xl font-bold text-blue-600">MUN.UZ</span>
            </router-link>

            <div v-if="isLoggedIn" class="flex items-center space-x-4">
                <span class="text-gray-700">{{ userInfo }}</span>
                <button @click="logout" class="btn btn-secondary text-sm">
                    Logout
                </button>
            </div>

            <div v-else>
                <router-link to="/login" class="btn btn-primary">Login</router-link>
            </div>
        </nav>
    </header>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'

export default {
    name: 'AppHeader',
    setup() {
        const router = useRouter()

        // Check if user is logged in
        const isLoggedIn = computed(() => {
            return !!localStorage.getItem('token')
        })

        // Get user info for display
        const userInfo = computed(() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if (user.role === 'delegate') {
                return `${user.countryName} Delegate`
            } else if (user.role) {
                return `${user.username} (${user.role})`
            }
            return ''
        })

        // Logout handler
        const logout = async () => {
            try {
                await authService.logout()
            } catch (error) {
                console.error('Logout error:', error)
            } finally {
                // Clear local storage
                localStorage.removeItem('token')
                localStorage.removeItem('user')

                // Redirect to login
                router.push('/login')
            }
        }

        return {
            isLoggedIn,
            userInfo,
            logout
        }
    }
}
</script>