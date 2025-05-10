<template>
    <div>
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </header>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-500">Loading dashboard data...</p>
        </div>

        <div v-else>
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

            <!-- Recent Activity -->
            <div class="card">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>

                <div v-if="recentActivity.length === 0" class="text-center py-8">
                    <p class="text-gray-500">No recent activity found</p>
                </div>

                <div v-else class="flow-root">
                    <ul role="list" class="-mb-8">
                        <li v-for="(activity, index) in recentActivity" :key="activity.id">
                            <div class="relative pb-8">
                                <span v-if="index !== recentActivity.length - 1"
                                    class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                <div class="relative flex space-x-3">
                                    <div>
                                        <span :class="[
                                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                                            getActivityColor(activity.type)
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
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CalendarIcon, UserGroupIcon, UserIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import { format } from 'date-fns'
import { eventsService, committeesService, sessionsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const loading = ref(true)
const stats = ref({
    totalEvents: 0,
    activeEvents: 0,
    totalCommittees: 0,
    activeCommittees: 0,
    totalDelegates: 0,
    activeDelegates: 0,
    activeSessions: 0
})

const recentActivity = ref([])

onMounted(async () => {
    await fetchDashboardData()
})

async function fetchDashboardData() {
    loading.value = true
    try {
        // Fetch the necessary data in parallel
        const [events, committees, sessions] = await Promise.all([
            eventsService.getAll(),
            committeesService.getAll(),
            fetchActiveSessions()
        ])

        // Calculate total active delegates
        let totalDelegates = 0
        let activeDelegates = 0

        committees.data.forEach(committee => {
            if (committee.countries) {
                totalDelegates += committee.countries.length
                if (committee.status === 'active') {
                    activeDelegates += committee.countries.length
                }
            }
        })

        // Update statistics
        stats.value = {
            totalEvents: events.data.length,
            activeEvents: events.data.filter(e => e.status === 'active').length,
            totalCommittees: committees.data.length,
            activeCommittees: committees.data.filter(c => c.status === 'active').length,
            totalDelegates,
            activeDelegates,
            activeSessions: sessions.length
        }

        // Generate recent activity from the data
        const activities = []

        // Add recent events
        events.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .forEach(event => {
                activities.push({
                    id: `event-${event._id}`,
                    type: 'event',
                    description: `Event "${event.name}" was ${event.status === 'active' ? 'activated' : 'created'}`,
                    date: event.createdAt
                })
            })

        // Add recent committees
        committees.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .forEach(committee => {
                activities.push({
                    id: `committee-${committee._id}`,
                    type: 'committee',
                    description: `Committee "${committee.name}" was ${committee.status === 'active' ? 'activated' : 'created'}`,
                    date: committee.createdAt
                })
            })

        // Add active sessions
        sessions.forEach(session => {
            const committee = committees.data.find(c => c._id === session.committeeId)
            if (committee) {
                activities.push({
                    id: `session-${session._id}`,
                    type: 'session',
                    description: `Session #${session.number} for committee "${committee.name}" is active`,
                    date: session.startTime || session.createdAt
                })
            }
        })

        // Sort all activities by date
        recentActivity.value = activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)

    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
    } finally {
        loading.value = false
    }
}

async function fetchActiveSessions() {
    try {
        // This is a placeholder - you'll need to implement this based on your API
        // Since there doesn't seem to be a direct endpoint for all active sessions
        // You might need to fetch active sessions for each committee

        const committees = await committeesService.getAll()
        let activeSessions = []

        // For each active committee, try to get active sessions
        const activeCommittees = committees.data.filter(c => c.status === 'active')

        for (const committee of activeCommittees) {
            try {
                const sessions = await sessionsService.getForCommittee(committee._id)
                const activeSession = sessions.data.find(s => s.status === 'active')
                if (activeSession) {
                    activeSessions.push(activeSession)
                }
            } catch (e) {
                console.error(`Error fetching sessions for committee ${committee._id}:`, e)
            }
        }

        return activeSessions
    } catch (error) {
        console.error('Error fetching active sessions:', error)
        return []
    }
}

function getActivityIcon(type) {
    switch (type) {
        case 'event':
            return CalendarIcon
        case 'committee':
            return UserGroupIcon
        case 'session':
            return ClipboardDocumentListIcon
        case 'voting':
            return ChatBubbleLeftRightIcon
        default:
            return UserIcon
    }
}

function getActivityColor(type) {
    switch (type) {
        case 'event':
            return 'bg-blue-500'
        case 'committee':
            return 'bg-green-500'
        case 'session':
            return 'bg-purple-500'
        case 'voting':
            return 'bg-yellow-500'
        default:
            return 'bg-gray-500'
    }
}

function formatDate(date) {
    if (!date) return 'Unknown date'
    return format(new Date(date), 'MMM d, yyyy HH:mm')
}
</script>