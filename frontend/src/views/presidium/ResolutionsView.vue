<template>
    <div>
        <!-- Session Status Alert -->
        <div v-if="!activeSession" class="card mb-8 text-center py-6">
            <div class="flex items-center justify-center space-x-2 text-red-600">
                <ExclamationCircleIcon class="h-5 w-5" />
                <p>No active session. Start a session from the dashboard to enable resolution submission.</p>
            </div>
        </div>

        <!-- Statistics Summary -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Total</h3>
                <div class="text-3xl font-bold text-un-blue">{{ resolutions.length }}</div>
            </div>
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Pending</h3>
                <div class="text-3xl font-bold text-yellow-600">{{ pendingCount }}</div>
            </div>
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Accepted</h3>
                <div class="text-3xl font-bold text-green-600">{{ acceptedCount }}</div>
            </div>
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Rejected</h3>
                <div class="text-3xl font-bold text-red-600">{{ rejectedCount }}</div>
            </div>
        </div>

        <!-- Working Draft -->
        <div v-if="workingDraft" class="card mb-8">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-lg font-medium text-gray-900">Working Draft Resolution</h2>
                    <p class="mt-1 text-sm text-gray-500">{{ workingDraft.title }}</p>
                </div>
                <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Working Draft
                </span>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-700 whitespace-pre-line">{{ workingDraft.content }}</p>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    Authors: {{ workingDraft.authors.join(', ') }}
                </p>
            </div>
            <div class="mt-4 flex justify-end">
                <button @click="viewResolution(workingDraft)" class="btn btn-outline">
                    View Full Details
                </button>
            </div>
        </div>

        <!-- Pending Resolutions -->
        <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Pending Resolutions</h2>
            <div class="space-y-6">
                <div v-for="resolution in pendingResolutions" :key="resolution._id" class="card">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">{{ resolution.title }}</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Authors: {{ resolution.authors.join(', ') }}
                            </p>
                            <p class="mt-1 text-sm text-gray-500">
                                Submitted: {{ formatDate(resolution.submissionTime) }}
                            </p>
                        </div>
                        <span
                            class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Pending Review
                        </span>
                    </div>

                    <div class="mt-4">
                        <p class="text-sm text-gray-700 line-clamp-3">{{ resolution.content }}</p>
                    </div>

                    <div class="mt-6 flex items-center justify-between">
                        <div>
                            <button @click="viewResolution(resolution)" class="btn btn-outline">
                                View Full Text
                            </button>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="w-64">
                                <input type="text" v-model="reviewComments[resolution._id]" class="form-input"
                                    placeholder="Review comments (optional)" />
                            </div>
                            <button @click="() => reviewResolution(resolution._id, 'rejected')"
                                class="btn bg-red-600 hover:bg-red-700 text-white">
                                Reject
                            </button>
                            <button @click="() => reviewResolution(resolution._id, 'accepted')"
                                class="btn bg-green-600 hover:bg-green-700 text-white">
                                Accept
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="pendingResolutions.length === 0" class="text-center py-12 text-gray-500">
                    No resolutions pending review
                </div>
            </div>
        </div>

        <!-- Accepted Resolutions -->
        <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Accepted Resolutions</h2>
            <div class="space-y-6">
                <div v-for="resolution in acceptedResolutions" :key="resolution._id" class="card">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">{{ resolution.title }}</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Authors: {{ resolution.authors.join(', ') }}
                            </p>
                        </div>
                        <span
                            class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Accepted
                        </span>
                    </div>

                    <div class="mt-4">
                        <p class="text-sm text-gray-700 line-clamp-3">{{ resolution.content }}</p>
                    </div>

                    <div class="mt-6 flex justify-between">
                        <button @click="viewResolution(resolution)" class="btn btn-outline">
                            View Full Text
                        </button>
                        <div>
                            <button @click="() => setAsWorkingDraft(resolution._id)" class="btn btn-primary"
                                :disabled="resolution.isWorkingDraft || !activeSession?.quorum">
                                {{ resolution.isWorkingDraft ? 'Current Working Draft' : 'Set as Working Draft' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="acceptedResolutions.length === 0" class="text-center py-12 text-gray-500">
                    No accepted resolutions
                </div>
            </div>
        </div>

        <!-- Rejected Resolutions -->
        <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Rejected Resolutions</h2>
            <div class="space-y-6">
                <div v-for="resolution in rejectedResolutions" :key="resolution._id" class="card">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">{{ resolution.title }}</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Authors: {{ resolution.authors.join(', ') }}
                            </p>
                        </div>
                        <span
                            class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Rejected
                        </span>
                    </div>

                    <div class="mt-4">
                        <p class="text-sm text-gray-700 line-clamp-3">{{ resolution.content }}</p>
                    </div>

                    <div v-if="resolution.reviewComments" class="mt-4">
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">Review Comments:</span>
                            {{ resolution.reviewComments }}
                        </p>
                    </div>

                    <div class="mt-6 flex justify-start">
                        <button @click="viewResolution(resolution)" class="btn btn-outline">
                            View Full Text
                        </button>
                    </div>
                </div>

                <div v-if="rejectedResolutions.length === 0" class="text-center py-12 text-gray-500">
                    No rejected resolutions
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
                                class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div class="flex items-start justify-between">
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

                                <div class="mt-4">
                                    <h4 class="text-xl font-semibold text-gray-900">{{ selectedResolution?.title }}</h4>
                                    <div class="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                                        <p><span class="font-medium">Authors:</span> {{
                                            selectedResolution?.authors?.join(', ') }}</p>
                                        <p><span class="font-medium">Submitted:</span> {{
                                            selectedResolution?.submissionTime ?
                                            formatDate(selectedResolution.submissionTime) : 'N/A' }}</p>
                                        <p v-if="selectedResolution?.reviewTime"><span
                                                class="font-medium">Reviewed:</span> {{
                                            formatDate(selectedResolution.reviewTime) }}</p>
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <h5 class="text-sm font-medium text-gray-700 mb-2">Content:</h5>
                                    <div
                                        class="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto whitespace-pre-line">
                                        {{ selectedResolution?.content }}
                                    </div>
                                </div>

                                <div v-if="selectedResolution?.reviewComments" class="mt-4">
                                    <h5 class="text-sm font-medium text-gray-700 mb-2">Review Comments:</h5>
                                    <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
                                        {{ selectedResolution?.reviewComments }}
                                    </div>
                                </div>

                                <div v-if="selectedResolution?.status === 'draft'" class="mt-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-sm font-medium text-gray-700 mb-2">Review Comments:</label>
                                        <textarea v-model="modalReviewComments" rows="3" class="form-input w-full"
                                            placeholder="Add review comments..."></textarea>
                                    </div>
                                    <div class="flex items-end justify-end space-x-4">
                                        <button @click="() => reviewResolutionFromModal('rejected')"
                                            class="btn bg-red-600 hover:bg-red-700 text-white">
                                            Reject
                                        </button>
                                        <button @click="() => reviewResolutionFromModal('accepted')"
                                            class="btn bg-green-600 hover:bg-green-700 text-white">
                                            Accept
                                        </button>
                                    </div>
                                </div>

                                <div v-if="selectedResolution?.status === 'accepted' && !selectedResolution?.isWorkingDraft"
                                    class="mt-6 flex justify-end">
                                    <button @click="() => setAsWorkingDraftAndClose()" class="btn btn-primary"
                                        :disabled="!activeSession?.quorum">
                                        Set as Working Draft
                                    </button>
                                </div>

                                <div class="mt-6 flex justify-end">
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
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'
import { resolutionsService, sessionsService } from '../../services/api'
import { toast } from 'vue3-toastify'
import { format } from 'date-fns'

