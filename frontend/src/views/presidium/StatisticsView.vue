<template>
    <div>
        <header class="mb-8">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-bold text-gray-900">Committee Statistics</h1>
                <button @click="exportStatistics" class="btn btn-primary">
                    Export PDF
                </button>
            </div>
        </header>

        <!-- Overall Statistics -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Sessions</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.sessionSummary?.totalSessions || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">
                    {{ stats.sessionSummary?.completedSessions || 0 }} completed
                </p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Resolutions</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.documentSummary?.totalResolutions || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">
                    {{ stats.documentSummary?.acceptedResolutions || 0 }} accepted
                </p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Amendments</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.documentSummary?.totalAmendments || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">
                    {{ stats.documentSummary?.acceptedAmendments || 0 }} accepted
                </p>
            </div>

            <div class="card">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Votings</h3>
                <div class="text-3xl font-bold text-un-blue">{{ stats.votingSummary?.totalVotings || 0 }}</div>
                <p class="text-sm text-gray-500 mt-1">
                    {{ stats.votingSummary?.acceptedItems || 0 }} passed
                </p>
            </div>
        </div>

        <!-- Country Statistics -->
        <div class="card">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Country Statistics</h2>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Country</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Speeches</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Speech Duration</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Resolutions</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amendments</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Votes</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="country in stats.countrySummary?.countryBreakdown" :key="country._id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {{ country._id }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ country.speeches }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ formatDuration(country.speechDuration) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ country.resolutions }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ country.amendments }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ country.votes }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ country.totalActivities }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { statisticsService } from '../../services/api'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()
const stats = ref({})

onMounted(async () => {
    await fetchStatistics()
})

async function fetchStatistics() {
    try {
        const response = await statisticsService.getCommitteeSummary(authStore.user.committeeId)
        stats.value = response.data
    } catch (error) {
        console.error('Error fetching statistics:', error)
    }
}

async function exportStatistics() {
    try {
        const response = await statisticsService.exportStatistics(authStore.user.committeeId)
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `committee_${authStore.user.committeeId}_statistics.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
        toast.success('Statistics exported successfully')
    } catch (error) {
        console.error('Error exporting statistics:', error)
        toast.error('Failed to export statistics')
    }
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
}
</script>