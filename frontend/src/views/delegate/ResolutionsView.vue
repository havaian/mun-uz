<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Resolutions</h1>
                <button @click="showCreateModal = true" class="btn btn-primary" :disabled="isSubmitting">
                    Submit Resolution
                </button>
            </div>
        </header>

        <!-- Committee Status -->
        <div v-if="committee" class="card mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-medium text-gray-900">Committee Status</h2>
                    <p class="mt-1 text-sm" :class="committee.status === 'active' ? 'text-green-600' : 'text-gray-500'">
                        {{ committeStatusText }}
                    </p>
                </div>
                <span :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    committee.status === 'active' ? 'bg-green-100 text-green-800' :
                        committee.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                ]">
                    {{ committee.status }}
                </span>
            </div>
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
                <p class="whitespace-pre-wrap text-sm text-gray-700">{{ workingDraft.content }}</p>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    Authors: {{ workingDraft.authors.join(', ') }}
                </p>
            </div>
            <div class="mt-4">
                <button @click="viewResolutionDetails(workingDraft)" class="text-sm text-un-blue hover:text-blue-700">
                    View Full Resolution
                </button>
            </div>
        </div>

        <!-- Resolutions List -->
        <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900">My Resolutions</h2>
            <div v-if="myResolutions.length === 0" class="card text-center py-8">
                <p class="text-gray-500">You haven't submitted any resolutions yet.</p>
            </div>
            <div v-else class="space-y-4">
                <div v-for="resolution in myResolutions" :key="resolution._id" class="card">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">{{ resolution.title }}</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Authors: {{ resolution.authors.join(', ') }}
                            </p>
                        </div>
                        <span :class="[
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            resolution.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                resolution.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                        ]">
                            {{ formatStatus(resolution.status) }}
                        </span>
                    </div>

                    <div class="mt-4">
                        <p class="line-clamp-3 text-sm text-gray-700">{{ resolution.content }}</p>
                    </div>

                    <div v-if="resolution.reviewComments" class="mt-4">
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">Review Comments:</span>
                            {{ resolution.reviewComments }}
                        </p>
                    </div>

                    <div class="mt-4">
                        <button @click="viewResolutionDetails(resolution)"
                            class="text-sm text-un-blue hover:text-blue-700">
                            View Full Resolution
                        </button>
                    </div>
                </div>
            </div>

            <h2 class="text-xl font-semibold text-gray-900 mt-8">Other Resolutions</h2>
            <div v-if="otherResolutions.length === 0" class="card text-center py-8">
                <p class="text-gray-500">No other resolutions submitted yet.</p>
            </div>
            <div v-else class="space-y-4">
                <div v-for="resolution in otherResolutions" :key="resolution._id" class="card">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">{{ resolution.title }}</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Authors: {{ resolution.authors.join(', ') }}
                            </p>
                        </div>
                        <span :class="[
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            resolution.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                resolution.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                        ]">
                            {{ formatStatus(resolution.status) }}
                        </span>
                    </div>

                    <div class="mt-4">
                        <p class="line-clamp-3 text-sm text-gray-700">{{ resolution.content }}</p>
                    </div>

                    <div class="mt-6 flex items-center space-x-4">
                        <button @click="viewResolutionDetails(resolution)"
                            class="text-sm text-un-blue hover:text-blue-700">
                            View Full Resolution
                        </button>
                        <button
                            v-if="resolution.status === 'draft' && !resolution.authors.includes(authStore.user.countryName)"
                            @click="confirmCoAuthorship(resolution)" class="text-sm text-un-blue hover:text-blue-700">
                            Confirm Co-Authorship
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Resolution Modal -->
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
                                    Submit Resolution
                                </DialogTitle>

                                <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                                    <div>
                                        <label for="title" class="form-label">Title</label>
                                        <input id="title" v-model="form.title" type="text" class="form-input"
                                            required />
                                        <p v-if="validationErrors.title" class="text-red-500 text-sm mt-1">
                                            {{ validationErrors.title }}
                                        </p>
                                    </div>

                                    <div>
                                        <label for="content" class="form-label">Content</label>
                                        <textarea id="content" v-model="form.content" rows="10" class="form-input"
                                            required></textarea>
                                        <p v-if="validationErrors.content" class="text-red-500 text-sm mt-1">
                                            {{ validationErrors.content }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="form-label">Co-Authors</label>
                                        <div class="mt-2 space-y-2">
                                            <div v-for="country in committee?.countries" :key="country.name"
                                                class="flex items-center">
                                                <input type="checkbox" :id="'author-' + country.name"
                                                    v-model="form.authors" :value="country.name"
                                                    :disabled="country.name === authStore.user.countryName"
                                                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                                <label :for="'author-' + country.name"
                                                    class="ml-2 text-sm text-gray-700">
                                                    {{ country.name }}
                                                </label>
                                            </div>
                                        </div>
                                        <p v-if="committee?.minResolutionAuthors" class="mt-2 text-sm text-gray-500">
                                            Minimum {{ committee.minResolutionAuthors }} authors required
                                        </p>
                                        <p v-if="validationErrors.authors" class="text-red-500 text-sm mt-1">
                                            {{ validationErrors.authors }}
                                        </p>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="cancelResolutionForm">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="submitting">
                                            {{ submitting ? 'Submitting...' : 'Submit Resolution' }}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Resolution Details Modal -->
        <TransitionRoot appear :show="showDetailsModal" as="template">
            <Dialog as="div" class="relative z-10" @close="showDetailsModal = false">
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
                                class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3"
                                    class="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                                    <span>{{ selectedResolution?.title }}</span>
                                    <span :class="[
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                        selectedResolution?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            selectedResolution?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                    ]">
                                        {{ formatStatus(selectedResolution?.status) }}
                                    </span>
                                </DialogTitle>

                                <div class="mt-4 space-y-4">
                                    <div>
                                        <h4 class="text-sm font-medium text-gray-700">Authors</h4>
                                        <p class="mt-1 text-sm text-gray-600">
                                            {{ selectedResolution?.authors.join(', ') }}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 class="text-sm font-medium text-gray-700">Content</h4>
                                        <div class="mt-1 p-4 bg-gray-50 rounded-md overflow-auto max-h-96">
                                            <p class="text-sm text-gray-800 whitespace-pre-wrap">{{
                                                selectedResolution?.content }}</p>
                                        </div>
                                    </div>

                                    <div v-if="selectedResolution?.reviewComments">
                                        <h4 class="text-sm font-medium text-gray-700">Review Comments</h4>
                                        <p class="mt-1 text-sm text-gray-600">
                                            {{ selectedResolution.reviewComments }}
                                        </p>
                                    </div>

                                    <div v-if="selectedResolution?.status === 'draft' && !selectedResolution.authors.includes(authStore.user.countryName)"
                                        class="mt-6">
                                        <button @click="confirmCoAuthorshipFromDetails()" class="btn btn-primary">
                                            Confirm Co-Authorship
                                        </button>
                                    </div>

                                    <div class="mt-6 flex justify-end">
                                        <button type="button" class="btn btn-outline" @click="showDetailsModal = false">
                                            Close
                                        </button>
                                    </div>
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
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useAuthStore } from '../../stores/auth'
import { resolutionsService, committeesService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const resolutions = ref([])
const committee = ref(null)
const workingDraft = ref(null)
const showCreateModal = ref(false)
const submitting = ref(false)
const isSubmitting = ref(false)
const validationErrors = ref({})

// For resolution details modal
const showDetailsModal = ref(false)
const selectedResolution = ref(null)

const form = ref({
    title: '',
    content: '',
    authors: []
})

// Add current delegate as author by default
if (authStore.user?.countryName) {
    form.value.authors = [authStore.user.countryName]
}

// Computed properties to filter resolutions
const myResolutions = computed(() => {
    return resolutions.value.filter(r =>
        r.authors.includes(authStore.user.countryName) && !r.isWorkingDraft
    )
})

const otherResolutions = computed(() => {
    return resolutions.value.filter(r =>
        !r.authors.includes(authStore.user.countryName) && !r.isWorkingDraft
    )
})

// Text for committee status
const committeStatusText = computed(() => {
    if (!committee.value) return '';

    switch (committee.value.status) {
        case 'setup': return 'Committee is in setup phase. You can submit resolutions.';
        case 'active': return 'Committee is active. You can submit resolutions.';
        case 'completed': return 'Committee has completed its work.';
        default: return `Committee status: ${committee.value.status}`;
    }
})

onMounted(async () => {
    isSubmitting.value = true
    try {
        await Promise.all([
            fetchResolutions(),
            fetchCommitteeData()
        ])
    } finally {
        isSubmitting.value = false
    }
})

async function fetchResolutions() {
    try {
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        resolutions.value = response.data
        workingDraft.value = response.data.find(r => r.isWorkingDraft)
    } catch (error) {
        console.error('Error fetching resolutions:', error)
        toast.error('Failed to load resolutions')
    }
}

async function fetchCommitteeData() {
    try {
        const response = await committeesService.getById(authStore.user.committeeId)
        committee.value = response.data
    } catch (error) {
        console.error('Error fetching committee data:', error)
        toast.error('Failed to load committee information')
    }
}

function validateForm() {
    const errors = {}

    // Title validation
    if (!form.value.title.trim()) {
        errors.title = 'Title is required'
    } else if (form.value.title.length < 3) {
        errors.title = 'Title must be at least 3 characters'
    }

    // Content validation
    if (!form.value.content.trim()) {
        errors.content = 'Content is required'
    } else if (form.value.content.length < 20) {
        errors.content = 'Content must be at least 20 characters'
    }

    // Authors validation
    if (committee.value?.minResolutionAuthors &&
        form.value.authors.length < committee.value.minResolutionAuthors) {
        errors.authors = `At least ${committee.value.minResolutionAuthors} authors are required`
    }

    validationErrors.value = errors
    return Object.keys(errors).length === 0
}

async function handleSubmit() {
    if (!validateForm()) {
        toast.error('Please correct the errors in the form')
        return
    }

    submitting.value = true
    try {
        await resolutionsService.create({
            ...form.value,
            committeeId: authStore.user.committeeId
        })
        await fetchResolutions()
        showCreateModal.value = false
        toast.success('Resolution submitted successfully')

        // Reset form
        resetForm()
    } catch (error) {
        console.error('Error submitting resolution:', error)
        if (error.response?.data?.error) {
            toast.error(error.response.data.error)
        } else {
            toast.error('Failed to submit resolution')
        }
    } finally {
        submitting.value = false
    }
}

async function confirmCoAuthorship(resolution) {
    isSubmitting.value = true
    try {
        await resolutionsService.confirmCoAuthor(resolution._id)
        await fetchResolutions()
        toast.success('Co-authorship confirmed')
    } catch (error) {
        console.error('Error confirming co-authorship:', error)
        toast.error('Failed to confirm co-authorship')
    } finally {
        isSubmitting.value = false
    }
}

function viewResolutionDetails(resolution) {
    selectedResolution.value = resolution
    showDetailsModal.value = true
}

async function confirmCoAuthorshipFromDetails() {
    if (!selectedResolution.value) return

    showDetailsModal.value = false
    await confirmCoAuthorship(selectedResolution.value)
}

function resetForm() {
    form.value = {
        title: '',
        content: '',
        authors: [authStore.user.countryName]
    }
    validationErrors.value = {}
}

function cancelResolutionForm() {
    resetForm()
    showCreateModal.value = false
}

function formatStatus(status) {
    if (!status) return ''

    switch (status) {
        case 'draft': return 'Pending Review'
        case 'accepted': return 'Accepted'
        case 'rejected': return 'Rejected'
        case 'working': return 'Working Draft'
        default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
}
</script>