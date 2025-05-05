<template>
    <div class="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
            <div class="text-center">
                <img src="/un-logo.png" alt="UN Logo" class="mx-auto h-12 w-auto" />
                <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Sign in to your account
                </h2>
            </div>

            <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                <div class="space-y-4 rounded-md">
                    <div>
                        <label for="username" class="form-label">Username</label>
                        <input id="username" v-model="form.username" type="text" required class="form-input"
                            :disabled="loading" />
                    </div>

                    <div>
                        <label for="password" class="form-label">Password</label>
                        <input id="password" v-model="form.password" type="password" required class="form-input"
                            :disabled="loading" />
                    </div>
                </div>

                <div>
                    <button type="submit" class="btn btn-primary w-full" :disabled="loading">
                        {{ loading ? 'Signing in...' : 'Sign in' }}
                    </button>
                </div>
            </form>

            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600">
                    Are you a delegate?
                    <router-link to="/delegate/auth" class="font-medium text-un-blue hover:text-blue-500">
                        Use your QR code to access
                    </router-link>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const form = ref({
    username: '',
    password: ''
})

async function handleSubmit() {
    loading.value = true
    try {
        await authStore.login(form.value)
        router.push(authStore.getDefaultRoute)
    } finally {
        loading.value = false
    }
}
</script>