const authStore = useAuthStore()
const resolutions = ref([])
const activeSession = ref(null)
const reviewComments = ref({})
const showResolutionModal = ref(false)
const selectedResolution = ref(null)
const modalReviewComments = ref('')
const loading = ref(false)

// Computed properties for filtering resolutions
const pendingResolutions = computed(() => {
    return resolutions.value.filter(r => r.status === 'draft')
})

const acceptedResolutions = computed(() => {
    return resolutions.value.filter(r => r.status === 'accepted')
})

const rejectedResolutions = computed(() => {
    return resolutions.value.filter(r => r.status === 'rejected')
})

const workingDraft = computed(() => {
    return resolutions.value.find(r => r.isWorkingDraft)
})

const pendingCount = computed(() => pendingResolutions.value.length)
const acceptedCount = computed(() => acceptedResolutions.value.length)
const rejectedCount = computed(() => rejectedResolutions.value.length)

onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            fetchResolutions(),
            fetchActiveSession()
        ])
    } catch (error) {
        console.error('Error initializing:', error)
        toast.error('Failed to load data')
    } finally {
        loading.value = false
    }
})

async function fetchResolutions() {
    try {
        console.log("Fetching resolutions...")
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        resolutions.value = response.data
        console.log(`Loaded ${resolutions.value.length} resolutions`)
    } catch (error) {
        console.error('Error fetching resolutions:', error)
        toast.error('Failed to load resolutions')
    }
}

