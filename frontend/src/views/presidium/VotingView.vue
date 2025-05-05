<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Voting Management</h1>
                <button @click="showCreateModal = true" class="btn btn-primary" :disabled="!!activeVoting">
                    Start New Voting
                </button>
            </div>
        </header>

        <!-- Active Voting -->
        <div v-if="activeVoting" class="card mb-8">
            <div class="flex items-start justify-between mb-6">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">Active Voting</h2>
                    <p class="mt-1 text-sm text-gray-500">
                        {{ getVotingTitle(activeVoting) }}
                    </p>
                </div>
                <span
                    class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    In Progress
                </span>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                    <h3 class="text-sm font-medium text-gray-500">Yes Votes</h3>
                    <p class="mt-1 text-2xl font-semibold text-green-600">
                        {{ getVoteCount('yes') }}
                    </p>
                </div>
                <div>
                    <h3 class="text-sm font-medium text-gray-500">No Votes</h3>
                    <p class="mt-1 text-2xl font-semibold text-red-600">
                        {{ getVoteCount('no') }}
                    </p>
                </div>
                <div>
                    <h3 class="text-sm font-medium text-gray-500">Abstentions</h3>
                    <p class="mt-1 text-2xl font-semibold text-gray-600">
                        {{ getVoteCount('abstain') }}
                    </p>
                </div>
            </div>

            <div class="mt-6">
                <h3 class="text-sm font-medium text-gray-900 mb-2">Votes Cast</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div v-for="vote in activeVoting.votes" :key="vote.countryName" :class="[
                        'text-sm rounded-md px-3 py-2',
                        vote.vote === 'yes' ? 'bg-green-100 text-green-800' :
                            vote.vote === 'no' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                    ]">
                        {{ vote.countryName }}
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button @click="finalizeVoting" class="btn btn-primary">
                    Finalize Voting
                </button>
            </div>
        </div>

        <!-- Recent Votings -->
        <div class="card">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Recent Votings</h2>

            <div class="space-y-4">
                <div v-for="voting in recentVotings" :key="voting._id"
                    class="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                    <div>
                        <h3 class="font-medium text-gray-900">{{ getVotingTitle(voting) }}</h3>
                        <p class="text-sm text-gray-500">
                            {{ formatDate(voting.createdAt) }}
                        </p>
                    </div>
                    <span :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        voting.result === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                    ]">
                        {{ voting.result }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Create Voting Modal -->
        <TransitionRoot appear :show="showCreateModal" as="template">
            <Dialog as="div" class="relative z-10" @close="showCreateModal = false">
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
                                class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                                    Start New Voting
                                </DialogTitle>

                                <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                                    <div>
                                        <label for="type" class="form-label">Voting Type</label>
                                        <select id="type" v-model="form.type" class="form-input" required>
                                            <option value="simple">Simple</option>
                                            <option value="roll-call">Roll Call</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="target" class="form-label">Target</label>
                                        <select id="target" v-model="form.target" class="form-input" required>
                                            <option value="resolution">Resolution</option>
                                            <option value="amendment">Amendment</option>
                                            <option value="procedure">Procedure</option>
                                        </select>
                                    </div>

                                    <div v-if="form.target !== 'procedure'">
                                        <label for="targetId" class="form-label">Select Item</label>
                                        <select id="targetId" v-model="form.targetId" class="form-input" required>
                                            <option value="">Select Item</option>
                                            <option v-for="item in targetItems" :key="item._id" :value="item._id">
                                                {{ item.title || `Item #${item._id}` }}
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="requiredMajority" class="form-label">Required Majority</label>
                                        <select id="requiredMajority" v-model="form.requiredMajority" class="form-input"
                                            required>
                                            <option value="simple">Simple Majority</option>
                                            <option value="qualified">Qualified Majority (2/3)</option>
                                        </select>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="loading">
                                            {{ loading ? 'Starting...' : 'Start Voting' }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useAuthStore } from '../../stores/auth'
import { votingsService, resolutionsService, amendmentsService } from '../../services/api'
import { toast } from 'vue3-toastify'
import { format } from 'date-fns'

const authStore = useAuthStore()
const activeVoting = ref(null)
const recentVotings = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const targetItems = ref([])

const form = ref({
    type: 'simple',
    target: 'resolution',
    targetId: '',
    requiredMajority: 'simple'
})

onMounted(async () => {
    await Promise.all([
        fetchActiveVoting(),
        fetchRecentVotings()
    ])
})

watch(() => form.value.target, async () => {
    await fetchTargetItems()
})

async function fetchActiveVoting() {
    try {
        const response = await votingsService.getActiveVotingForCommittee(authStore.user.committeeId)
        activeVoting.value = response.data
    } catch (error) {
        console.error('Error fetching active voting:', error)
    }
}

async function fetchRecentVotings() {
    try {
        const response = await votingsService.getVotingsForCommittee(authStore.user.committeeId)
        recentVotings.value = response.data.filter(v => v.result !== null)
    } catch (error) {
        console.error('Error fetching recent votings:', error)
    }
}

async function fetchTargetItems() {
    if (form.value.target === 'procedure') {
        targetItems.value = []
        return
    }

    try {
        const service = form.value.target === 'resolution' ? resolutionsService : amendmentsService
        const response = await service.getForCommittee(authStore.user.committeeId)
        targetItems.value = response.data.filter(item => item.status === 'accepted')
    } catch (error) {
        console.error('Error fetching target items:', error)
    }
}

async function handleSubmit() {
    loading.value = true
    try {
        await votingsService.create({
            ...form.value,
            committeeId: authStore.user.committeeId
        })
        showCreateModal.value = false
        await fetchActiveVoting()
        toast.success('Voting started successfully')
    } catch (error) {
        console.error('Error starting voting:', error)
    } finally {
        loading.value = false
    }
}

async function finalizeVoting() {
    if (!activeVoting.value) return

    try {
        const response = await votingsService.finalize(activeVoting.value._id)
        toast.success(`Voting ${response.data.result}`)
        await Promise.all([
            fetchActiveVoting(),
            fetchRecentVotings()
        ])
    } catch (error) {
        console.error('Error finalizing voting:', error)
    }
}

function getVoteCount(type) {
    if (!activeVoting.value?.votes) return 0
    return activeVoting.value.votes.filter(v => v.vote === type).length
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

function formatDate(date) {
    return format(new Date(date), 'MMM d, yyyy HH:mm')
}
</script>