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

        <!-- Committee Info -->
        <div v-if="committee" class="card mb-8">
            <h2 class="text-xl font-semibold mb-4">Committee Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><span class="font-medium">Type:</span> {{ formatCommitteeType(committee.type) }}</p>
                    <p><span class="font-medium">Status:</span> {{ formatStatus(committee.status) }}</p>
                    <p><span class="font-medium">Min Resolution Authors:</span> {{ committee.minResolutionAuthors }}</p>
                </div>
                <div>
                    <p><span class="font-medium">Countries:</span> {{ committee.countries?.length || 0 }}</p>
                    <p><span class="font-medium">Event:</span> {{ eventName }}</p>
                </div>
            </div>
        </div>

        <!-- Active Session Controls (only shown when session is active) -->
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

            <!-- Roll Call and Countries (only when session is active) -->
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
            
            <!-- Complete Session button (only when session is active) -->
            <div class="flex justify-end space-x-4 mt-4">
                <button @click="completeSession" class="btn btn-secondary" :disabled="loading">
                    Complete Session
                </button>
            </div>
        </div>

        <!-- No Active Session Message (only shown when no session is active) -->
        <div v-else-if="!loading && !activeSession" class="text-center py-6 mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
            <p class="text-gray-500">Start a new session to begin committee proceedings</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        
        <!-- Resolutions Management (shown regardless of session status) -->
        <div class="card mt-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-medium text-gray-900">Resolutions</h3>
                <button @click="fetchResolutions" class="btn btn-primary" :disabled="loadingResolutions">
                    {{ loadingResolutions ? 'Loading...' : 'Refresh Resolutions' }}
                </button>
            </div>

            <!-- Pending Resolutions -->
            <div v-if="loadingResolutions" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <div v-else>
                <h4 class="font-medium text-gray-700 mb-4">Pending Review</h4>
                <div v-if="pendingResolutions.length === 0" class="text-center py-4 text-gray-500">
                    No resolutions awaiting review
                </div>
                <div v-else class="space-y-4 mb-8">
                    <div v-for="resolution in pendingResolutions" :key="resolution._id"
                        class="border border-gray-200 rounded-md p-4">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h5 class="font-medium text-gray-900">{{ resolution.title }}</h5>
                                <p class="text-sm text-gray-500">Authors: {{ resolution.authors.join(', ') }}</p>
                            </div>
                            <span
                                class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Pending
                            </span>
                        </div>
                        <div class="mb-4">
                            <button @click="viewResolution(resolution)"
                                class="text-sm text-un-blue hover:text-blue-700">
                                View Resolution
                            </button>
                        </div>
                        <div class="mt-4">
                            <label for="reviewComments" class="form-label text-sm">Review Comments
                                (optional)</label>
                            <textarea id="reviewComments" v-model="reviewComments[resolution._id]" rows="2"
                                class="form-input text-sm" placeholder="Add review comments..."></textarea>
                        </div>
                        <div class="mt-2 flex justify-end space-x-2">
                            <button @click="reviewResolution(resolution._id, 'rejected')"
                                class="btn bg-red-600 hover:bg-red-700 text-white text-sm py-1">
                                Reject
                            </button>
                            <button @click="reviewResolution(resolution._id, 'accepted')"
                                class="btn bg-green-600 hover:bg-green-700 text-white text-sm py-1">
                                Accept
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Accepted Resolutions -->
                <h4 class="font-medium text-gray-700 mb-4">Accepted</h4>
                <div v-if="acceptedResolutions.length === 0" class="text-center py-4 text-gray-500">
                    No accepted resolutions
                </div>
                <div v-else class="space-y-4 mb-8">
                    <div v-for="resolution in acceptedResolutions" :key="resolution._id"
                        class="border border-gray-200 rounded-md p-4">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h5 class="font-medium text-gray-900">{{ resolution.title }}</h5>
                                <p class="text-sm text-gray-500">Authors: {{ resolution.authors.join(', ') }}</p>
                            </div>
                            <span
                                class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Accepted
                            </span>
                        </div>
                        <div class="flex justify-between items-center">
                            <button @click="viewResolution(resolution)"
                                class="text-sm text-un-blue hover:text-blue-700">
                                View Resolution
                            </button>
                            <button @click="setWorkingDraft(resolution._id)" class="btn btn-primary text-sm py-1"
                                :disabled="resolution.isWorkingDraft || !activeSession">
                                {{ resolution.isWorkingDraft ? 'Current Working Draft' : 'Set as Working Draft' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Rejected Resolutions -->
                <h4 class="font-medium text-gray-700 mb-4">Rejected</h4>
                <div v-if="rejectedResolutions.length === 0" class="text-center py-4 text-gray-500">
                    No rejected resolutions
                </div>
                <div v-else class="space-y-4">
                    <div v-for="resolution in rejectedResolutions" :key="resolution._id"
                        class="border border-gray-200 rounded-md p-4">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h5 class="font-medium text-gray-900">{{ resolution.title }}</h5>
                                <p class="text-sm text-gray-500">Authors: {{ resolution.authors.join(', ') }}</p>
                            </div>
                            <span
                                class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                Rejected
                            </span>
                        </div>
                        <div class="mb-2">
                            <button @click="viewResolution(resolution)"
                                class="text-sm text-un-blue hover:text-blue-700">
                                View Resolution
                            </button>
                        </div>
                        <div v-if="resolution.reviewComments" class="mt-2 text-sm">
                            <p class="text-gray-700 font-medium">Review Comments:</p>
                            <p class="text-gray-600">{{ resolution.reviewComments }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resolution Details Modal -->
        <TransitionRoot appear :show="showResolutionModal" as="template">
            <Dialog as="div" class="relative z-10" @close="showResolutionModal = false">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0"
                    enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black bg-opacity-25" />
                </TransitionChild>

                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                            <DialogPanel
                                class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div class="flex items-start justify-between mb-4">
                                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                                        Resolution Details
                                    </DialogTitle>
                                    <span :class="[
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                        selectedResolution?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            selectedResolution?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                    ]">
                                        {{ formatStatus(selectedResolution?.status || '') }}
                                    </span>
                                </div>

                                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h4 class="text-xl font-semibold text-gray-900 mb-2">{{ selectedResolution?.title }}
                                    </h4>
                                    <p class="text-sm text-gray-500 mb-4">
                                        <span class="font-medium">Authors:</span> {{ selectedResolution?.authors.join(',') }}
                                        <span
                                            v-if="committee && selectedResolution?.authors.length < committee.minResolutionAuthors"
                                            class="text-red-500 font-medium ml-2">
                                            (Needs {{ committee.minResolutionAuthors -
                                            selectedResolution?.authors.length }} more
                                            {{ (committee.minResolutionAuthors - selectedResolution?.authors.length) ===
                                            1 ? 'author' : 'authors' }})
                                        </span>
                                    </p>

                                    <div class="mt-4">
                                        <h5 class="text-md font-medium text-gray-700 mb-2">Google Docs Link:</h5>
                                        <div class="bg-white border border-gray-200 rounded-md p-4">
                                            <a :href="selectedResolution?.content" target="_blank"
                                                class="text-blue-600 hover:text-blue-800 break-all underline">
                                                {{ selectedResolution?.content }}
                                            </a>
                                        </div>
                                    </div>

                                    <div v-if="selectedResolution?.reviewComments" class="mt-4">
                                        <h5 class="text-md font-medium text-gray-700 mb-2">Review Comments:</h5>
                                        <div class="bg-white border border-gray-200 rounded-md p-4">
                                            {{ selectedResolution?.reviewComments }}
                                        </div>
                                    </div>

                                    <div class="mt-4 text-sm text-gray-500">
                                        <p><span class="font-medium">Submitted:</span>
                                            {{ selectedResolution?.submissionTime ?
                                                formatDate(selectedResolution.submissionTime) : 'N/A' }}
                                        </p>
                                        <p v-if="selectedResolution?.reviewTime">
                                            <span class="font-medium">Reviewed:</span>
                                            {{ formatDate(selectedResolution.reviewTime) }}
                                        </p>
                                    </div>
                                </div>

                                <div v-if="selectedResolution?.status === 'draft'" class="mb-4">
                                    <label for="modalReviewComments" class="form-label">Review Comments
                                        (optional)</label>
                                    <textarea id="modalReviewComments" v-model="currentReviewComments" rows="3"
                                        class="form-input" placeholder="Add review comments..."></textarea>
                                </div>

                                <div class="flex justify-between">
                                    <div>
                                        <div v-if="selectedResolution?.status === 'draft'" class="flex space-x-2">
                                            <button @click="reviewResolution(selectedResolution._id, 'rejected', true)"
                                                class="btn bg-red-600 hover:bg-red-700 text-white">
                                                Reject
                                            </button>
                                            <button @click="reviewResolution(selectedResolution._id, 'accepted', true)"
                                                class="btn bg-green-600 hover:bg-green-700 text-white"
                                                :disabled="committee && selectedResolution?.authors.length < committee.minResolutionAuthors">
                                                Accept
                                            </button>
                                        </div>
                                        <div
                                            v-else-if="selectedResolution?.status === 'accepted' && !selectedResolution?.isWorkingDraft && activeSession">
                                            <button @click="setWorkingDraft(selectedResolution._id, true)"
                                                class="btn btn-primary">
                                                Set as Working Draft
                                            </button>
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-outline" @click="showResolutionModal = false">
                                        Close
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useAuthStore } from '../../stores/auth'
import { sessionsService, committeesService, eventsService, resolutionsService, createWebSocket } from '../../services/api'
import { toast } from 'vue3-toastify'
import { format } from 'date-fns'

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
const eventName = ref('')

// Resolutions management
const resolutions = ref([])
const loadingResolutions = ref(false)
const reviewComments = ref({})
const showResolutionModal = ref(false)
const selectedResolution = ref(null)
const currentReviewComments = ref('')

const hasQuorum = computed(() => {
    if (!committee.value?.countries) return false
    return presentCountries.value.length >= Math.ceil(committee.value.countries.length / 2)
})

// Filtered resolutions
const pendingResolutions = computed(() => {
    return resolutions.value.filter(r => r.status === 'draft')
})

const acceptedResolutions = computed(() => {
    return resolutions.value.filter(r => r.status === 'accepted')
})

const rejectedResolutions = computed(() => {
    return resolutions.value.filter(r => r.status === 'rejected')
})

onMounted(async () => {
    await fetchCommitteeData()
    await fetchResolutions()
    initializeWebSocket()
})

onBeforeUnmount(() => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
    }
})

