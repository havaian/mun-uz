<template>
    <div class="h-screen flex flex-col justify-center items-center bg-gray-900 text-white p-4">
        <h1 class="text-3xl font-bold mb-8">Delegate Authentication</h1>

        <div class="w-full max-w-md">
            <div v-if="!cameraActive" class="text-center">
                <button @click="startCamera" class="btn btn-primary mb-4">
                    Scan QR Code
                </button>
                <p class="text-gray-300 text-sm mb-4">
                    Or enter your token manually:
                </p>
                <div class="mb-4">
                    <input v-model="token" type="text" placeholder="Enter your token"
                        class="w-full px-4 py-2 border rounded-lg bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button @click="submitToken" class="btn btn-secondary w-full" :disabled="!token || loading">
                    {{ loading ? 'Authenticating...' : 'Submit Token' }}
                </button>
            </div>

            <div v-else class="text-center">
                <div class="relative w-full h-64 md:h-80 mb-4 bg-black rounded-lg overflow-hidden">
                    <div id="qr-scanner" class="w-full h-full"></div>
                    <div class="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
                </div>

                <button @click="stopCamera" class="btn btn-secondary">
                    Cancel Scan
                </button>
            </div>

            <div v-if="error" class="mt-4 p-3 bg-red-900 text-white rounded-lg">
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'

export default {
    name: 'DelegateAuthView',
    setup() {
        const router = useRouter()
        const token = ref('')
        const error = ref('')
        const loading = ref(false)
        const cameraActive = ref(false)
        let scanner = null

        onMounted(() => {
            // Check if we need to load QR code scanner library
            if (typeof window !== 'undefined' && !window.QrScanner) {
                const script = document.createElement('script')
                script.src = 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner.min.js'
                script.async = true
                document.head.appendChild(script)
            }
        })

        onBeforeUnmount(() => {
            stopCamera()
        })

        const startCamera = async () => {
            if (typeof window === 'undefined' || !window.QrScanner) {
                error.value = 'QR Scanner not available. Please enter your token manually.'
                return
            }

            try {
                cameraActive.value = true

                // Wait for next tick to ensure the element is available
                await new Promise(resolve => setTimeout(resolve, 100))

                const element = document.getElementById('qr-scanner')
                if (!element) {
                    throw new Error('Scanner element not found')
                }

                scanner = new window.QrScanner(
                    element,
                    result => {
                        token.value = result.data
                        stopCamera()
                        submitToken()
                    },
                    {
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        maxScansPerSecond: 5
                    }
                )

                await scanner.start()
            } catch (err) {
                console.error('Camera error:', err)
                error.value = 'Unable to access camera. Please check camera permissions or enter your token manually.'
                cameraActive.value = false
            }
        }

        const stopCamera = () => {
            if (scanner) {
                scanner.stop()
                scanner.destroy()
                scanner = null
            }
            cameraActive.value = false
        }

        const submitToken = async () => {
            if (!token.value) {
                error.value = 'Please enter a token'
                return
            }

            error.value = ''
            loading.value = true

            try {
                const response = await authService.delegateAuth(token.value)

                // Store token and user data
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('user', JSON.stringify(response.data.user))

                // Redirect to delegate dashboard
                router.push('/delegate')
            } catch (err) {
                console.error('Auth error:', err)
                error.value = err.response?.data?.error || 'Authentication failed. Please check your token and try again.'
            } finally {
                loading.value = false
            }
        }

        return {
            token,
            error,
            loading,
            cameraActive,
            startCamera,
            stopCamera,
            submitToken
        }
    }
}
</script>