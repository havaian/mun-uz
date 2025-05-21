<template>
    <div class="co-authorship-confirmation">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Pending Co-authorship Requests</h3>

        <div v-if="pendingResolutions.length === 0" class="text-center py-6 text-gray-500">
            No pending co-authorship requests
        </div>

        <div v-else class="space-y-4">
            <div v-for="resolution in pendingResolutions" :key="resolution._id" class="card p-4">
                <div class="flex items-start justify-between">
                    <div>
                        <h4 class="font-medium text-gray-900">{{ resolution.title }}</h4>
                        <p class="text-sm text-gray-500">
                            Main author: {{ resolution.authors[0] }}
                        </p>
                        <p class="text-sm text-gray-500">
                            Other co-authors: {{ getOtherAuthors(resolution) }}
                        </p>
                    </div>
                    <span
                        class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Awaiting Confirmation
                    </span>
                </div>

                <div class="mt-4">
                    <div v-if="resolution.content.startsWith('http')" class="text-sm text-gray-700">
                        <a :href="resolution.content" target="_blank" class="text-blue-600 hover:underline">
                            View Resolution Document
                        </a>
                    </div>
                    <div v-else class="text-sm text-gray-700 line-clamp-3">
                        {{ resolution.content }}
                    </div>
                </div>

                <div class="mt-4 flex justify-end space-x-4">
                    <button @click="() => rejectCoAuthorship(resolution._id)"
                        class="btn bg-red-100 text-red-800 hover:bg-red-200">
                        Decline
                    </button>
                    <button @click="() => confirmCoAuthorship(resolution._id)"
                        class="btn bg-green-600 hover:bg-green-700 text-white">
                        Confirm Co-authorship
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { resolutionsService } from '../../services/api'
import { useAuthStore } from '../stores/auth'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const allResolutions = ref([])
const loading = ref(false)

// Filter resolutions where the current delegate is listed as a pending co-author
const pendingResolutions = computed(() => {
    return allResolutions.value.filter(resolution =>
        resolution.status === 'pending_coauthors' &&
        resolution.pendingCoAuthors?.includes(authStore.user.countryName)
    )
})

// Get other co-authors except the main author and current delegate
function getOtherAuthors(resolution) {
    const otherAuthors = resolution.authors.filter(
        author => author !== resolution.authors[0] && author !== authStore.user.countryName
    )

    if (otherAuthors.length === 0) return 'None'
    return otherAuthors.join(', ')
}

async function fetchResolutions() {
    loading.value = true
    try {
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        allResolutions.value = response.data
    } catch (error) {
        console.error('Error fetching resolutions:', error)
        toast.error('Failed to load co-authorship requests')
    } finally {
        loading.value = false
    }
}

async function confirmCoAuthorship(resolutionId) {
    try {
        await resolutionsService.confirmCoAuthor(resolutionId)
        await fetchResolutions()
        toast.success('Co-authorship confirmed')
    } catch (error) {
        console.error('Error confirming co-authorship:', error)
        toast.error('Failed to confirm co-authorship')
    }
}

async function rejectCoAuthorship(resolutionId) {
    try {
        // This endpoint would need to be added to the backend
        await resolutionsService.rejectCoAuthor(resolutionId)
        await fetchResolutions()
        toast.success('Co-authorship declined')
    } catch (error) {
        console.error('Error declining co-authorship:', error)
        toast.error('Failed to decline co-authorship')
    }
}

onMounted(() => {
    fetchResolutions()
})
</script>