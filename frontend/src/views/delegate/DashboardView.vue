<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">{{ committee?.name }}</h1>
                    <p class="mt-1 text-sm text-gray-500">Representing {{ authStore.user.countryName }}</p>
                </div>
                <div>
                    <span :class="[
                        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                        isPresent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    ]">
                        {{ isPresent ? 'Present' : 'Not Present' }}
                    </span>
                </div>
            </div>
        </header>

        <!-- Session Status -->
        <div v-if="activeSession" class="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Current Mode</h3>
                <p class="text-2xl font-semibold text-un-blue">
                    {{ formatMode(activeSession.mode) }}
                </p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Timer</h3>
                <div class="text-2xl font-mono" :class="timer > 0 ? 'text-un-blue' : 'text-gray-500'">
                    {{ formatTime(timer) }}
                </div>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Quorum Status</h3>
                <div class="text-2xl font-semibold" :class="activeSession.quorum ? 'text-green-600' : 'text-red-600'">
                    {{ activeSession.quorum ? 'Established' : 'Not Established' }}
                </div>
            </div>
        </div>

        <!-- Main Actions -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Resolutions -->
            <div class="space-y-6">
                <!-- Fixed header to match structure with Active Voting section -->
                <div class="flex items-center justify-between h-10"> <!-- Added fixed height -->
                    <h2 class="text-xl font-semibold text-gray-900">Resolutions</h2>
                    <button @click="showResolutionModal = true" class="btn btn-primary">
                        Submit Resolution
                    </button>
                </div>

                <div class="card">
                    <div v-if="resolutions.length === 0" class="text-center py-6 text-gray-500">
                        No resolutions submitted yet
                    </div>
                    <div v-else class="divide-y divide-gray-200">
                        <div v-for="resolution in resolutions" :key="resolution._id" class="py-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium text-gray-900">{{ resolution.title }}</h4>
                                    <p class="text-sm text-gray-500">
                                        Authors: {{ resolution.authors.join(', ') }}
                                    </p>
                                </div>
                                <span :class="[
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    resolution.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        resolution.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                ]">
                                    {{ resolution.status }}
                                </span>
                            </div>
                            <div class="mt-2 flex items-center space-x-4">
                                <button @click="viewResolution(resolution)"
                                    class="text-sm text-un-blue hover:text-blue-700">
                                    View Details
                                </button>
                                <button
                                    v-if="resolution.status === 'draft' && !resolution.authors.includes(authStore.user.countryName)"
                                    @click="confirmCoAuthorship(resolution)"
                                    class="text-sm text-un-blue hover:text-blue-700">
                                    Confirm Co-Authorship
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Voting -->
            <div class="space-y-6">
                <!-- Matched structure to Resolutions header -->
                <div class="flex items-center justify-between h-10"> <!-- Added fixed height -->
                    <h2 class="text-xl font-semibold text-gray-900">Active Voting</h2>
                    <!-- Empty div to maintain layout even without a button -->
                    <div></div>
                </div>

                <div v-if="activeVoting" class="card">
                    <div class="mb-4">
                        <h4 class="font-medium text-gray-900">
                            {{ getVotingTitle(activeVoting) }}
                        </h4>
                        <p class="text-sm text-gray-500 mt-1">
                            Required Majority: {{ activeVoting.requiredMajority === 'qualified' ? '2/3' : 'Simple' }}
                        </p>
                    </div>

                    <div v-if="!hasVoted" class="space-y-4">
                        <div class="flex items-center justify-center space-x-4">
                            <button @click="submitVote('yes')" class="btn bg-green-600 hover:bg-green-700 text-white"
                                :disabled="voting">
                                Yes
                            </button>
                            <button @click="submitVote('no')" class="btn bg-red-600 hover:bg-red-700 text-white"
                                :disabled="voting">
                                No
                            </button>
                            <button @click="submitVote('abstain')" class="btn bg-gray-600 hover:bg-gray-700 text-white"
                                :disabled="voting">
                                Abstain
                            </button>
                        </div>
                    </div>
                    <div v-else class="text-center text-gray-500">
                        Vote submitted
                    </div>
                </div>
                <div v-else class="card">
                    <div class="text-center py-6 text-gray-500">
                        No active voting
                    </div>
                </div>
            </div>
        </div>

        <!-- Resolution Modal -->
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
                                class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                                    Submit Resolution
                                </DialogTitle>

                                <form @submit.prevent="submitResolution" class="mt-4 space-y-4">
                                    <div>
                                        <label for="title" class="form-label">Title</label>
                                        <input id="title" v-model="resolutionForm.title" type="text" class="form-input"
                                            required />
                                    </div>

                                    <div>
                                        <label for="content" class="form-label">Content</label>
                                        <textarea id="content" v-model="resolutionForm.content" rows="10"
                                            class="form-input" required></textarea>
                                    </div>

                                    <div>
                                        <label class="form-label">Co-Authors</label>
                                        <div class="mt-2 space-y-2">
                                            <div v-for="country in committee?.countries" :key="country.name"
                                                class="flex items-center">
                                                <input type="checkbox" :id="'author-' + country.name"
                                                    v-model="resolutionForm.authors" :value="country.name"
                                                    :disabled="country.name === authStore.user.countryName"
                                                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                                <label :for="'author-' + country.name"
                                                    class="ml-2 text-sm text-gray-700">
                                                    {{ country.name }}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline"
                                            @click="showResolutionModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="submitting">
                                            {{ submitting ? 'Submitting...' : 'Submit Resolution' }}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useAuthStore } from '../../stores/auth'
import { committeesService, resolutionsService, votingsService, createWebSocket } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const committee = ref(null)
const activeSession = ref(null)
const resolutions = ref([])
const activeVoting = ref(null)
const timer = ref(0)
const timerInterval = ref(null)

