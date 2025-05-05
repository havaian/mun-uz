<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Presidium Management</h1>
                <button @click="showCreateModal = true" class="btn btn-primary">
                    Add Presidium Member
                </button>
            </div>
        </header>

        <!-- Committee Selection -->
        <div class="mb-8">
            <label for="committee" class="form-label">Select Committee</label>
            <select id="committee" v-model="selectedCommitteeId" class="form-input max-w-md">
                <option value="">All Committees</option>
                <option v-for="committee in committees" :key="committee._id" :value="committee._id">
                    {{ committee.name }}
                </option>
            </select>
        </div>

        <!-- Presidium Members List -->
        <div class="space-y-6">
            <div v-for="member in filteredMembers" :key="member._id" class="card">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">{{ member.username }}</h3>
                        <p class="mt-1 text-sm text-gray-500">
                            Assigned to: {{ getCommitteeName(member.committeeId) }}
                        </p>
                    </div>
                    <button @click="() => handleRemovePresidium(member)"
                        class="text-sm text-red-600 hover:text-red-700">
                        Remove
                    </button>
                </div>
            </div>

            <div v-if="filteredMembers.length === 0" class="text-center py-12 text-gray-500">
                No presidium members found
            </div>
        </div>

        <!-- Create Presidium Modal -->
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
                                    Add Presidium Member
                                </DialogTitle>

                                <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                                    <div>
                                        <label for="username" class="form-label">Username</label>
                                        <input id="username" v-model="form.username" type="text" class="form-input"
                                            required />
                                    </div>

                                    <div>
                                        <label for="password" class="form-label">Password</label>
                                        <input id="password" v-model="form.password" type="password" class="form-input"
                                            required />
                                    </div>

                                    <div>
                                        <label for="committeeId" class="form-label">Committee</label>
                                        <select id="committeeId" v-model="form.committeeId" class="form-input" required>
                                            <option value="">Select Committee</option>
                                            <option v-for="committee in committees" :key="committee._id"
                                                :value="committee._id">
                                                {{ committee.name }}
                                            </option>
                                        </select>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="loading">
                                            {{ loading ? 'Adding...' : 'Add Member' }}
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
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { committeesService } from '../../services/api'
import { toast } from 'vue3-toastify'

const committees = ref([])
const presidiumMembers = ref([])
const selectedCommitteeId = ref('')
const loading = ref(false)
const showCreateModal = ref(false)

const form = ref({
    username: '',
    password: '',
    committeeId: ''
})

const filteredMembers = computed(() => {
    if (!selectedCommitteeId.value) return presidiumMembers.value
    return presidiumMembers.value.filter(member => member.committeeId === selectedCommitteeId.value)
})

onMounted(async () => {
    await Promise.all([
        fetchCommittees(),
        fetchPresidiumMembers()
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

async function fetchPresidiumMembers() {
    try {
        // TODO: Implement API endpoint
        presidiumMembers.value = []
    } catch (error) {
        console.error('Error fetching presidium members:', error)
    }
}

function getCommitteeName(committeeId) {
    const committee = committees.value.find(c => c._id === committeeId)
    return committee ? committee.name : 'Unknown Committee'
}

async function handleSubmit() {
    loading.value = true
    try {
        await committeesService.assignPresidium(form.value.committeeId, {
            username: form.value.username,
            password: form.value.password
        })
        await fetchPresidiumMembers()
        showCreateModal.value = false
        resetForm()
        toast.success('Presidium member added successfully')
    } catch (error) {
        console.error('Error adding presidium member:', error)
    } finally {
        loading.value = false
    }
}

async function handleRemovePresidium(member) {
    if (!confirm('Are you sure you want to remove this presidium member?')) return

    try {
        await committeesService.removePresidium(member.committeeId, member.username)
        await fetchPresidiumMembers()
        toast.success('Presidium member removed successfully')
    } catch (error) {
        console.error('Error removing presidium member:', error)
    }
}

function resetForm() {
    form.value = {
        username: '',
        password: '',
        committeeId: ''
    }
}
</script>