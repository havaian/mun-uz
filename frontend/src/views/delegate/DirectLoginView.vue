<template>
    <div
        class="min-h-[calc(100vh-12rem)] bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
            <div class="text-center">
                <img src="/un-logo.png" alt="UN Logo" class="mx-auto h-12 w-auto" />
                <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Delegate Authentication
                </h2>
            </div>

            <div class="mt-8">
                <div class="text-center space-y-6">
                    <div v-if="error" class="rounded-md bg-red-50 p-4">
                        <div class="flex">
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
                            </div>
                        </div>
                    </div>

                    <div v-if="loading" class="flex justify-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>

                    <div v-else class="text-gray-600">
                        <p v-if="success">
                            Login successful! Redirecting to dashboard...
                        </p>
                        <p v-else>
                            Authenticating with token...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { toast } from 'vue3-toastify'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const success = ref(false)

onMounted(async () => {
    // Get token from the URL query parameter
    const token = route.query.token

    if (!token) {
        error.value = 'No authentication token provided'
        loading.value = false
        return
    }

    try {
        // Attempt to authenticate with the token
        await authStore.delegateAuth(token)
        success.value = true

        // Display success message
        toast.success('Authentication successful!')

        // Redirect to delegate dashboard after a short delay
        setTimeout(() => {
            router.push('/delegate')
        }, 1500)
    } catch (err) {
        error.value = 'Authentication failed. Invalid or expired token.'
        console.error('Login error:', err)
    } finally {
        loading.value = false
    }
})
</script>