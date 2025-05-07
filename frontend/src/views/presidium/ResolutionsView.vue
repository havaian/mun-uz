<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Resolutions Management</h1>
            </div>
        </header>

        <!-- Active Session Status -->
        <div v-if="!activeSession" class="card mb-8 text-center py-6">
            <p class="text-gray-500">No active session</p>
        </div>
        <div v-else-if="!activeSession.quorum" class="card mb-8 text-center py-6">
            <p class="text-gray-500">Quorum not established</p>
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
                <p class="text-sm text-gray-700">{{ workingDraft.content }}</p>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    Authors: {{ workingDraft.authors.join(', ') }}
                </p>
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
                        </div>
                        <span
                            class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Pending Review
                        </span>
                    </div>

                    <div class="mt-4">
                        <p class="text-sm text-gray-700">{{ resolution.content }}</p>
                    </div>

                    <div class="mt-6 flex items-center justify-between">
                        <div>
                            <label for="reviewComments" class="form-label">Review Comments (optional)</label>
                            <input type="text" id="reviewComments" v-model="reviewComments[resolution._id]"
                                class="form-input" placeholder="Add review comments..." />
                        </div>
                        <div class="flex items-center space-x-4">
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
                        <p class="text-sm text-gray-700">{{ resolution.content }}</p>
                    </div>

                    <div class="mt-6">
                        <button @click="() => setAsWorkingDraft(resolution._id)" class="btn btn-primary"
                            :disabled="resolution.isWorkingDraft || !activeSession?.quorum">
                            {{ resolution.isWorkingDraft ? 'Current Working Draft' : 'Set as Working Draft' }}
                        </button>
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
                        <p class="text-sm text-gray-700">{{ resolution.content }}</p>
                    </div>

                    <div v-if="resolution.reviewComments" class="mt-4">
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">Review Comments:</span>
                            {{ resolution.reviewComments }}
                        </p>
                    </div>
                </div>

                <div v-if="rejectedResolutions.length === 0" class="text-center py-12 text-gray-500">
                    No rejected resolutions
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { resolutionsService, sessionsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const resolutions = ref([])
const activeSession = ref(null)
const workingDraft = ref(null)
const reviewComments = ref({})

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

onMounted(async () => {
    await Promise.all([
        fetchResolutions(),
        fetchActiveSession()
    ])
})

async function fetchResolutions() {
    try {
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        resolutions.value = response.data
        workingDraft.value = response.data.find(r => r.isWorkingDraft)
    } catch (error) {
        console.error('Error fetching resolutions:', error)
    }
}

async function fetchActiveSession() {
    try {
        const response = await sessionsService.getForCommittee(authStore.user.committeeId)
        activeSession.value = response.data.find(s => s.status === 'active')
    } catch (error) {
        console.error('Error fetching active session:', error)
    }
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
    }
}
</script>