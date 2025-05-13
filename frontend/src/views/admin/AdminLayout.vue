<template>
    <div>
        <div class="flex flex-col md:flex-row">
            <!-- Mobile toggle for sidebar -->
            <div class="md:hidden p-4 bg-white border-b border-gray-200">
                <button @click="sidebarOpen = !sidebarOpen"
                    class="flex items-center justify-between w-full text-gray-700 hover:text-gray-900">
                    <span class="text-lg font-semibold">Admin Panel</span>
                    <ChevronDownIcon v-if="!sidebarOpen" class="h-5 w-5" />
                    <ChevronUpIcon v-else class="h-5 w-5" />
                </button>
            </div>

            <!-- Admin sidebar/navigation -->
            <aside :class="[
                'bg-white shadow-sm',
                sidebarOpen ? 'block' : 'hidden md:block',
                'md:w-64 w-full'
            ]">
                <div class="p-6 hidden md:block">
                    <h2 class="text-lg font-semibold text-gray-900">Admin Panel</h2>
                </div>
                <nav class="space-y-1 px-4 pb-6">
                    <router-link to="/admin" exact-active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                        @click="closeSidebarOnMobile">
                        <HomeIcon class="mr-3 h-5 w-5 text-gray-500" />
                        Dashboard
                    </router-link>
                    <router-link to="/admin/events" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                        @click="closeSidebarOnMobile">
                        <CalendarIcon class="mr-3 h-5 w-5 text-gray-500" />
                        Events
                    </router-link>
                    <router-link to="/admin/committees" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                        @click="closeSidebarOnMobile">
                        <UserGroupIcon class="mr-3 h-5 w-5 text-gray-500" />
                        Committees
                    </router-link>
                    <router-link to="/admin/presidium" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                        @click="closeSidebarOnMobile">
                        <UsersIcon class="mr-3 h-5 w-5 text-gray-500" />
                        Presidium
                    </router-link>
                    <router-link to="/admin/statistics" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                        @click="closeSidebarOnMobile">
                        <ChartBarIcon class="mr-3 h-5 w-5 text-gray-500" />
                        Statistics
                    </router-link>
                </nav>
            </aside>

            <!-- Main content -->
            <main class="flex-1 p-6 bg-gray-50">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import {
    HomeIcon,
    CalendarIcon,
    UserGroupIcon,
    UsersIcon,
    ChartBarIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/vue/24/outline'

const sidebarOpen = ref(false)

function closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
        sidebarOpen.value = false
    }
}
</script>

<style scoped>
/* Ensure the sidebar has proper z-index on mobile */
@media (max-width: 768px) {
    aside {
        z-index: 10;
    }
}
</style>