<template>
    <div class="voting-management">
        <div class="voting-setup" v-if="!activeVoting">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Start New Voting</h3>

            <form @submit.prevent="startVoting" class="space-y-4">
                <div>
                    <label for="type" class="form-label">Voting Type</label>
                    <select id="type" v-model="votingForm.type" class="form-input" required>
                        <option value="simple">Simple</option>
                        <option value="roll-call">Roll Call</option>
                    </select>
                </div>

                <div>
                    <label for="target" class="form-label">Target</label>
                    <select id="target" v-model="votingForm.target" class="form-input" required>
                        <option value="resolution">Resolution</option>
                        <option value="amendment">Amendment</option>
                        <option value="procedure">Procedure</option>
                    </select>
                </div>

                <div v-if="votingForm.target !== 'procedure'">
                    <label for="targetId" class="form-label">Select Item</label>
                    <select id="targetId" v-model="votingForm.targetId" class="form-input" required>
                        <option value="">Select Item</option>
                        <option v-for="item in targetItems" :key="item._id" :value="item._id">
                            {{ item.title || `Item #${item._id}` }}
                        </option>
                    </select>
                </div>

                <div>
                    <label for="requiredMajority" class="form-label">Required Majority</label>
                    <select id="requiredMajority" v-model="votingForm.requiredMajority" class="form-input" required>
                        <option value="simple">Simple Majority (50%+1)</option>
                        <option value="qualified">Qualified Majority (2/3)</option>
                    </select>
                </div>

                <div class="mt-4">
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? 'Starting...' : 'Start Voting' }}
                    </button>
                </div>
            </form>
        </div>

        <div class="active-voting" v-else>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Active Voting</h3>

            <div class="voting-info mb-6">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="font-medium">{{ getVotingTitle(activeVoting) }}</p>
                        <p class="text-sm text-gray-500">
                            Majority: {{ activeVoting.requiredMajority === 'qualified' ? '2/3' : 'Simple' }}
                        </p>
                    </div>
                    <span
                        class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        In Progress
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Yes Votes</h4>
                    <p class="mt-1 text-2xl font-semibold text-green-600">
                        {{ getVoteCount('yes') }}
                    </p>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-500">No Votes</h4>
                    <p class="mt-1 text-2xl font-semibold text-red-600">
                        {{ getVoteCount('no') }}
                    </p>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Abstentions</h4>
                    <p class="mt-1 text-2xl font-semibold text-gray-600">
                        {{ getVoteCount('abstain') }}
                    </p>
                </div>
            </div>

            <div v-if="activeVoting.type === 'roll-call'" class="mb-6">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Roll Call Voting</h4>
                <div class="space-y-2">
                    <div v-for="country in countries" :key="country.name"
                        :class="['p-3 border rounded-md', getCurrentCountryClass(country.name)]">
                        <div class="flex items-center justify-between">
                            <span>{{ country.name }}</span>
                            <div class="flex space-x-2" v-if="!hasVoted(country.name)">
                                <button @click="() => recordVote(country.name, 'yes')"
                                    class="btn py-1 bg-green-600 hover:bg-green-700 text-white text-xs">Yes</button>
                                <button @click="() => recordVote(country.name, 'no')"
                                    class="btn py-1 bg-red-600 hover:bg-red-700 text-white text-xs">No</button>
                                <button @click="() => recordVote(country.name, 'abstain')"
                                    class="btn py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs">Abstain</button>
                            </div>
                            <div v-else>
                                <span :class="{
                                    'text-green-600': getCountryVote(country.name) === 'yes',
                                    'text-red-600': getCountryVote(country.name) === 'no',
                                    'text-gray-600': getCountryVote(country.name) === 'abstain'
                                }">
                                    Voted: {{ getCountryVote(country.name).toUpperCase() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="mb-6">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Votes Cast</h4>
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

            <div class="flex justify-end">
                <button @click="finalizeVoting" class="btn btn-primary">
                    Finalize Voting
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { votingsService, resolutionsService, amendmentsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const props = defineProps({
    committeeId: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    countries: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['votingStarted', 'votingFinalized'])

const activeVoting = ref(null)
const targetItems = ref([])
const loading = ref(false)

const votingForm = ref({
    type: 'simple',
    target: 'resolution',
    targetId: '',
    requiredMajority: 'simple'
})

// Watch for changes in the target to load appropriate items
watch(() => votingForm.value.target, fetchTargetItems)

onMounted(async () => {
    await fetchActiveVoting()
})

async function fetchActiveVoting() {
    try {
        const response = await votingsService.getActiveVotingForCommittee(props.committeeId)
        activeVoting.value = response.data
    } catch (error) {
        console.error('Error fetching active voting:', error)
    }
}

async function fetchTargetItems() {
    if (votingForm.value.target === 'procedure') {
        targetItems.value = []
        return
    }

    try {
        const service = votingForm.value.target === 'resolution' ? resolutionsService : amendmentsService
        const response = await service.getForCommittee(props.committeeId)
        targetItems.value = response.data.filter(item => item.status === 'accepted')
    } catch (error) {
        console.error('Error fetching target items:', error)
    }
}

async function startVoting() {
    loading.value = true
    try {
        const response = await votingsService.create({
            ...votingForm.value,
            committeeId: props.committeeId,
            sessionId: props.sessionId
        })
        activeVoting.value = response.data
        emit('votingStarted', response.data)
        toast.success('Voting started successfully')
    } catch (error) {
        console.error('Error starting voting:', error)
        toast.error('Failed to start voting')
    } finally {
        loading.value = false
    }
}

async function recordVote(countryName, vote) {
    if (!activeVoting.value) return

    try {
        const updatedVoting = await votingsService.recordVote(activeVoting.value._id, countryName, vote)
        activeVoting.value = updatedVoting
    } catch (error) {
        console.error('Error recording vote:', error)
        toast.error('Failed to record vote')
    }
}

async function finalizeVoting() {
    if (!activeVoting.value) return

    try {
        const result = await votingsService.finalize(activeVoting.value._id)
        toast.success(`Voting ${result.data.result}`)
        activeVoting.value = null
        emit('votingFinalized', result.data)
    } catch (error) {
        console.error('Error finalizing voting:', error)
        toast.error('Failed to finalize voting')
    }
}

function getVoteCount(type) {
    if (!activeVoting.value?.votes) return 0
    return activeVoting.value.votes.filter(v => v.vote === type).length
}

function hasVoted(countryName) {
    if (!activeVoting.value?.votes) return false
    return activeVoting.value.votes.some(v => v.countryName === countryName)
}

function getCountryVote(countryName) {
    if (!activeVoting.value?.votes) return ''
    const vote = activeVoting.value.votes.find(v => v.countryName === countryName)
    return vote ? vote.vote : ''
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

function getCurrentCountryClass(countryName) {
    if (!activeVoting.value?.votes) return 'bg-white'

    const vote = activeVoting.value.votes.find(v => v.countryName === countryName)
    if (!vote) return 'bg-white'

    switch (vote.vote) {
        case 'yes':
            return 'bg-green-50 border-green-200'
        case 'no':
            return 'bg-red-50 border-red-200'
        case 'abstain':
            return 'bg-gray-50 border-gray-200'
        default:
            return 'bg-white'
    }
}
</script>