const showResolutionModal = ref(false)
const submitting = ref(false)
const voting = ref(false)

const resolutionForm = ref({
    title: '',
    content: '',
    authors: []
})

// Add current delegate as author by default
if (authStore.user?.countryName) {
    resolutionForm.value.authors.push(authStore.user.countryName)
}

const isPresent = computed(() => {
    if (!activeSession.value?.presentCountries) return false
    return activeSession.value.presentCountries.includes(authStore.user.countryName)
})

const hasVoted = computed(() => {
    if (!activeVoting.value?.votes) return false
    return activeVoting.value.votes.some(v => v.countryName === authStore.user.countryName)
})

onMounted(async () => {
    console.log("Dashboard component mounted - loading data");
    await Promise.all([
        fetchCommitteeData(),
        fetchResolutions()
    ])
    initializeWebSocket()
})

onBeforeUnmount(() => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
    }
})

async function fetchCommitteeData() {
    try {
        console.log("Fetching committee data");
        const response = await committeesService.getById(authStore.user.committeeId)
        committee.value = response.data
        console.log("Committee data loaded:", committee.value);
    } catch (error) {
        console.error('Error fetching committee data:', error)
    }
}

async function fetchResolutions() {
    try {
        console.log("Fetching resolutions data");
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        resolutions.value = response.data
        console.log("Resolutions data loaded, count:", resolutions.value.length);
    } catch (error) {
        console.error('Error fetching resolutions:', error)
    }
}

function viewResolution(resolution) {
    // This function would typically open a modal or navigate to a detail view
    console.log("Viewing resolution:", resolution.title);
    toast.info(`Viewing resolution: ${resolution.title}`)
    // You could redirect to the resolutions page with this resolution highlighted
    // router.push(`/delegate/resolutions?highlight=${resolution._id}`);
}

async function submitResolution() {
    if (!resolutionForm.value.title.trim() || !resolutionForm.value.content.trim()) {
        toast.error('Please fill in all required fields');
        return;
    }

    if (committee.value?.minResolutionAuthors &&
        resolutionForm.value.authors.length < committee.value.minResolutionAuthors) {
        toast.error(`At least ${committee.value.minResolutionAuthors} authors are required`);
        return;
    }

    submitting.value = true
    try {
        console.log("Submitting resolution");
        const response = await resolutionsService.create({
            committeeId: authStore.user.committeeId,
            ...resolutionForm.value
        })

        // Add to local list
        resolutions.value.unshift(response.data)
        showResolutionModal.value = false
        toast.success('Resolution submitted successfully')

        // Reset form
        resolutionForm.value = {
            title: '',
            content: '',
            authors: [authStore.user.countryName]
        }
    } catch (error) {
        console.error('Error submitting resolution:', error)
        if (error.response?.data?.error) {
            toast.error(error.response.data.error)
        } else {
            toast.error('Failed to submit resolution')
        }
    } finally {
        submitting.value = false
    }
}

async function confirmCoAuthorship(resolution) {
    try {
        await resolutionsService.confirmCoAuthor(resolution._id)
        await fetchResolutions()
        toast.success('Co-authorship confirmed')
    } catch (error) {
        console.error('Error confirming co-authorship:', error)
        toast.error('Failed to confirm co-authorship')
    }
}

async function submitVote(vote) {
    if (!activeVoting.value) return

    voting.value = true
    try {
        await votingsService.submitVote(activeVoting.value._id, vote)
        toast.success('Vote submitted successfully')
    } catch (error) {
        console.error('Error submitting vote:', error)
        toast.error('Failed to submit vote')
    } finally {
        voting.value = false
    }
}

function formatMode(mode) {
    if (!mode) return 'Unknown';

    return mode
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getVotingTitle(voting) {
    switch (voting.target) {
        case 'resolution':
            return 'Vote on Resolution'
        case 'amendment':
            return 'Vote on Amendment'
        case 'procedure':
            return 'Procedural Vote'
        default:
            return 'Vote'
    }
}

function initializeWebSocket() {
    console.log("Initializing WebSocket connection");
    try {
        const ws = createWebSocket(authStore.user.committeeId)
        if (!ws) {
            console.log("Could not create WebSocket connection");
            return;
        }

        ws.onopen = () => {
            console.log("WebSocket connection established");
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                console.log("WebSocket message received:", data.type);
                handleWebSocketMessage(data)
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        }

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        }

        ws.onclose = () => {
            console.log("WebSocket connection closed");
        }
    } catch (error) {
        console.error("Error setting up WebSocket:", error);
    }
}

function handleWebSocketMessage(data) {
    try {
        switch (data.type) {
            case 'session_updated':
                console.log("Session updated:", data.session);
                activeSession.value = data.session
                break
            case 'timer_started':
                console.log("Timer started:", data.duration);
                timer.value = data.duration
                if (timerInterval.value) clearInterval(timerInterval.value)
                timerInterval.value = setInterval(() => {
                    if (timer.value > 0) timer.value--
                    else clearInterval(timerInterval.value)
                }, 1000)
                break
            case 'timer_ended':
                console.log("Timer ended");
                timer.value = 0
                if (timerInterval.value) clearInterval(timerInterval.value)
                break
            case 'voting_started':
                console.log("Voting started:", data.voting);
                activeVoting.value = data.voting
                break
            case 'voting_results':
                console.log("Voting results:", data);
                activeVoting.value = null
                break
            case 'resolution_submitted':
                console.log("Resolution submitted, refreshing list");
                fetchResolutions()
                break
            default:
                console.log("Unknown message type:", data.type);
        }
    } catch (error) {
        console.error("Error handling WebSocket message:", error);
    }
}
</script>