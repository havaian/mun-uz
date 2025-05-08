<template>
    <div class="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
            <div class="text-center">
                <img src="/un-logo.png" alt="UN Logo" class="mx-auto h-12 w-auto" />
                <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Admin/Presidium Login
                </h2>
            </div>

            <!-- Login tabs -->
            <div class="mt-8">
                <div class="flex border-b border-gray-200">
                    <button @click="activeTab = 'credentials'" :class="[
                        'w-1/2 py-2 px-4 text-center focus:outline-none',
                        activeTab === 'credentials'
                            ? 'border-b-2 border-un-blue text-un-blue font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                    ]">
                        Username & Password
                    </button>
                    <button @click="activeTab = 'qrcode'" :class="[
                        'w-1/2 py-2 px-4 text-center focus:outline-none',
                        activeTab === 'qrcode'
                            ? 'border-b-2 border-un-blue text-un-blue font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                    ]">
                        QR Code
                    </button>
                </div>

                <!-- Credential login form -->
                <div v-if="activeTab === 'credentials'" class="mt-8 space-y-6">
                    <form @submit.prevent="handleSubmit">
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

                        <div class="mt-6">
                            <button type="submit" class="btn btn-primary w-full" :disabled="loading">
                                {{ loading ? 'Signing in...' : 'Sign in' }}
                            </button>
                        </div>
                    </form>
                </div>

                <!-- QR Code scanner -->
                <div v-else class="mt-8 space-y-6">
                    <div v-if="!showScanner" class="text-center">
                        <button @click="startScanner" class="btn btn-primary">
                            Scan QR Code
                        </button>
                    </div>

                    <div v-else class="space-y-6">
                        <div
                            class="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-gray-100">
                            <video ref="videoElement" class="h-full w-full object-cover"></video>
                            <div class="absolute inset-0 border-2 border-blue-500"></div>
                        </div>

                        <button type="button" class="btn btn-outline w-full" @click="stopScanner">
                            Cancel Scan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { toast } from 'vue3-toastify'
import jsQR from 'jsqr'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('credentials')
const loading = ref(false)
const form = ref({
    username: '',
    password: ''
})

// QR Code scanner
const showScanner = ref(false)
const videoElement = ref(null)
const stream = ref(null)
const scanInterval = ref(null)

async function handleSubmit() {
    loading.value = true
    try {
        await authStore.login(form.value)
        router.push(authStore.getDefaultRoute)
    } finally {
        loading.value = false
    }
}

async function startScanner() {
    try {
        showScanner.value = true
        await initializeCamera()
        startQRScanning()
    } catch (error) {
        toast.error('Unable to access camera. Please check permissions.')
        stopScanner()
    }
}

function stopScanner() {
    if (scanInterval.value) {
        clearInterval(scanInterval.value)
        scanInterval.value = null
    }

    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }

    showScanner.value = false
}

async function initializeCamera() {
    stream.value = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
    })

    if (videoElement.value) {
        videoElement.value.srcObject = stream.value
        videoElement.value.play()
    }
}

function startQRScanning() {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    scanInterval.value = setInterval(() => {
        if (videoElement.value && videoElement.value.readyState === videoElement.value.HAVE_ENOUGH_DATA) {
            canvas.height = videoElement.value.videoHeight
            canvas.width = videoElement.value.videoWidth

            context.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height)
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

            const code = jsQR(imageData.data, imageData.width, imageData.height)
            if (code) {
                stopScanner()
                handleQRCode(code.data)
            }
        }
    }, 100)
}

async function handleQRCode(token) {
    loading.value = true
    try {
        await authStore.delegateAuth(token)
        router.push(authStore.getDefaultRoute)
    } catch (error) {
        toast.error('Invalid QR code')
    } finally {
        loading.value = false
    }
}

onBeforeUnmount(() => {
    stopScanner()
})
</script>