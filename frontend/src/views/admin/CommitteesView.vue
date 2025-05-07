<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Committees</h1>
                <button @click="showCreateModal = true" class="btn btn-primary">
                    Create Committee
                </button>
            </div>
        </header>

        <!-- Committees Grid -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="committee in committees" :key="committee._id" class="card">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">{{ committee.name }}</h3>
                        <p class="text-sm text-gray-500">{{ committee.type }}</p>
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

                <div class="mt-6 flex items-center justify-between">
                    <button @click="() => handleEditCommittee(committee)"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Edit
                    </button>
                    <button @click="() => generateQRCodes(committee._id)"
                        class="text-sm text-un-blue hover:text-blue-700">
                        Generate QR Codes
                    </button>
                </div>
            </div>
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

                                    <div>
                                        <label class="form-label">Countries</label>
                                        <div class="mt-2 space-y-2">
                                            <div v-for="(country, index) in form.countries" :key="index"
                                                class="flex items-center space-x-2">
                                                <select v-model="country.name" class="form-input flex-1" required>
                                                    <option value="">Select a country</option>
                                                    <option v-for="c in availableCountries" :key="c" :value="c">
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
                                        <button type="submit" class="btn btn-primary" :disabled="loading">
                                            {{ loading ? 'Saving...' : 'Save Committee' }}
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
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { committeesService } from '../../services/api'
import { toast } from 'vue3-toastify'

const committees = ref([])
const availableCountries = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const editingCommittee = ref(null)

const form = ref({
    name: '',
    type: 'GA',
    minResolutionAuthors: 3,
    countries: []
})

onMounted(async () => {
    await Promise.all([
        fetchCommittees(),
        fetchCountries()
    ])
})

async function fetchCommittees() {
    try {
        const response = await committeesService.getAll()
        committees.value = response.data
    } catch (error) {
        console.error('Error fetching committees:', error)
    }
}

async function fetchCountries() {
    try {
        const response = await countriesService.getAll()
        availableCountries.value = response.data.map(country => country.name.en)
    } catch (error) {
        console.error('Error fetching countries:', error)
    }
}

function handleEditCommittee(committee) {
    editingCommittee.value = committee
    form.value = {
        name: committee.name,
        type: committee.type,
        minResolutionAuthors: committee.minResolutionAuthors,
        countries: [...committee.countries]
    }
    showCreateModal.value = true
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
    loading.value = true
    try {
        if (editingCommittee.value) {
            await committeesService.update(editingCommittee.value._id, form.value)
            toast.success('Committee updated successfully')
        } else {
            await committeesService.create(form.value)
            toast.success('Committee created successfully')
        }
        await fetchCommittees()
        showCreateModal.value = false
        resetForm()
    } catch (error) {
        console.error('Error saving committee:', error)
    } finally {
        loading.value = false
    }
}

async function generateQRCodes(committeeId) {
    try {
        const response = await committeesService.generateQRCodes(committeeId)
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `committee_${committeeId}_qrcodes.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('Error generating QR codes:', error)
        toast.error('Failed to generate QR codes')
    }
}

function resetForm() {
    form.value = {
        name: '',
        type: 'GA',
        minResolutionAuthors: 3,
        countries: []
    }
    editingCommittee.value = null
}
</script>