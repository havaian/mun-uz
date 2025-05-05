<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Resolutions</h1>
                <button @click="showCreateModal = true" class="btn btn-primary" :disabled="!activeSession?.quorum">
                    Submit Resolution
                </button>
            </div>
        </header>

        <!-- Active Session Status -->
        <div v-if="!activeSession" class="card mb-8 text-center py-6">
            <p class="text-gray-500">No active session</p>
        </div>
        <div v-else-if="!activeSession.quorum" class="card mb-8 text-center py-6">
            <p class="text-gray-500">Quorum not established</p>
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

        <!-- Resolutions List -->
        <div class="space-y-6">
            <div v-for="resolution in resolutions" :key="resolution._id" class="card">
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
                        {{ resolution.status }}
                    </span>
                </div>

                <div class="mt-4">
                    <p class="text-sm text-gray-700">{{ resolution.content }}</p>
                </div>

                <div v-if="resolution.reviewComments" class="mt-4">
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">Review Comments:</span>
                        {{ resolution.reviewComments }}
                    </p>
                </div>

                <div class="mt-6 flex items-center space-x-4">
                    <button
                        v-if="resolution.status === 'draft' && !resolution.authors.includes(authStore.user.countryName)"
                        @click="confirmCoAuthorship(resolution)" class="text-sm text-un-blue hover:text-blue-700">
                        Confirm Co-Authorship
                    </button>
                </div>
            </div>

            <div v-if="resolutions.length === 0" class="text-center py-12 text-gray-500">
                No resolutions submitted yet
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
                                    </div>

                                    <div>
                                        <label for="content" class="form-label">Content</label>
                                        <textarea id="content" v-model="form.content" rows="10" class="form-input"
                                            required></textarea>
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
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
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
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { useAuthStore } from '../../stores/auth'
import { resolutionsService, committeesService, sessionsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const resolutions = ref([])
const committee = ref(null)
const activeSession = ref(null)
const workingDraft = ref(null)
const showCreateModal = ref(false)
const submitting = ref(false)

const form = ref({
    title: '',
    content: '',
    authors: []
})

// Add current delegate as author by default
if (authStore.user?.countryName) {
    form.value.authors.push(authStore.user.countryName)
}

onMounted(async () => {
    await Promise.all([
        fetchResolutions(),
        fetchCommitteeData(),
        fetchActiveSession()
    ])
})

async function fetchResolutions() {
    try {
        const response = await resolutionsService.getForCommittee(authStore.user.committeeId)
        resolutions.value = response.data
        workingDraft.value = response.data.find(r => r.isWorkingDraft)
    } catch (error) {
        console.error('Error fetching resolutions:', error)
    }
}

async function fetchCommitteeData() {
    try {
        const response = await committeesService.getById(authStore.user.committeeId)
        committee.value = response.data
    } catch (error) {
        console.error('Error fetching committee data:', error)
    }
}

async function fetchActiveSession() {
    try {
        const response = await sessionsService.getActiveSessionForCommittee(authStore.user.committeeId)
        activeSession.value = response.data
    } catch (error) {
        console.error('Error fetching active session:', error)
    }
}

async function handleSubmit() {
    if (!activeSession.value?.quorum) {
        toast.error('No active session or quorum not established')
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
        form.value = {
            title: '',
            content: '',
            authors: [authStore.user.countryName]
        }
    } catch (error) {
        console.error('Error submitting resolution:', error)
    } finally {
        submitting.value = false
    }
}

async function confirmCoAuthorship(resolution) {
    try {
        await resolutionsService.confirmCoAuthor(resolution._id)
        await fetchResolutions()
        toast.success('Co-authorship confirmed')
    } catch (error) {
        console.error('Error confirming co-authorship:', error)
    }
}
</script>