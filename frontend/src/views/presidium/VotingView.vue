<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Voting Management</h1>
            </div>
        </header>

        <!-- Replace existing voting implementation with VotingManagement component -->
        <VotingManagement :committeeId="authStore.user.committeeId" :sessionId="activeSession?._id || ''"
            :countries="committee?.countries || []" @votingStarted="handleVotingStarted"
            @votingFinalized="handleVotingFinalized" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { sessionsService, committeesService } from '../../services/api'
import VotingManagement from '../../components/voting/VotingManagement.vue'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const committee = ref(null)
const activeSession = ref(null)

// Add handlers for voting events
function handleVotingStarted(voting) {
    toast.success('Voting started successfully')
    // Additional logic for voting started
}

function handleVotingFinalized(result) {
    toast.success(`Voting ${result.result}`)
    // Additional logic for voting finalized
}

onMounted(async () => {
    await Promise.all([
        fetchCommitteeData(),
        fetchActiveSession()
    ])
})

async function fetchCommitteeData() {
    try {
        const response = await committeesService.getById(authStore.user.committeeId)
        committee.value = response.data
    } catch (error) {
        console.error('Error fetching committee data:', error)
    }
}

async function fetchActiveSession() {
    try {
        const response = await sessionsService.getActiveSessionForCommittee(authStore.user.committeeId)
        activeSession.value = response.data
    } catch (error) {
        console.error('Error fetching active session:', error)
    }
}
</script>