watch(() => committee.value, async () => {
    if (committee.value?.eventId) {
        await fetchEventData(committee.value.eventId)
    }
}, { immediate: true })

async function fetchCommitteeData() {
    loading.value = true
    try {
        // Get committee data using the new API endpoint
        const response = await committeesService.getMyCommittee()
        committee.value = response.data

        // Check for active session
        const sessions = await sessionsService.getForCommittee(committee.value._id)
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

async function fetchEventData(eventId) {
    try {
        const response = await eventsService.getById(eventId)
        eventName.value = response.data.name
    } catch (error) {
        console.error('Error fetching event data:', error)
        eventName.value = 'Unknown Event'
    }
}

async function fetchResolutions() {
    if (!committee.value?._id) return

    loadingResolutions.value = true
    try {
        const response = await resolutionsService.getForCommittee(committee.value._id)
        resolutions.value = response.data
    } catch (error) {
        console.error('Error fetching resolutions:', error)
        toast.error('Failed to load resolutions')
    } finally {
        loadingResolutions.value = false
    }
}

async function startNewSession() {
    loading.value = true
    try {
        const response = await sessionsService.create(committee.value._id, {
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

function formatCommitteeType(type) {
    switch (type) {
        case 'GA':
            return 'General Assembly'
        case 'SC':
            return 'Security Council'
        default:
            return type
    }
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(dateString) {
    try {
        return format(new Date(dateString), 'MMM d, yyyy HH:mm')
    } catch (error) {
        console.error("Error formatting date:", error)
        return dateString
    }
}

// Resolution management functions
function viewResolution(resolution) {
    selectedResolution.value = resolution
    currentReviewComments.value = reviewComments.value[resolution._id] || ''
    showResolutionModal.value = true
}

async function reviewResolution(resolutionId, status, fromModal = false) {
    try {
        // Get comments from either the modal or the main view
        const comments = fromModal
            ? currentReviewComments.value
            : reviewComments.value[resolutionId] || ''

        if (status === 'accepted') {
            // Find the resolution
            const resolution = resolutions.value.find(r => r._id === resolutionId)

            // Check if it has enough authors
            if (committee.value && resolution.authors.length < committee.value.minResolutionAuthors) {
                toast.error(`Cannot accept: Resolution needs at least ${committee.value.minResolutionAuthors} authors. Currently has ${resolution.authors.length}.`)
                return
            }
        }

        const response = await resolutionsService.review(resolutionId, {
            status,
            reviewComments: comments
        })

        // Update the resolution in the list
        const index = resolutions.value.findIndex(r => r._id === resolutionId)
        if (index !== -1) {
            resolutions.value[index] = response.data
        }

        // Clear comments
        reviewComments.value[resolutionId] = ''
        currentReviewComments.value = ''

        toast.success(`Resolution ${status}`)

        // Close modal if reviewing from modal
        if (fromModal) {
            showResolutionModal.value = false
        }

        // Refresh the list
        await fetchResolutions()
    } catch (error) {
        console.error('Error reviewing resolution:', error)

        if (error.response?.data?.error) {
            toast.error(error.response.data.error)
        } else {
            toast.error('Failed to review resolution')
        }
    }
}

async function setWorkingDraft(resolutionId, fromModal = false) {
    if (!activeSession.value) {
        toast.error('You must start a session before setting a working draft')
        return
    }
    
    try {
        await resolutionsService.setAsWorkingDraft(resolutionId)

        toast.success('Working draft updated')

        // Close modal if setting from modal
        if (fromModal) {
            showResolutionModal.value = false
        }

        // Refresh the list
        await fetchResolutions()
    } catch (error) {
        console.error('Error setting working draft:', error)

        if (error.response?.data?.error) {
            toast.error(error.response.data.error)
        } else {
            toast.error('Failed to set working draft')
        }
    }
}

function initializeWebSocket() {
    if (!committee.value?._id) return;

    try {
        const wsConnection = createWebSocket(committee.value._id);
        if (wsConnection) {
            wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
        }
    } catch (error) {
        console.error('WebSocket initialization error:', error);
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'session_updated':
            activeSession.value = data.session;
            currentMode.value = data.session.mode;
            presentCountries.value = data.session.presentCountries;
            break;
        case 'timer_started':
            timer.value = data.duration;
            timerRunning.value = true;
            break;
        case 'timer_ended':
            timer.value = 0;
            timerRunning.value = false;
            break;
        case 'resolution_submitted':
        case 'resolution_reviewed':
        case 'working_draft_selected':
            fetchResolutions();
            break;
    }
}
</script>