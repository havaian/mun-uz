<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Amendments</h1>
            </div>
        </header>

        <!-- Amendments List -->
        <div class="space-y-6">
            <div v-for="amendment in amendments" :key="amendment._id" class="card">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">
                            {{ getAmendmentTitle(amendment) }}
                        </h3>
                        <p class="mt-1 text-sm text-gray-500">
                            Authors: {{ amendment.authors.join(', ') }}
                        </p>
                    </div>
                    <span :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        amendment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            amendment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                    ]">
                        {{ amendment.status }}
                    </span>
                </div>

                <div class="mt-4">
                    <div class="text-sm text-gray-700">
                        <span class="font-medium">Type:</span>
                        {{ formatActionType(amendment.actionType) }}
                    </div>
                    <div class="text-sm text-gray-700">
                        <span class="font-medium">Part:</span>
                        {{ formatResolutionPart(amendment.resolutionPart) }}
                    </div>
                    <div v-if="amendment.pointNumber" class="text-sm text-gray-700">
                        <span class="font-medium">Point Number:</span>
                        {{ amendment.pointNumber }}
                    </div>
                    <div v-if="amendment.newPointAfter" class="text-sm text-gray-700">
                        <span class="font-medium">New Point After:</span>
                        {{ amendment.newPointAfter }}
                    </div>
                    <div v-if="amendment.content" class="mt-2">
                        <span class="text-sm font-medium text-gray-700">Content:</span>
                        <p class="mt-1 text-sm text-gray-600">{{ amendment.content }}</p>
                    </div>
                </div>

                <div v-if="amendment.status === 'pending'" class="mt-6 flex items-center space-x-4">
                    <button @click="() => reviewAmendment(amendment._id, 'accepted')"
                        class="btn bg-green-600 hover:bg-green-700 text-white">
                        Accept
                    </button>
                    <button @click="() => reviewAmendment(amendment._id, 'rejected')"
                        class="btn bg-red-600 hover:bg-red-700 text-white">
                        Reject
                    </button>
                </div>
            </div>

            <div v-if="amendments.length === 0" class="text-center py-12 text-gray-500">
                No amendments to review
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { amendmentsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const amendments = ref([])

onMounted(async () => {
    await fetchAmendments()
})

async function fetchAmendments() {
    try {
        // TODO: Implement API endpoint to get amendments for committee
        const response = await amendmentsService.getForCommittee(authStore.user.committeeId)
        amendments.value = response.data
    } catch (error) {
        console.error('Error fetching amendments:', error)
    }
}

async function reviewAmendment(id, status) {
    try {
        await amendmentsService.review(id, { status })
        await fetchAmendments()
        toast.success(`Amendment ${status}`)
    } catch (error) {
        console.error('Error reviewing amendment:', error)
    }
}

function getAmendmentTitle(amendment) {
    switch (amendment.actionType) {
        case 'delete':
            return `Delete point ${amendment.pointNumber}`
        case 'modify':
            return `Modify point ${amendment.pointNumber}`
        case 'add':
            return `Add new point after ${amendment.newPointAfter}`
        default:
            return 'Amendment'
    }
}

function formatActionType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1)
}

function formatResolutionPart(part) {
    return part.charAt(0).toUpperCase() + part.slice(1) + ' Clauses'
}
</script>