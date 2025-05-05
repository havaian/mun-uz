<template>
    <div>
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </header>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Events</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.totalEvents }}</div>
                <p class="text-sm text-gray-500 mt-1">{{ stats.activeEvents }} active</p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Committees</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.totalCommittees }}</div>
                <p class="text-sm text-gray-500 mt-1">{{ stats.activeCommittees }} active</p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Delegates</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.totalDelegates }}</div>
                <p class="text-sm text-gray-500 mt-1">{{ stats.activeDelegates }} active</p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Sessions</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.activeSessions }}</div>
                <p class="text-sm text-gray-500 mt-1">Currently active</p>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <router-link to="/admin/events" class="card hover:bg-gray-50 transition-colors">
                <CalendarIcon class="h-8 w-8 text-un-blue mb-4" />
                <h3 class="text-lg font-medium text-gray-900">Manage Events</h3>
                <p class="text-sm text-gray-500 mt-1">Create and manage Model UN events</p>
            </router-link>

            <router-link to="/admin/committees" class="card hover:bg-gray-50 transition-colors">
                <UserGroupIcon class="h-8 w-8 text-un-blue mb-4" />
                <h3 class="text-lg font-medium text-gray-900">Manage Committees</h3>
                <p class="text-sm text-gray-500 mt-1">Set up committees and assign delegates</p>
            </router-link>

            <router-link to="/admin/presidium" class="card hover:bg-gray-50 transition-colors">
                <UserIcon class="h-8 w-8 text-un-blue mb-4" />
                <h3 class="text-lg font-medium text-gray-900">Manage Presidium</h3>
                <p class="text-sm text-gray-500 mt-1">Assign and manage presidium members</p>
            </router-link>
        </div>

        <!-- Recent Activity -->
        <div class="card">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>

            <div class="flow-root">
                <ul role="list" class="-mb-8">
                    <li v-for="(activity, index) in recentActivity" :key="activity.id">
                        <div class="relative pb-8">
                            <span v-if="index !== recentActivity.length - 1"
                                class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            <div class="relative flex space-x-3">
                                <div>
                                    <span :class="[
                                        'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                                        activity.type === 'event' ? 'bg-blue-500' :
                                            activity.type === 'committee' ? 'bg-green-500' :
                                                'bg-gray-500'
                                    ]">
                                        <component :is="getActivityIcon(activity.type)" class="h-5 w-5 text-white"
                                            aria-hidden="true" />
                                    </span>
                                </div>
                                <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p class="text-sm text-gray-500">
                                            {{ activity.description }}
                                        </p>
                                    </div>
                                    <div class="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time :datetime="activity.date">{{ formatDate(activity.date) }}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CalendarIcon, UserGroupIcon, UserIcon } from '@heroicons/vue/24/outline'
import { format } from 'date-fns'

const stats = ref({
    totalEvents: 0,
    activeEvents: 0,
    totalCommittees: 0,
    activeCommittees: 0,
    totalDelegates: 0,
    activeDelegates: 0,
    activeSessions: 0
})

const recentActivity = ref([
    {
        id: 1,
        type: 'event',
        description: 'New event "MUNUZ 2025" created',
        date: new Date()
    },
    {
        id: 2,
        type: 'committee',
        description: 'Security Council committee added to MUNUZ 2025',
        date: new Date(Date.now() - 3600000)
    }
])

onMounted(() => {
    fetchStats()
})

function fetchStats() {
    // TODO: Implement stats endpoint
    stats.value = {
        totalEvents: 5,
        activeEvents: 2,
        totalCommittees: 12,
        activeCommittees: 8,
        totalDelegates: 150,
        activeDelegates: 120,
        activeSessions: 4
    }
}

function getActivityIcon(type) {
    switch (type) {
        case 'event':
            return CalendarIcon
        case 'committee':
            return UserGroupIcon
        default:
            return UserIcon
    }
}

function formatDate(date) {
    return format(new Date(date), 'MMM d, yyyy HH:mm')
}
</script>