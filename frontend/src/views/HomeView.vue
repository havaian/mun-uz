<template>
    <div class="max-w-7xl mx-auto">
        <!-- Hero section -->
        <div class="text-center py-12">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span class="block">Model United Nations</span>
                <span class="block text-un-blue">Platform</span>
            </h1>
            <p class="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl">
                A comprehensive platform for organizing and conducting Model UN events, bringing together
                administrators, presidium members, and delegates.
            </p>
            <div class="mt-8 flex justify-center gap-x-4">
                <router-link to="/login" class="btn btn-primary">
                    Admin/Presidium Login
                </router-link>
                <router-link to="/delegate/auth" class="btn btn-outline">
                    Delegate Access
                </router-link>
            </div>
        </div>

        <!-- Features grid -->
        <div class="mt-12">
            <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Admin features -->
                <div class="card">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-un-blue text-white mb-4">
                        <UserGroupIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">Administrators</h3>
                    <ul class="mt-4 space-y-2 text-gray-500">
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Create and manage events
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Set up committees
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Generate delegate QR codes
                        </li>
                    </ul>
                </div>

                <!-- Presidium features -->
                <div class="card">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-un-blue text-white mb-4">
                        <ClipboardDocumentListIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">Presidium</h3>
                    <ul class="mt-4 space-y-2 text-gray-500">
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Manage committee sessions
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Review resolutions
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Conduct voting procedures
                        </li>
                    </ul>
                </div>

                <!-- Delegate features -->
                <div class="card">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-un-blue text-white mb-4">
                        <DocumentTextIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">Delegates</h3>
                    <ul class="mt-4 space-y-2 text-gray-500">
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Submit resolutions
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Propose amendments
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2" />
                            Participate in voting
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { UserGroupIcon, ClipboardDocumentListIcon, DocumentTextIcon, CheckIcon } from '@heroicons/vue/24/outline'
</script>