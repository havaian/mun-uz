<template>
    <div>
        <!-- Admin sidebar/navigation if needed -->
        <div class="flex">
            <aside class="w-64 bg-white shadow-sm">
                <div class="p-6">
                    <h2 class="text-lg font-semibold text-gray-900">Admin Panel</h2>
                </div>
                <nav class="space-y-1 px-4 pb-6">
                    <router-link to="/admin" exact-active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
                        Dashboard
                    </router-link>
                    <router-link to="/admin/events" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
                        Events
                    </router-link>
                    <router-link to="/admin/committees" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
                        Committees
                    </router-link>
                    <router-link to="/admin/presidium" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
                        Presidium
                    </router-link>
                    <router-link to="/admin/statistics" active-class="bg-blue-50 text-un-blue"
                        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50">
                        Statistics
                    </router-link>
                </nav>
            </aside>

            <!-- Main content -->
            <main class="flex-1 p-6">
                <router-view />
            </main>
        </div>
    </div>
</template>