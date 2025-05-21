<template>
    <div class="roll-call">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Roll Call</h3>

        <div class="mb-4 flex justify-between items-center">
            <div>
                <span class="text-sm font-medium">Present: {{ presentCount }} / {{ countries.length }}</span>
                <span :class="[
                    'ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    hasQuorum ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]">
                    {{ hasQuorum ? 'Quorum Established' : 'No Quorum' }}
                </span>
            </div>
            <button @click="updateRollCall" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Updating...' : 'Update Roll Call' }}
            </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="country in countries" :key="country.name" class="flex items-center space-x-2">
                <input type="checkbox" :id="country.name" v-model="presentCountries" :value="country.name"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <label :for="country.name" class="text-sm text-gray-700">
                    {{ country.name }}
                    <span v-if="country.isPermanentMember" class="text-xs text-blue-600 ml-1">(P)</span>
                    <span v-if="country.hasVetoRight" class="text-xs text-red-600 ml-1">(V)</span>
                </label>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sessionsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const props = defineProps({
    sessionId: {
        type: String,
        required: true
    },
    countries: {
        type: Array,
        required: true
    },
    initialPresentCountries: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['rollCallUpdated', 'quorumChanged'])

const presentCountries = ref([...props.initialPresentCountries])
const loading = ref(false)

const presentCount = computed(() => presentCountries.value.length)
const hasQuorum = computed(() => {
    return presentCount.value >= Math.ceil(props.countries.length / 2)
})

async function updateRollCall() {
    loading.value = true
    try {
        await sessionsService.updateRollCall(props.sessionId, presentCountries.value)
        emit('rollCallUpdated', presentCountries.value)
        emit('quorumChanged', hasQuorum.value)
        toast.success('Roll call updated successfully')
    } catch (error) {
        console.error('Error updating roll call:', error)
        toast.error('Failed to update roll call')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    // Emit initial values
    emit('quorumChanged', hasQuorum.value)
})
</script>