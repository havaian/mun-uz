<template>
    <div>
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">My Statistics</h1>
        </header>

        <!-- Activity Summary -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Speeches</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.summary?.speeches || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">
                    Total duration: {{ formatDuration(stats.summary?.speechDuration || 0) }}
                </p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Resolutions</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.summary?.resolutions || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">As author or co-author</p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Amendments</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.summary?.amendments || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">Submitted amendments</p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Votes</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.summary?.votes || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">Participated in votings</p>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>

            <div class="flow-root">
                <ul role="list" class="-mb-8">
                    <li v-for="(activity, index) in stats.recentActivities" :key="activity._id">
                        <div class="relative pb-8">
                            <span v-if="index !== stats.recentActivities.length - 1"
                                class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            <div class="relative flex space-x-3">
                                <div>
                                    <span :class="[
                                        'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                                        getActivityColor(activity.activityType)
                                    ]">
                                        <component :is="getActivityIcon(activity.activityType)"
                                            class="h-5 w-5 text-white" aria-hidden="true" />
                                    </span>
                                </div>
                                <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p class="text-sm text-gray-500">
                                            {{ getActivityDescription(activity) }}
                                        </p>
                                    </div>
                                    <div class="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time :datetime="activity.timestamp">{{ formatDate(activity.timestamp) }}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <div v-if="!stats.recentActivities?.length" class="text-center py-6 text-gray-500">
                No recent activity
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { statisticsService } from '../../services/api'
import { format } from 'date-fns'
import {
    MicrophoneIcon,
    DocumentTextIcon,
    PencilSquareIcon,
    HandRaisedIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const stats = ref({})

onMounted(async () => {
    await fetchStatistics()
})

async function fetchStatistics() {
    try {
        const response = await statisticsService.getDelegateStatistics(
            authStore.user.committeeId,
            authStore.user.countryName
        )
        stats.value = response.data
    } catch (error) {
        console.error('Error fetching statistics:', error)
    }
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
}

function formatDate(date) {
    return format(new Date(date), 'MMM d, yyyy HH:mm')
}

function getActivityIcon(type) {
    switch (type) {
        case 'speech':
            return MicrophoneIcon
        case 'resolution':
            return DocumentTextIcon
        case 'amendment':
            return PencilSquareIcon
        case 'vote':
            return HandRaisedIcon
        default:
            return DocumentTextIcon
    }
}

function getActivityColor(type) {
    switch (type) {
        case 'speech':
            return 'bg-blue-500'
        case 'resolution':
            return 'bg-green-500'
        case 'amendment':
            return 'bg-yellow-500'
        case 'vote':
            return 'bg-purple-500'
        default:
            return 'bg-gray-500'
    }
}

function getActivityDescription(activity) {
    switch (activity.activityType) {
        case 'speech':
            return `Delivered a speech (${formatDuration(activity.duration)})`
        case 'resolution':
            return `Submitted a resolution${activity.details?.title ? `: ${activity.details.title}` : ''}`
        case 'amendment':
            return `Submitted an amendment${activity.details?.type ? ` (${activity.details.type})` : ''}`
        case 'vote':
            return `Participated in voting${activity.details?.target ? ` on ${activity.details.target}` : ''}`
        default:
            return 'Unknown activity'
    }
}
</script>