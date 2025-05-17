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
        </div>

        <!-- Main Actions -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- My Resolutions -->
            <div class="space-y-6">
                <div class="flex items-center justify-between h-10">
                    <h2 class="text-xl font-semibold text-gray-900">My Resolutions</h2>
                    <button @click="openResolutionModal" class="btn btn-primary" :disabled="hasSubmittedResolution">
                        Submit Resolution
                        <span v-if="hasSubmittedResolution" class="text-xs ml-1">(Already submitted)</span>
                    </button>
                </div>

                <div class="card">
                    <div v-if="delegateResolutions.length === 0" class="text-center py-6 text-gray-500">
                        You haven't submitted or co-authored any resolutions yet
                    </div>
                    <div v-else class="divide-y divide-gray-200">
                        <div v-for="resolution in delegateResolutions" :key="resolution._id" class="py-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium text-gray-900">{{ resolution.title }}</h4>
                                    <p class="text-sm text-gray-500">
                                        Authors: {{ resolution.authors.join(', ') }}
                                    </p>
                                    <p v-if="isMainAuthor(resolution)" class="text-xs text-un-blue mt-1">
                                        You are the main author
                                    </p>
                                    <p v-else class="text-xs text-un-blue mt-1">
                                        You are a co-author
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Voting -->
            <div class="space-y-6">
                <div class="flex items-center justify-between h-10">
                    <h2 class="text-xl font-semibold text-gray-900">Active Voting</h2>
                    <div></div> <!-- Empty div to maintain layout -->
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

        <div v-if="pendingCoAuthorships.length > 0" class="space-y-6 mt-8">
            <div class="flex items-center justify-between h-10">
                <h2 class="text-xl font-semibold text-gray-900">Pending Co-authorships</h2>
            </div>

            <div class="card">
                <div class="divide-y divide-gray-200">
                    <div v-for="resolution in pendingCoAuthorships" :key="resolution._id" class="py-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">{{ resolution.title }}</h4>
                                <p class="text-sm text-gray-500">
                                    Main Author: {{ resolution.authors[0] }}
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                    You have been invited to be a co-author on this resolution
                                </p>
                            </div>
                            <span
                                class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Confirmation Needed
                            </span>
                        </div>
                        <div class="mt-4">
                            <p v-if="resolution.documentUrl" class="text-sm text-gray-700">
                                <a :href="resolution.documentUrl" target="_blank" rel="noopener noreferrer"
                                    class="text-un-blue hover:underline flex items-center">
                                    <DocumentIcon class="h-5 w-5 mr-2" />View Google Document
                                    <ArrowTopRightOnSquareIcon class="h-4 w-4 ml-1" />
                                </a>
                            </p>
                            <p v-else class="text-sm text-gray-700 mt-2">{{ resolution.content }}</p>
                        </div>
                        <div class="mt-4 flex justify-between items-center">
                            <button @click="viewResolution(resolution)"
                                class="text-sm text-un-blue hover:text-blue-700">
                                View Details
                            </button>
                            <div class="space-x-2">
                                <button @click="confirmCoAuthorship(resolution._id)"
                                    class="btn bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-4">
                                    Confirm Co-authorship
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resolution Creation Modal -->
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
                                        <label for="title" class="form-label">Resolution Title</label>
                                        <input id="title" v-model="resolutionForm.title" type="text" class="form-input"
                                            required placeholder="Enter title of your resolution" />
                                    </div>

                                    <div>
                                        <label for="content" class="form-label">Google Docs Link</label>
                                        <input id="content" v-model="resolutionForm.content" type="text"
                                            class="form-input" required
                                            placeholder="https://docs.google.com/document/d/..." />
                                        <p class="text-xs text-gray-500 mt-1">
                                            Please paste a link to your resolution document in Google Docs.
                                            Make sure the document is accessible to anyone with the link.
                                        </p>
                                        <p class="text-xs text-red-500 mt-1"
                                            v-if="resolutionForm.content && !isValidGoogleDocsLink">
                                            Please enter a valid Google Docs link starting with
                                            https://docs.google.com/document/d/
                                        </p>
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
                                        <p v-if="committee?.minResolutionAuthors" class="mt-2 text-sm text-gray-500">
                                            Minimum {{ committee.minResolutionAuthors }} authors required
                                        </p>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline"
                                            @click="showResolutionModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary"
                                            :disabled="submitting || !isValidForm">
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

        <!-- Resolution Details Modal -->
        <TransitionRoot appear :show="showResolutionDetailsModal" as="template">
            <Dialog as="div" class="relative z-10" @close="showResolutionDetailsModal = false">
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
                                        {{ selectedResolution?.status }}
                                    </span>
                                </div>

                                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h4 class="text-xl font-semibold text-gray-900 mb-2">{{ selectedResolution?.title }}
                                    </h4>
                                    <p class="text-sm text-gray-500 mb-4">
                                        <span class="font-medium">Authors:</span> {{
                                            selectedResolution?.authors.join(',') }}
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

                                <div class="flex justify-end">
                                    <button type="button" class="btn btn-outline"
                                        @click="showResolutionDetailsModal = false">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useAuthStore } from '../../stores/auth'
