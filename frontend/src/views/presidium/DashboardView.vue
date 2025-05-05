<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">{{ committee?.name || 'Committee Dashboard' }}</h1>
                    <p class="mt-1 text-sm text-gray-500">{{ committee?.type || 'Loading...' }}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <span :class="[
                        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                        activeSession ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    ]">
                        {{ activeSession ? 'Session Active' : 'No Active Session' }}
                    </span>
                    <button v-if="!activeSession" @click="startNewSession" class="btn btn-primary" :disabled="loading">
                        Start New Session
                    </button>
                </div>
            </div>
        </header>

        <!-- Active Session Controls -->
        <div v-if="activeSession" class="space-y-8">
            <!-- Session Info and Controls -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <!-- Mode Selection -->
                <div class="card">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Session Mode</h3>
                    <select v-model="currentMode" class="form-input" @change="handleModeChange">
                        <option value="formal">Formal Debate</option>
                        <option value="informal_moderated">Informal Moderated</option>
                        <option value="informal_unmoderated">Informal Unmoderated</option>
                        <option value="informal_consultation">Informal Consultation</option>
                    </select>
                </div>

                <!-- Timer -->
                <div class="card">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Timer</h3>
                    <div class="flex items-center justify-between">
                        <div class="text-3xl font-mono">{{ formatTime(timer) }}</div>
                        <div class="space-x-2">
                            <button @click="toggleTimer" class="btn"
                                :class="timerRunning ? 'btn-secondary' : 'btn-primary'">
                                {{ timerRunning ? 'Pause' : 'Start' }}
                            </button>
                            <button @click="resetTimer" class="btn btn-outline">
                                Reset
                            </button>
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="form-label">Set Duration (minutes)</label>
                        <input type="number" v-model="timerDuration" class="form-input" min="1"
                            :disabled="timerRunning">
                    </div>
                </div>

                <!-- Quorum Status -->
                <div class="card">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Quorum Status</h3>
                    <div class="text-center">
                        <div class="text-3xl font-bold" :class="hasQuorum ? 'text-green-600' : 'text-red-600'">
                            {{ presentCountries.length }} / {{ committee?.countries?.length || 0 }}
                        </div>
                        <p class="text-sm text-gray-500 mt-2">
                            {{ hasQuorum ? 'Quorum Established' : 'No Quorum' }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Roll Call and Countries -->
            <div class="card">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-medium text-gray-900">Roll Call</h3>
                    <button @click="updateRollCall" class="btn btn-primary" :disabled="loading">
                        Update Roll Call
                    </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div v-for="country in committee?.countries" :key="country.name"
                        class="flex items-center space-x-2">
                        <input type="checkbox" :id="country.name" v-model="presentCountries" :value="country.name"
                            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <label :for="country.name" class="text-sm text-gray-700">
                            {{ country.name }}
                        </label>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-4">
                <button @click="completeSession" class="btn btn-secondary" :disabled="loading">
                    Complete Session
                </button>
            </div>
        </div>

        <!-- No Active Session -->
        <div v-else-if="!loading" class="text-center py-12">
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
            <p class="text-gray-500 mb-6">Start a new session to begin committee proceedings</p>
        </div>

        <!-- Loading State -->
        <div v-else class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { sessionsService, committeesService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const loading = ref(false)
const committee = ref(null)
const activeSession = ref(null)
const currentMode = ref('formal')
const presentCountries = ref([])
const timer = ref(0)
const timerDuration = ref(10)
const timerRunning = ref(false)
const timerInterval = ref(null)

const hasQuorum = computed(() => {
    if (!committee.value?.countries) return false
    return presentCountries.value.length >= Math.ceil(committee.value.countries.length / 2)
})

onMounted(async () => {
    await fetchCommitteeData()
    initializeWebSocket()
})

onBeforeUnmount(() => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
    }
})

async function fetchCommitteeData() {
    loading.value = true
    try {
        // Get committee data
        const response = await committeesService.getById(authStore.user.committeeId)
        committee.value = response.data

        // Check for active session
        const sessions = await sessionsService.getForCommittee(authStore.user.committeeId)
        activeSession.value = sessions.data.find(s => s.status === 'active')

        if (activeSession.value) {
            currentMode.value = activeSession.value.mode
            presentCountries.value = activeSession.value.presentCountries
        }
    } catch (error) {
        console.error('Error fetching committee data:', error)
    } finally {
        loading.value = false
    }
}

async function startNewSession() {
    loading.value = true
    try {
        const response = await sessionsService.create(authStore.user.committeeId, {
            presentCountries: []
        })
        activeSession.value = response.data
        toast.success('New session started')
    } catch (error) {
        console.error('Error starting session:', error)
    } finally {
        loading.value = false
    }
}

async function handleModeChange() {
    if (!activeSession.value) return

    try {
        await sessionsService.updateMode(activeSession.value._id, currentMode.value)
        toast.success('Session mode updated')
    } catch (error) {
        console.error('Error updating mode:', error)
    }
}

async function updateRollCall() {
    if (!activeSession.value) return

    loading.value = true
    try {
        await sessionsService.updateRollCall(activeSession.value._id, presentCountries.value)
        toast.success('Roll call updated')
    } catch (error) {
        console.error('Error updating roll call:', error)
    } finally {
        loading.value = false
    }
}

async function completeSession() {
    if (!activeSession.value) return

    if (!confirm('Are you sure you want to complete this session?')) return

    loading.value = true
    try {
        await sessionsService.complete(activeSession.value._id)
        activeSession.value = null
        toast.success('Session completed')
    } catch (error) {
        console.error('Error completing session:', error)
    } finally {
        loading.value = false
    }
}

function toggleTimer() {
    if (timerRunning.value) {
        clearInterval(timerInterval.value)
        timerRunning.value = false
    } else {
        if (timer.value === 0) {
            timer.value = timerDuration.value * 60
        }
        timerInterval.value = setInterval(() => {
            if (timer.value > 0) {
                timer.value--
            } else {
                clearInterval(timerInterval.value)
                timerRunning.value = false
                // Play sound or show notification
            }
        }, 1000)
        timerRunning.value = true
    }
}

function resetTimer() {
    clearInterval(timerInterval.value)
    timerRunning.value = false
    timer.value = timerDuration.value * 60
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function initializeWebSocket() {
    const ws = createWebSocket(authStore.user.committeeId)
    if (!ws) return

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'session_updated':
            activeSession.value = data.session
            currentMode.value = data.session.mode
            presentCountries.value = data.session.presentCountries
            break
        case 'timer_started':
            timer.value = data.duration
            timerRunning.value = true
            break
        case 'timer_ended':
            timer.value = 0
            timerRunning.value = false
            break
    }
}
</script>