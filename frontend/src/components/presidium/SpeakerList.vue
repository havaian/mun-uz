<template>
    <div class="speaker-list">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Speaker List</h3>

        <div class="mb-4">
            <div class="flex space-x-2">
                <select v-model="selectedCountry" class="form-input flex-1">
                    <option value="">Select a country</option>
                    <option v-for="country in availableCountries" :key="country" :value="country">
                        {{ country }}
                    </option>
                </select>
                <button @click="addSpeaker" class="btn btn-primary" :disabled="!selectedCountry">
                    Add Speaker
                </button>
            </div>
        </div>

        <div v-if="speakers.length === 0" class="text-center py-4 text-gray-500">
            No speakers in the list
        </div>

        <div v-else class="space-y-2">
            <div v-for="(speaker, index) in speakers" :key="index"
                class="flex items-center justify-between border rounded-md p-3"
                :class="currentSpeakerIndex === index ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'">
                <div class="flex items-center">
                    <span class="font-medium mr-2">{{ index + 1 }}.</span>
                    <span>{{ speaker }}</span>
                    <span v-if="currentSpeakerIndex === index" class="ml-2 text-blue-600 text-sm">(Current)</span>
                </div>
                <div class="flex space-x-2">
                    <button v-if="currentSpeakerIndex !== index" @click="() => makeCurrentSpeaker(index)"
                        class="text-xs btn bg-blue-100 text-blue-800 hover:bg-blue-200 py-1">
                        Set as Current
                    </button>
                    <button @click="() => removeSpeaker(index)"
                        class="text-xs btn bg-red-100 text-red-800 hover:bg-red-200 py-1">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    countries: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['speakerAdded', 'speakerRemoved', 'currentSpeakerChanged'])

const speakers = ref([])
const selectedCountry = ref('')
const currentSpeakerIndex = ref(-1)

const availableCountries = computed(() => {
    return props.countries.filter(country => !speakers.value.includes(country))
})

function addSpeaker() {
    if (selectedCountry.value && !speakers.value.includes(selectedCountry.value)) {
        speakers.value.push(selectedCountry.value)
        emit('speakerAdded', selectedCountry.value, speakers.value.length - 1)
        selectedCountry.value = ''
    }
}

function removeSpeaker(index) {
    const removed = speakers.value[index]
    speakers.value.splice(index, 1)

    // Update current speaker index if needed
    if (currentSpeakerIndex.value === index) {
        currentSpeakerIndex.value = -1
        emit('currentSpeakerChanged', null)
    } else if (currentSpeakerIndex.value > index) {
        currentSpeakerIndex.value--
    }

    emit('speakerRemoved', removed, index)
}

function makeCurrentSpeaker(index) {
    currentSpeakerIndex.value = index
    emit('currentSpeakerChanged', speakers.value[index])
}
</script>