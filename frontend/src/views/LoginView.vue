<template>
    <div class="max-w-md mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Login</h1>

        <div class="card">
            <form @submit.prevent="handleSubmit">
                <div class="mb-4">
                    <label for="username" class="block text-gray-700 font-medium mb-2">Username</label>
                    <input id="username" v-model="username" type="text"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required>
                </div>

                <div class="mb-6">
                    <label for="password" class="block text-gray-700 font-medium mb-2">Password</label>
                    <input id="password" v-model="password" type="password"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required>
                </div>

                <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {{ error }}
                </div>

                <div class="flex justify-center">
                    <button type="submit" class="btn btn-primary w-full" :disabled="loading">
                        {{ loading ? 'Logging in...' : 'Login' }}
                    </button>
                </div>
            </form>

            <div class="mt-6 text-center">
                <p class="text-gray-600">For delegate access, please use your QR code</p>
                <router-link to="/delegate/auth" class="text-blue-600 hover:underline mt-2 inline-block">
                    Go to Delegate Access
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'

export default {
    name: 'LoginView',
    setup() {
        const router = useRouter()
        const username = ref('')
        const password = ref('')
        const error = ref('')
        const loading = ref(false)

        const handleSubmit = async () => {
            error.value = ''
            loading.value = true

            try {
                const response = await authService.login({
                    username: username.value,
                    password: password.value
                })

                // Store token and user data
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('user', JSON.stringify(response.data.user))

                // Redirect based on role
                if (response.data.user.role === 'admin') {
                    router.push('/admin')
                } else if (response.data.user.role === 'presidium') {
                    router.push('/presidium')
                } else {
                    router.push('/')
                }
            } catch (err) {
                console.error('Login error:', err)
                error.value = err.response?.data?.error || 'Login failed. Please try again.'
            } finally {
                loading.value = false
            }
        }

        return {
            username,
            password,
            error,
            loading,
            handleSubmit
        }
    }
}
</script>