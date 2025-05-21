// src/composables/useWebSocket.js
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'

export function useWebSocket(committeeId) {
    const authStore = useAuthStore()
    const isConnected = ref(false)
    const error = ref(null)
    const socket = ref(null)
    const lastMessage = ref(null)

    function connect() {
        const token = authStore.token
        if (!token || !committeeId) return

        try {
            // Connect to WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            const ws = new WebSocket(`${protocol}//${window.location.host}/ws/committees/${committeeId}?token=${token}`)

            ws.onopen = () => {
                isConnected.value = true
                error.value = null
                console.log('WebSocket connection established')
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    lastMessage.value = data
                    // Handle different message types here or
                    // let the consumer component handle them
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e)
                }
            }

            ws.onerror = (e) => {
                error.value = 'Connection error'
                console.error('WebSocket error:', e)
            }

            ws.onclose = () => {
                isConnected.value = false
                console.log('WebSocket connection closed')
            }

            socket.value = ws
        } catch (e) {
            error.value = 'Failed to connect'
            console.error('Error setting up WebSocket:', e)
        }
    }

    function disconnect() {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            socket.value.close()
        }
    }

    function send(message) {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            socket.value.send(JSON.stringify(message))
        } else {
            error.value = 'Not connected'
        }
    }

    onMounted(() => {
        connect()
    })

    onBeforeUnmount(() => {
        disconnect()
    })

    return {
        isConnected,
        error,
        lastMessage,
        send,
        connect,
        disconnect
    }
}