import { committeesService, resolutionsService, votingsService, sessionsService, createWebSocket } from '../../services/api'
import { toast } from 'vue3-toastify'
import { format } from 'date-fns'

const authStore = useAuthStore()
const committee = ref(null)
const activeSession = ref(null)
const delegateResolutions = ref([]) // Changed from resolutions to delegateResolutions
const activeVoting = ref(null)
const timer = ref(0)
const timerInterval = ref(null)

const showResolutionModal = ref(false)
const showResolutionDetailsModal = ref(false)
const selectedResolution = ref(null)
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

// Computed properties for validations
const isValidGoogleDocsLink = computed(() => {
    const googleDocsPattern = /^https:\/\/docs\.google\.com\/document\/d\//;
    return !resolutionForm.value.content || googleDocsPattern.test(resolutionForm.value.content);
})

const isValidForm = computed(() => {
    // Check if form is valid
    if (!resolutionForm.value.title.trim()) return false;
    if (!resolutionForm.value.content.trim()) return false;
    if (!isValidGoogleDocsLink.value) return false;

    if (committee.value?.minResolutionAuthors &&
        resolutionForm.value.authors.length < committee.value.minResolutionAuthors) {
        return false;
    }

    return true;
})

const isPresent = computed(() => {
    if (!activeSession.value?.presentCountries) return false
    return activeSession.value.presentCountries.includes(authStore.user.countryName)
})

const hasVoted = computed(() => {
    if (!activeVoting.value?.votes) return false
    return activeVoting.value.votes.some(v => v.countryName === authStore.user.countryName)
})

// Check if the current delegate has already submitted a resolution
// Only consider resolutions where they are the main author (first in the list)
const hasSubmittedResolution = computed(() => {
    if (!delegateResolutions.value || !delegateResolutions.value.length) return false
    return delegateResolutions.value.some(r => r.authors[0] === authStore.user.countryName)
})

onMounted(async () => {
    console.log('Component mounted with user:', authStore.user)
    await fetchCommitteeData()
    await fetchDelegateResolutions() // Changed from fetchResolutions to fetchDelegateResolutions
    await fetchActiveSession()
    initializeWebSocket()
})

onBeforeUnmount(() => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
    }
})

async function fetchCommitteeData() {
    try {
        const response = await committeesService.getById(authStore.user.committeeId)
        committee.value = response.data
    } catch (error) {
        console.error('Error fetching committee data:', error)
    }
}

// New function to fetch only the delegate's resolutions
async function fetchDelegateResolutions() {
    try {
        console.log('Fetching delegate resolutions for committee:', authStore.user.committeeId)
        const response = await resolutionsService.getDelegateResolutions(authStore.user.committeeId)
        console.log('Delegate resolutions data:', response.data)
        delegateResolutions.value = response.data
    } catch (error) {
        console.error('Error fetching delegate resolutions:', error)
    }
}

async function fetchActiveSession() {
    try {
        // Use the correct API call for active sessions
        const response = await sessionsService.getForCommittee(authStore.user.committeeId)
        // Find the active session in the response
        const active = response.data.find(s => s.status === 'active')
        console.log('Active session found:', active)
        activeSession.value = active
    } catch (error) {
        console.error('Error fetching active session:', error)
    }
}

// Check if the current user is the main author (first in the authors list)
function isMainAuthor(resolution) {
    return resolution.authors[0] === authStore.user.countryName
}

function openResolutionModal() {
    if (hasSubmittedResolution.value) {
        toast.error('You have already submitted a resolution for this event')
        return
    }

    showResolutionModal.value = true
}

