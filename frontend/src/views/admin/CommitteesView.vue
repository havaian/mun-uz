<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Committees</h1>
                    <p v-if="selectedEvent" class="mt-1 text-sm text-gray-500">
                        Event: {{ selectedEvent.name }}
                    </p>
                </div>
                <div class="flex items-center space-x-4">
                    <select v-model="selectedEventId" class="form-input" @change="handleEventChange">
                        <option value="">All Events</option>
                        <option v-for="event in events" :key="event._id" :value="event._id">
                            {{ event.name }}
                        </option>
                    </select>
                    <button @click="showCreateModal = true" class="btn btn-primary" :disabled="!selectedEventId">
                        Create Committee
                    </button>
                </div>
            </div>
        </header>

        <!-- Committees Grid -->
        <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>

        <div v-else-if="!selectedEventId" class="card text-center py-12">
            <p class="text-gray-500">Please select an event to manage its committees</p>
        </div>

        <div v-else-if="committees.length === 0" class="card text-center py-12">
            <p class="text-gray-500">No committees found for this event. Create your first committee to get started.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="committee in committees" :key="committee._id" class="card">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">{{ committee.name }}</h3>
                        <p class="text-sm text-gray-500">{{ getCommitteeTypeName(committee.type) }}</p>
                    </div>
                    <span :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        committee.status === 'active' ? 'bg-green-100 text-green-800' :
                            committee.status === 'setup' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                    ]">
                        {{ committee.status }}
                    </span>
                </div>

                <div class="mt-4">
                    <p class="text-sm text-gray-600">
                        {{ committee.countries?.length || 0 }} Countries
                    </p>
                    <p class="text-sm text-gray-600">
                        Min. Resolution Authors: {{ committee.minResolutionAuthors }}
                    </p>
                </div>

                <div class="mt-6 flex flex-wrap items-center gap-4">
                    <button @click="() => handleEditCommittee(committee)"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Edit
                    </button>
                    <button @click="() => showQRGenerator(committee._id)"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Generate QR Codes
                    </button>
                    <button v-if="committee.status === 'setup'"
                        @click="() => updateCommitteeStatus(committee._id, 'active')"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Activate
                    </button>
                    <button v-if="committee.status === 'active'"
                        @click="() => updateCommitteeStatus(committee._id, 'completed')"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Complete
                    </button>
                    <router-link :to="`/admin/presidium?committeeId=${committee._id}`"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Manage Presidium
                    </router-link>
                </div>
            </div>
        </div>

        <!-- QR Code Generator Section -->
        <div v-if="selectedQRCommitteeId" class="mt-8 card p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">QR Code Generation</h2>
                <button @click="selectedQRCommitteeId = null" class="text-gray-500 hover:text-gray-700">
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <QRCodeGenerator :committeeId="selectedQRCommitteeId" />
        </div>

        <!-- Create/Edit Committee Modal -->
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
                                class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                                    {{ editingCommittee ? 'Edit Committee' : 'Create Committee' }}
                                </DialogTitle>

                                <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                                    <div>
                                        <label for="name" class="form-label">Committee Name</label>
                                        <input id="name" v-model="form.name" type="text" class="form-input" required />
                                    </div>

                                    <div>
                                        <label for="type" class="form-label">Type</label>
                                        <select id="type" v-model="form.type" class="form-input" required>
                                            <option value="GA">General Assembly</option>
                                            <option value="SC">Security Council</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="minResolutionAuthors" class="form-label">
                                            Minimum Resolution Authors
                                        </label>
                                        <input id="minResolutionAuthors" v-model.number="form.minResolutionAuthors"
                                            type="number" min="1" class="form-input" required />
                                    </div>

                                    <div v-if="editingCommittee">
                                        <label for="status" class="form-label">Status</label>
                                        <select id="status" v-model="form.status" class="form-input">
                                            <option value="setup">Setup</option>
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div class="flex justify-between items-center">
                                            <label class="form-label">Countries</label>
                                            <div class="flex items-center">
                                                <input type="text" v-model="countrySearch"
                                                    placeholder="Search countries" class="form-input text-sm py-1" />
                                            </div>
                                        </div>
                                        <div class="mt-2 space-y-2">
                                            <div v-for="(country, index) in form.countries" :key="index"
                                                class="flex items-center space-x-2">
                                                <select v-model="country.name" class="form-input flex-1" required>
                                                    <option value="">Select a country</option>
                                                    <option v-for="c in filteredCountries" :key="c" :value="c">
                                                        {{ c }}
                                                    </option>
                                                </select>

                                                <div v-if="form.type === 'SC'" class="flex items-center space-x-2">
                                                    <label class="inline-flex items-center">
                                                        <input type="checkbox" v-model="country.isPermanentMember"
                                                            class="form-checkbox" />
                                                        <span class="ml-2 text-sm">Permanent</span>
                                                    </label>
                                                    <label class="inline-flex items-center">
                                                        <input type="checkbox" v-model="country.hasVetoRight"
                                                            class="form-checkbox" />
                                                        <span class="ml-2 text-sm">Veto</span>
                                                    </label>
                                                </div>

                                                <button type="button" @click="() => removeCountry(index)"
                                                    class="text-red-600 hover:text-red-700">
                                                    <TrashIcon class="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <button type="button" @click="addCountry"
                                            class="mt-2 text-sm text-un-blue hover:text-blue-700">
                                            Add Country
                                        </button>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="formLoading">
                                            {{ formLoading ? 'Saving...' : 'Save Committee' }}
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
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { committeesService, eventsService, countriesService } from '../../services/api'
import { toast } from 'vue3-toastify'
import QRCodeGenerator from '../../components/admin/QRCodeGenerator.vue'