async function fetchActiveSession() {
    try {
        console.log("Fetching active session...")
        const response = await sessionsService.getActiveSessionForCommittee(authStore.user.committeeId)
        activeSession.value = response.data
        console.log("Active session:", activeSession.value ? `Session #${activeSession.value.number}` : "None")
    } catch (error) {
        console.error('Error fetching active session:', error)
    }
}

function viewResolution(resolution) {
    selectedResolution.value = resolution
    modalReviewComments.value = reviewComments.value[resolution._id] || ''
    showResolutionModal.value = true
}

async function reviewResolution(id, status) {
    try {
        const comments = reviewComments.value[id] || ''
        await resolutionsService.review(id, {
            status,
            reviewComments: comments
        })

        // Clear comments for this resolution
        reviewComments.value[id] = ''

        // Refresh resolutions
        await fetchResolutions()

        toast.success(`Resolution ${status === 'accepted' ? 'accepted' : 'rejected'}`)
    } catch (error) {
        console.error('Error reviewing resolution:', error)
        toast.error('Failed to review resolution')
    }
}

async function reviewResolutionFromModal(status) {
    if (!selectedResolution.value) return

    try {
        await resolutionsService.review(selectedResolution.value._id, {
            status,
            reviewComments: modalReviewComments.value
        })

        // Refresh resolutions
        await fetchResolutions()

        // Close modal
        showResolutionModal.value = false

        toast.success(`Resolution ${status === 'accepted' ? 'accepted' : 'rejected'}`)
    } catch (error) {
        console.error('Error reviewing resolution:', error)
        toast.error('Failed to review resolution')
    }
}

async function setAsWorkingDraft(id) {
    if (!activeSession.value?.quorum) {
        toast.error('No active session or quorum not established')
        return
    }

    try {
        await resolutionsService.setAsWorkingDraft(id)
        await fetchResolutions()
        toast.success('Working draft updated')
    } catch (error) {
        console.error('Error setting working draft:', error)
        toast.error('Failed to set working draft')
    }
}

async function setAsWorkingDraftAndClose() {
    if (!selectedResolution.value) return

    if (!activeSession.value?.quorum) {
        toast.error('No active session or quorum not established')
        return
    }

    try {
        await resolutionsService.setAsWorkingDraft(selectedResolution.value._id)
        await fetchResolutions()
        showResolutionModal.value = false
        toast.success('Working draft updated')
    } catch (error) {
        console.error('Error setting working draft:', error)
        toast.error('Failed to set working draft')
    }
}

function formatDate(date) {
    if (!date) return 'N/A'

    try {
        return format(new Date(date), 'MMM d, yyyy HH:mm')
    } catch (error) {
        console.error('Date formatting error:', error)
        return date.toString()
    }
}
</script>

<style>
/* Add line clamp utility for truncating text */
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>