function viewResolution(resolution) {
    selectedResolution.value = resolution
    showResolutionDetailsModal.value = true
}

function formatDate(dateString) {
    try {
        return format(new Date(dateString), 'MMM d, yyyy HH:mm')
    } catch (error) {
        console.error("Error formatting date:", error)
        return dateString
    }
}

async function submitResolution() {
    if (!isValidForm.value) {
        if (!resolutionForm.value.title.trim()) {
            toast.error('Please enter a title for your resolution')
            return
        }

        if (!resolutionForm.value.content.trim() || !isValidGoogleDocsLink.value) {
            toast.error('Please enter a valid Google Docs link (https://docs.google.com/document/d/...)')
            return
        }

        if (committee.value?.minResolutionAuthors &&
            resolutionForm.value.authors.length < committee.value.minResolutionAuthors) {
            toast.error(`At least ${committee.value.minResolutionAuthors} authors are required`)
            return
        }

        return
    }

    // Double check if the delegate has already submitted a resolution
    if (hasSubmittedResolution.value) {
        toast.error('You have already submitted a resolution for this event')
        showResolutionModal.value = false
        return
    }

    submitting.value = true
    try {
        console.log('Submitting resolution with data:', {
            committeeId: authStore.user.committeeId,
            title: resolutionForm.value.title,
            content: resolutionForm.value.content,
            authors: resolutionForm.value.authors
        })

        const response = await resolutionsService.create({
            committeeId: authStore.user.committeeId,
            ...resolutionForm.value
        })

        // Add to local list
        delegateResolutions.value.unshift(response.data)
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
    if (!mode) return 'Unknown'

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
    try {
        const ws = createWebSocket(authStore.user.committeeId)
        if (!ws) return

        ws.onopen = () => {
            console.log("WebSocket connection established")
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                handleWebSocketMessage(data)
            } catch (error) {
                console.error("Error processing WebSocket message:", error)
            }
        }

        ws.onerror = (error) => {
            console.error("WebSocket error:", error)
        }

        ws.onclose = () => {
            console.log("WebSocket connection closed")
        }
    } catch (error) {
        console.error("Error setting up WebSocket:", error)
    }
}

// Track resolutions where the delegate is a pending co-author
const pendingCoAuthorships = ref([])

// Update the onMounted function to also fetch pending co-authorships
onMounted(async () => {
    console.log('Component mounted with user:', authStore.user)
    await Promise.all([
        fetchCommitteeData(),
        fetchDelegateResolutions(),
        fetchActiveSession(),
        fetchPendingCoAuthorships() // Add this new function call
    ])
    initializeWebSocket()
})

// New function to fetch resolutions where the delegate is a pending co-author
async function fetchPendingCoAuthorships() {
    try {
        console.log('Fetching pending co-authorships')
        // Use the general resolution endpoint to get all committee resolutions
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)

        // Filter for resolutions where:
        // 1. Status is 'pending_coauthors'
        // 2. The delegate's country is in the pendingCoAuthors array
        pendingCoAuthorships.value = response.data.filter(r =>
            r.status === 'pending_coauthors' &&
            r.pendingCoAuthors &&
            r.pendingCoAuthors.includes(authStore.user.countryName)
        )

        console.log('Pending co-authorships:', pendingCoAuthorships.value)
    } catch (error) {
        console.error('Error fetching pending co-authorships:', error)
    }
}

// Function to confirm co-authorship
async function confirmCoAuthorship(resolutionId) {
    try {
        console.log('Confirming co-authorship for resolution:', resolutionId)
        await resolutionsService.confirmCoAuthor(resolutionId)
        toast.success('Co-authorship confirmed')

        // Refresh data after confirming
        await Promise.all([
            fetchPendingCoAuthorships(),
            fetchDelegateResolutions()
        ])
    } catch (error) {
        console.error('Error confirming co-authorship:', error)
        toast.error('Failed to confirm co-authorship')
    }
}

// Add this to the handleWebSocketMessage function to refresh pending co-authorships when new resolutions are submitted
function handleWebSocketMessage(data) {
    try {
        switch (data.type) {
            // ... existing cases ...
            case 'resolution_submitted':
                fetchDelegateResolutions()
                fetchPendingCoAuthorships() // Add this line
                break
        }
    } catch (error) {
        console.error("Error handling WebSocket message:", error)
    }
}
</script>