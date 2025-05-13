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

                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-4">
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

                <!-- Mobile menu button -->
                <div class="md:hidden">
                    <button @click="mobileMenuOpen = !mobileMenuOpen"
                        class="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-un-blue"
                        aria-expanded="false">
                        <span class="sr-only">Open main menu</span>
                        <!-- Icon when menu is closed -->
                        <Bars3Icon v-if="!mobileMenuOpen" class="block h-6 w-6" aria-hidden="true" />
                        <!-- Icon when menu is open -->
                        <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <!-- Mobile menu, show/hide based on menu state -->
            <div v-if="mobileMenuOpen" class="md:hidden">
                <div class="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                    <template v-if="authStore.isAuthenticated">
                        <div class="block px-3 py-2 text-base font-medium text-gray-900 border-b border-gray-200 mb-2">
                            {{ userDisplayName }}
                        </div>
                        <router-link :to="authStore.getDefaultRoute"
                            class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            @click="mobileMenuOpen = false">
                            Dashboard
                        </router-link>
                        <button @click="handleLogoutMobile"
                            class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                            Logout
                        </button>
                    </template>
                    <template v-else>
                        <template v-if="$route.name === 'delegate-auth'">
                            <router-link to="/login"
                                class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                @click="mobileMenuOpen = false">
                                Admin/Presidium Login
                            </router-link>
                        </template>
                        <template v-else-if="$route.name === 'login'">
                            <router-link to="/delegate/auth"
                                class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                @click="mobileMenuOpen = false">
                                Delegate Login
                            </router-link>
                        </template>
                        <template v-else>
                            <router-link to="/login"
                                class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                @click="mobileMenuOpen = false">
                                Admin/Presidium Login
                            </router-link>
                            <router-link to="/delegate/auth"
                                class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                @click="mobileMenuOpen = false">
                                Delegate Login
                            </router-link>
                        </template>
                    </template>
                </div>
            </div>
        </nav>
    </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/vue/20/solid'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

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

async function handleLogoutMobile() {
    mobileMenuOpen.value = false
    await handleLogout()
}
</script>

<style scoped>
@media (max-width: 768px) {
    .btn {
        @apply py-2 px-3 text-sm;
    }
}
</style>