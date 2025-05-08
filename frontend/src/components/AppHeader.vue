<template>
    <header class="bg-white shadow-sm">
        <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 justify-between items-center">
                <!-- Logo -->
                <div class="flex items-center">
                    <router-link to="/" class="flex items-center space-x-2">
                        <img src="/un-logo.png" alt="UN Logo" class="h-8 w-auto" />
                        <span class="text-xl font-semibold text-un-blue">MUN.UZ</span>
                    </router-link>
                </div>

                <!-- Navigation -->
                <div class="flex items-center space-x-4">
                    <template v-if="authStore.isAuthenticated">
                        <!-- User menu -->
                        <Menu as="div" class="relative ml-3">
                            <MenuButton class="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                                <span class="text-sm font-medium">
                                    {{ userDisplayName }}
                                </span>
                                <ChevronDownIcon class="h-5 w-5" />
                            </MenuButton>

                            <transition enter-active-class="transition ease-out duration-100"
                                enter-from-class="transform opacity-0 scale-95"
                                enter-to-class="transform opacity-100 scale-100"
                                leave-active-class="transition ease-in duration-75"
                                leave-from-class="transform opacity-100 scale-100"
                                leave-to-class="transform opacity-0 scale-95">
                                <MenuItems
                                    class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <MenuItem v-slot="{ active }">
                                    <router-link :to="authStore.getDefaultRoute"
                                        :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']">
                                        Dashboard
                                    </router-link>
                                    </MenuItem>
                                    <MenuItem v-slot="{ active }">
                                    <button @click="handleLogout"
                                        :class="[active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700']">
                                        Logout
                                    </button>
                                    </MenuItem>
                                </MenuItems>
                            </transition>
                        </Menu>
                    </template>
                    <template v-else>
                        <!-- Dynamic login buttons based on route -->
                        <template v-if="$route.name === 'delegate-auth'">
                            <router-link to="/login" class="btn btn-primary">
                                Admin/Presidium Login
                            </router-link>
                        </template>
                        <template v-else-if="$route.name === 'login'">
                            <router-link to="/delegate/auth" class="btn btn-primary">
                                Delegate Login
                            </router-link>
                        </template>
                        <template v-else>
                            <div class="space-x-4">
                                <router-link to="/login" class="btn btn-primary">
                                    Admin/Presidium Login
                                </router-link>
                                <router-link to="/delegate/auth" class="btn btn-outline">
                                    Delegate Login
                                </router-link>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
        </nav>
    </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userDisplayName = computed(() => {
    const user = authStore.user
    if (!user) return ''

    if (user.role === 'delegate') {
        return `${user.countryName} Delegate`
    }
    return `${user.username} (${user.role})`
})

async function handleLogout() {
    await authStore.logout()
    router.push('/login')
}
</script>