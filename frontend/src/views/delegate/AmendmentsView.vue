<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Amendments</h1>
                <button @click="showCreateModal = true" class="btn btn-primary" :disabled="!workingDraft || !activeSession?.quorum">
                    Submit Amendment
                </button>
            </div>
        </header>

        <!-- Active Session Status -->
        <div v-if="!activeSession" class="card mb-8 text-center py-6">
            <p class="text-gray-500">No active session</p>
        </div>
        <div v-else-if="!workingDraft" class="card mb-8 text-center py-6">
            <p class="text-gray-500">No working draft resolution available</p>
        </div>

        <!-- Working Draft -->
        <div v-if="workingDraft" class="card mb-8">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-lg font-medium text-gray-900">Working Draft Resolution</h2>
                    <p class="mt-1 text-sm text-gray-500">{{ workingDraft.title }}</p>
                </div>
                <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Working Draft
                </span>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-700">{{ workingDraft.content }}</p>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    Authors: {{ workingDraft.authors.join(', ') }}
                </p>
            </div>
        </div>

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
                    <div v-if="amendment.newPointAfter !== undefined" class="text-sm text-gray-700">
                        <span class="font-medium">New Point After:</span>
                        {{ amendment.newPointAfter }}
                    </div>
                    <div v-if="amendment.content" class="mt-2">
                        <span class="text-sm font-medium text-gray-700">Content:</span>
                        <p class="mt-1 text-sm text-gray-600">{{ amendment.content }}</p>
                    </div>
                </div>
            </div>

            <div v-if="amendments.length === 0" class="text-center py-12 text-gray-500">
                No amendments submitted yet
            </div>
        </div>

        <!-- Create Amendment Modal -->
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
                                    Submit Amendment
                                </DialogTitle>

                                <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                                    <div>
                                        <label for="actionType" class="form-label">Amendment Type</label>
                                        <select id="actionType" v-model="form.actionType" class="form-input" required>
                                            <option value="add">Add new point</option>
                                            <option value="modify">Modify existing point</option>
                                            <option value="delete">Delete existing point</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="resolutionPart" class="form-label">Resolution Part</label>
                                        <select id="resolutionPart" v-model="form.resolutionPart" class="form-input" required>
                                            <option value="preamble">Preamble Clauses</option>
                                            <option value="operative">Operative Clauses</option>
                                        </select>
                                    </div>

                                    <div v-if="form.actionType === 'modify' || form.actionType === 'delete'">
                                        <label for="pointNumber" class="form-label">Point Number</label>
                                        <input id="pointNumber" v-model.number="form.pointNumber" type="number" min="1" class="form-input" required />
                                    </div>

                                    <div v-if="form.actionType === 'add'">
                                        <label for="newPointAfter" class="form-label">Add Point After Number</label>
                                        <input id="newPointAfter" v-model.number="form.newPointAfter" type="number" min="0" class="form-input" required />
                                        <p class="text-sm text-gray-500 mt-1">Use 0 to add at the beginning</p>
                                    </div>

                                    <div v-if="form.actionType === 'add' || form.actionType === 'modify'">
                                        <label for="content" class="form-label">Content</label>
                                        <textarea id="content" v-model="form.content" rows="5" class="form-input" required></textarea>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="submitting">
                                            {{ submitting ? 'Submitting...' : 'Submit Amendment' }}
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
import { useAuthStore } from '../../stores/auth'
import { amendmentsService, resolutionsService, sessionsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const amendments = ref([])
const workingDraft = ref(null)
const activeSession = ref(null)
const showCreateModal = ref(false)
const submitting = ref(false)

const form = ref({
    actionType: 'add',
    resolutionPart: 'operative',
    pointNumber: null,
    newPointAfter: 0,
    content: ''
})

onMounted(async () => {
    await Promise.all([
        fetchAmendments(),
        fetchWorkingDraft(),
        fetchActiveSession()
    ])
})

async function fetchAmendments() {
    try {
        // First get working draft
        const workingDraftData = await resolutionsService.getForCommittee(authStore.user.committeeId)
        const draft = workingDraftData.data.find(r => r.isWorkingDraft)
        
        if (draft) {
            // Then get amendments for this working draft
            const response = await amendmentsService.getForResolution(draft._id)
            amendments.value = response.data
        }
    } catch (error) {
        console.error('Error fetching amendments:', error)
    }
}

async function fetchWorkingDraft() {
    try {
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        workingDraft.value = response.data.find(r => r.isWorkingDraft)
    } catch (error) {
        console.error('Error fetching working draft:', error)
    }
}

async function fetchActiveSession() {
    try {
        const response = await sessionsService.getForCommittee(authStore.user.committeeId)
        activeSession.value = response.data.find(s => s.status === 'active')
    } catch (error) {
        console.error('Error fetching active session:', error)
    }
}

async function handleSubmit() {
    if (!workingDraft.value) {
        toast.error('No working draft resolution available')
        return
    }

    if (!activeSession.value?.quorum) {
        toast.error('No active session or quorum not established')
        return
    }

    submitting.value = true
    try {
        const amendmentData = {
            resolutionId: workingDraft.value._id,
            actionType: form.value.actionType,
            resolutionPart: form.value.resolutionPart,
            authors: [authStore.user.countryName]
        }

        // Add specific fields based on amendment type
        if (form.value.actionType === 'add') {
            amendmentData.newPointAfter = form.value.newPointAfter
            amendmentData.content = form.value.content
        } else if (form.value.actionType === 'modify') {
            amendmentData.pointNumber = form.value.pointNumber
            amendmentData.content = form.value.content
        } else if (form.value.actionType === 'delete') {
            amendmentData.pointNumber = form.value.pointNumber
        }

        await amendmentsService.create(amendmentData)
        await fetchAmendments()
        showCreateModal.value = false
        resetForm()
        toast.success('Amendment submitted successfully')
    } catch (error) {
        console.error('Error submitting amendment:', error)
    } finally {
        submitting.value = false
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

function resetForm() {
    form.value = {
        actionType: 'add',
        resolutionPart: 'operative',
        pointNumber: null,
        newPointAfter: 0,
        content: ''
    }
}
</script>