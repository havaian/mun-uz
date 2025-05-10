<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Presidium Management</h1>
                    <p v-if="selectedCommittee" class="mt-1 text-sm text-gray-500">
                        Committee: {{ selectedCommittee.name }}
                    </p>
                </div>
                <div class="flex items-center space-x-4">
                    <select v-model="selectedCommitteeId" class="form-input" @change="handleCommitteeChange">
                        <option value="">Select Committee</option>
                        <option v-for="committee in committees" :key="committee._id" :value="committee._id">
                            {{ committee.name }}
                        </option>
                    </select>
                    <button @click="showCreateModal = true" class="btn btn-primary" :disabled="!selectedCommitteeId">
                        Add Presidium Member
                    </button>
                </div>
            </div>
        </header>

        <!-- Presidium Members List -->
        <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>

        <div v-else-if="!selectedCommitteeId" class="card text-center py-12">
            <p class="text-gray-500">Please select a committee to manage its presidium members</p>
        </div>

        <div v-else class="space-y-6">
            <div v-if="presidiumMembers.length === 0" class="card text-center py-12">
                <p class="text-gray-500">No presidium members found for this committee. Add your first presidium member
                    to get started.</p>
            </div>

            <div v-for="member in presidiumMembers" :key="member._id" class="card">
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
                                        <p class="text-sm text-gray-500 mt-1">Password should be at least 6 characters
                                        </p>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="formLoading">
                                            {{ formLoading ? 'Adding...' : 'Add Member' }}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Confirmation Modal -->
        <TransitionRoot appear :show="showConfirmModal" as="template">
            <Dialog as="div" class="relative z-10" @close="showConfirmModal = false">
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
                                    Confirm Deletion
                                </DialogTitle>

                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Are you sure you want to remove this presidium member? This action cannot be
                                        undone.
                                    </p>
                                </div>

                                <div class="mt-6 flex justify-end space-x-3">
                                    <button type="button" class="btn btn-outline" @click="showConfirmModal = false">
                                        Cancel
                                    </button>
                                    <button type="button" class="btn bg-red-600 hover:bg-red-700 text-white"
                                        @click="confirmRemove" :disabled="confirmLoading">
                                        {{ confirmLoading ? 'Removing...' : 'Remove' }}
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { committeesService } from '../../services/api'
import { toast } from 'vue3-toastify'

const route = useRoute()
const router = useRouter()

const committees = ref([])
const presidiumMembers = ref([])
const selectedCommitteeId = ref('')
const selectedCommittee = ref(null)
const memberToRemove = ref(null)
const loading = ref(true)
const formLoading = ref(false)
const confirmLoading = ref(false)
const showCreateModal = ref(false)
const showConfirmModal = ref(false)

const form = ref({
    username: '',
    password: ''
})

onMounted(async () => {
    await fetchCommittees()

    // Check if committeeId is in the query params
    if (route.query.committeeId) {
        selectedCommitteeId.value = route.query.committeeId
        await fetchPresidiumMembers()
    }
})

watch(selectedCommitteeId, async (newId) => {
    // Update URL without reloading the page
    if (newId) {
        router.replace({ query: { committeeId: newId } })
    } else {
        router.replace({ query: {} })
    }
})

async function fetchCommittees() {
    try {
        const response = await committeesService.getAll()
        committees.value = response.data
    } catch (error) {
        console.error('Error fetching committees:', error)
        toast.error('Failed to load committees')
    }
}

async function fetchPresidiumMembers() {
    if (!selectedCommitteeId.value) {
        presidiumMembers.value = []
        loading.value = false
        return
    }

    loading.value = true
    try {
        // Find the selected committee
        selectedCommittee.value = committees.value.find(c => c._id === selectedCommitteeId.value)

        // Get presidium members for this committee
        // Note: We're assuming your backend provides an API for this
        // If not, you may need to modify this part
        const response = await committeesService.getPresidiumMembers(selectedCommitteeId.value)
        presidiumMembers.value = response.data
    } catch (error) {
        console.error('Error fetching presidium members:', error)
        toast.error('Failed to load presidium members')
        presidiumMembers.value = []
    } finally {
        loading.value = false
    }
}

function handleCommitteeChange() {
    fetchPresidiumMembers()
}

function getCommitteeName(committeeId) {
    const committee = committees.value.find(c => c._id === committeeId)
    return committee ? committee.name : 'Unknown Committee'
}

async function handleSubmit() {
    if (form.value.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
    }

    formLoading.value = true
    try {
        await committeesService.assignPresidium(selectedCommitteeId.value, {
            username: form.value.username,
            password: form.value.password
        })

        await fetchPresidiumMembers()
        showCreateModal.value = false
        resetForm()
        toast.success('Presidium member added successfully')
    } catch (error) {
        console.error('Error adding presidium member:', error)
        if (error.response?.status === 409) {
            toast.error('Username already exists')
        } else {
            toast.error('Failed to add presidium member')
        }
    } finally {
        formLoading.value = false
    }
}

function handleRemovePresidium(member) {
    memberToRemove.value = member
    showConfirmModal.value = true
}

async function confirmRemove() {
    if (!memberToRemove.value) return

    confirmLoading.value = true
    try {
        await committeesService.removePresidium(
            memberToRemove.value.committeeId,
            memberToRemove.value.username
        )

        await fetchPresidiumMembers()
        showConfirmModal.value = false
        toast.success('Presidium member removed successfully')
    } catch (error) {
        console.error('Error removing presidium member:', error)
        toast.error('Failed to remove presidium member')
    } finally {
        confirmLoading.value = false
        memberToRemove.value = null
    }
}

function resetForm() {
    form.value = {
        username: '',
        password: ''
    }
}
</script>