<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Events</h1>
                <button @click="showCreateModal = true" class="btn btn-primary">
                    Create Event
                </button>
            </div>
        </header>

        <!-- Events List -->
        <div class="space-y-6">
            <div v-for="event in events" :key="event._id" class="card">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">{{ event.name }}</h3>
                        <p class="mt-1 text-sm text-gray-500">{{ event.description }}</p>
                    </div>
                    <span :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        event.status === 'active' ? 'bg-green-100 text-green-800' :
                            event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                    ]">
                        {{ event.status }}
                    </span>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                        <span class="font-medium">Start Date:</span>
                        {{ formatDate(event.startDate) }}
                    </div>
                    <div>
                        <span class="font-medium">End Date:</span>
                        {{ formatDate(event.endDate) }}
                    </div>
                </div>

                <div class="mt-6 flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <button @click="() => handleEditEvent(event)" class="text-sm text-un-blue hover:text-blue-700">
                            Edit
                        </button>
                        <button v-if="event.status === 'draft'" @click="() => handleDeleteEvent(event)"
                            class="text-sm text-red-600 hover:text-red-700">
                            Delete
                        </button>
                    </div>
                    <button v-if="event.status === 'draft'" @click="() => handleActivateEvent(event)"
                        class="btn btn-primary text-sm">
                        Activate
                    </button>
                </div>
            </div>
        </div>

        <!-- Create/Edit Event Modal -->
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
                                    {{ editingEvent ? 'Edit Event' : 'Create Event' }}
                                </DialogTitle>

                                <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                                    <div>
                                        <label for="name" class="form-label">Event Name</label>
                                        <input id="name" v-model="form.name" type="text" class="form-input" required />
                                    </div>

                                    <div>
                                        <label for="description" class="form-label">Description</label>
                                        <textarea id="description" v-model="form.description" rows="3"
                                            class="form-input" required></textarea>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label for="startDate" class="form-label">Start Date</label>
                                            <input id="startDate" v-model="form.startDate" type="datetime-local"
                                                class="form-input" required />
                                        </div>

                                        <div>
                                            <label for="endDate" class="form-label">End Date</label>
                                            <input id="endDate" v-model="form.endDate" type="datetime-local"
                                                class="form-input" required />
                                        </div>
                                    </div>

                                    <div class="mt-6 flex justify-end space-x-3">
                                        <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                                            Cancel
                                        </button>
                                        <button type="submit" class="btn btn-primary" :disabled="loading">
                                            {{ loading ? 'Saving...' : 'Save Event' }}
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
import { eventsService } from '../../services/api'
import { toast } from 'vue3-toastify'
import { format } from 'date-fns'

const events = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const editingEvent = ref(null)

const form = ref({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
})

onMounted(async () => {
    await fetchEvents()
})

async function fetchEvents() {
    try {
        const response = await eventsService.getAll()
        events.value = response.data
    } catch (error) {
        console.error('Error fetching events:', error)
    }
}

function handleEditEvent(event) {
    editingEvent.value = event
    form.value = {
        name: event.name,
        description: event.description,
        startDate: format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm")
    }
    showCreateModal.value = true
}

async function handleDeleteEvent(event) {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
        await eventsService.delete(event._id)
        await fetchEvents()
        toast.success('Event deleted successfully')
    } catch (error) {
        console.error('Error deleting event:', error)
    }
}

async function handleActivateEvent(event) {
    try {
        await eventsService.update(event._id, { status: 'active' })
        await fetchEvents()
        toast.success('Event activated successfully')
    } catch (error) {
        console.error('Error activating event:', error)
    }
}

async function handleSubmit() {
    loading.value = true
    try {
        if (editingEvent.value) {
            await eventsService.update(editingEvent.value._id, form.value)
            toast.success('Event updated successfully')
        } else {
            await eventsService.create(form.value)
            toast.success('Event created successfully')
        }
        await fetchEvents()
        showCreateModal.value = false
        resetForm()
    } catch (error) {
        console.error('Error saving event:', error)
    } finally {
        loading.value = false
    }
}

function formatDate(date) {
    return format(new Date(date), 'MMM d, yyyy HH:mm')
}

function resetForm() {
    form.value = {
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    }
    editingEvent.value = null
}
</script>