const route = useRoute()
const router = useRouter()

const committees = ref([])
const events = ref([])
const countries = ref([])
const countrySearch = ref('')
const selectedEventId = ref('')
const selectedEvent = ref(null)
const selectedQRCommitteeId = ref(null)

const loading = ref(false)
const formLoading = ref(false)
const showCreateModal = ref(false)
const editingCommittee = ref(null)

const form = ref({
    name: '',
    type: 'GA',
    minResolutionAuthors: 3,
    status: 'setup',
    countries: [],
    eventId: ''
})

const filteredCountries = computed(() => {
    if (!countrySearch.value) return countries.value
    return countries.value.filter(c =>
        c.toLowerCase().includes(countrySearch.value.toLowerCase())
    )
})

onMounted(async () => {
    await Promise.all([
        fetchEvents(),
        fetchCountries()
    ])

    // Check if eventId is in the query params
    if (route.query.eventId) {
        selectedEventId.value = route.query.eventId
        await fetchCommittees()
    } else {
        // If no event ID in query, we show the selection prompt instead of a loader
        loading.value = false
    }
})

watch(selectedEventId, async (newId) => {
    // Update URL without reloading the page
    if (newId) {
        router.replace({ query: { eventId: newId } })
    } else {
        router.replace({ query: {} })
    }
})

async function fetchEvents() {
    try {
        const response = await eventsService.getAll()
        events.value = response.data
    } catch (error) {
        console.error('Error fetching events:', error)
        toast.error('Failed to load events')
    }
}

async function fetchCountries() {
    try {
        const response = await countriesService.getAll()
        // Extract country names from the API response
        countries.value = response.data.map(country => country.name.en)
    } catch (error) {
        console.error('Error fetching countries:', error)
        toast.error('Failed to load countries')
        // Fallback to empty array if API fails
        countries.value = []
    }
}

async function fetchCommittees() {
    if (!selectedEventId.value) {
        committees.value = []
        loading.value = false
        return
    }

    loading.value = true
    try {
        const [committeeResponse, eventResponse] = await Promise.all([
            committeesService.getForEvent(selectedEventId.value),
            eventsService.getById(selectedEventId.value)
        ])

        committees.value = committeeResponse.data
        selectedEvent.value = eventResponse.data
    } catch (error) {
        console.error('Error fetching committees:', error)
        toast.error('Failed to load committees')
    } finally {
        loading.value = false
    }
}

function handleEventChange() {
    fetchCommittees()
}

function getCommitteeTypeName(type) {
    switch (type) {
        case 'GA': return 'General Assembly'
        case 'SC': return 'Security Council'
        case 'other': return 'Other'
        default: return type
    }
}

function handleEditCommittee(committee) {
    editingCommittee.value = committee
    form.value = {
        name: committee.name,
        type: committee.type,
        minResolutionAuthors: committee.minResolutionAuthors,
        status: committee.status,
        countries: [...(committee.countries || [])],
        eventId: committee.eventId
    }
    showCreateModal.value = true
}

function showQRGenerator(committeeId) {
    selectedQRCommitteeId.value = committeeId
}

function addCountry() {
    form.value.countries.push({
        name: '',
        isPermanentMember: false,
        hasVetoRight: false
    })
}

function removeCountry(index) {
    form.value.countries.splice(index, 1)
}

async function handleSubmit() {
    // Validate countries (must be unique)
    const countryNames = form.value.countries.map(c => c.name)
    if (new Set(countryNames).size !== countryNames.length) {
        toast.error('Each country must be unique')
        return
    }

    formLoading.value = true
    try {
        const committeeData = {
            ...form.value,
            eventId: selectedEventId.value
        }

        if (editingCommittee.value) {
            await committeesService.update(editingCommittee.value._id, committeeData)
            toast.success('Committee updated successfully')
        } else {
            await committeesService.create(committeeData)
            toast.success('Committee created successfully')
        }
        await fetchCommittees()
        showCreateModal.value = false
        resetForm()
    } catch (error) {
        console.error('Error saving committee:', error)
        toast.error('Failed to save committee')
    } finally {
        formLoading.value = false
    }
}

async function updateCommitteeStatus(committeeId, status) {
    try {
        await committeesService.update(committeeId, { status })
        await fetchCommittees()
        toast.success(`Committee ${status === 'active' ? 'activated' : 'completed'} successfully`)
    } catch (error) {
        console.error('Error updating committee status:', error)
        toast.error('Failed to update committee status')
    }
}

function resetForm() {
    form.value = {
        name: '',
        type: 'GA',
        minResolutionAuthors: 3,
        status: 'setup',
        countries: [],
        eventId: selectedEventId.value
    }
    editingCommittee.value = null
}
</script>