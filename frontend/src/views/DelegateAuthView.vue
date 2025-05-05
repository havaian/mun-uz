<template>
    <div
        class="min-h-[calc(100vh-12rem)] bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
            <div class="text-center">
                <img src="/un-logo.png" alt="UN Logo" class="mx-auto h-12 w-auto" />
                <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Delegate Access
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    Scan your QR code or enter your token manually
                </p>
            </div>

            <div class="mt-8">
                <div v-if="!showScanner" class="space-y-6">
                    <!-- Manual token input -->
                    <div>
                        <label for="token" class="form-label">Access Token</label>
                        <input id="token" v-model="token" type="text" class="form-input"
                            placeholder="Enter your access token" :disabled="loading" />
                    </div>

                    <div class="flex flex-col space-y-4">
                        <button type="button" class="btn btn-primary w-full" @click="handleTokenSubmit"
                            :disabled="!token || loading">
                            {{ loading ? 'Authenticating...' : 'Submit Token' }}
                        </button>

                        <button type="button" class="btn btn-outline w-full" @click="startScanner" :disabled="loading">
                            Scan QR Code
                        </button>
                    </div>
                </div>

                <!-- QR Scanner -->
                <div v-else class="space-y-6">
                    <div class="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-gray-100">
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { toast } from 'vue3-toastify'
import jsQR from 'jsqr'

const router = useRouter()
const authStore = useAuthStore()

const token = ref('')
const loading = ref(false)
const showScanner = ref(false)
const videoElement = ref(null)
const stream = ref(null)
const scanInterval = ref(null)

async function handleTokenSubmit() {
    if (!token.value) {
        toast.error('Please enter a token')
        return
    }

    loading.value = true
    try {
        await authStore.delegateAuth(token.value)
        router.push('/delegate')
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
        toast.error('Unable to access camera. Please check permissions or enter token manually.')
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
                token.value = code.data
                stopScanner()
                handleTokenSubmit()
            }
        }
    }, 100)
}

onBeforeUnmount(() => {
    stopScanner()
})
</script>