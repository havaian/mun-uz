<template>
    <footer class="bg-white border-t border-gray-200 mt-auto">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="py-8 md:flex md:items-center md:justify-between">
                <!-- Brand and description -->
                <div class="space-y-4 md:w-1/2 pr-[10vw]">
                    <div class="flex items-center">
                        <img src="/un-logo.png" alt="UN Logo" class="h-8 w-auto mr-2" />
                        <span class="text-xl font-semibold text-un-blue">MUN.UZ</span>
                    </div>
                    <p class="text-sm text-gray-500">
                        A comprehensive platform for organizing and conducting Model UN events, bringing together
                        administrators, presidium members, and delegates.
                    </p>
                </div>

                <!-- Quick links -->
                <div class="mt-8 md:mt-0 md:w-1/3">
                    <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                        Quick Links
                    </h3>
                    <ul class="mt-4 space-y-2">
                        <li>
                            <router-link to="/" class="text-sm text-gray-600 hover:text-un-blue">
                                Home
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/login" class="text-sm text-gray-600 hover:text-un-blue">
                                Admin Login
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/delegate/auth" class="text-sm text-gray-600 hover:text-un-blue">
                                Delegate Access
                            </router-link>
                        </li>
                    </ul>
                </div>

                <!-- Contact/Support -->
                <div class="mt-8 md:mt-0 md:w-1/3">
                    <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                        Contact
                    </h3>
                    <ul class="mt-4 space-y-2">
                        <li class="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon class="h-4 w-4 mr-2 text-gray-400" />
                            <span>support@mun.uz</span>
                        </li>
                        <li class="flex items-center text-sm text-gray-600">
                            <GlobeAltIcon class="h-4 w-4 mr-2 text-gray-400" />
                            <span>www.mun.uz</span>
                        </li>
                        <li class="mt-4">
                            <div class="flex space-x-3">
                                <a href="#" class="text-gray-400 hover:text-gray-500">
                                    <span class="sr-only">Facebook</span>
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill-rule="evenodd"
                                            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-gray-500">
                                    <span class="sr-only">Twitter</span>
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path
                                            d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </a>
                                <a href="#" class="text-gray-400 hover:text-gray-500">
                                    <span class="sr-only">Instagram</span>
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill-rule="evenodd"
                                            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Copyright and language selector -->
            <div class="border-t border-gray-200 py-4 flex flex-col md:flex-row justify-between items-center">
                <p class="text-xs text-gray-500">
                    &copy; {{ currentYear }} MUN.UZ. All rights reserved.
                </p>
                <div class="mt-4 md:mt-0">
                    <div class="flex items-center space-x-4">
                        <button @click="switchLanguage('en')"
                            :class="['text-xs', language === 'en' ? 'text-un-blue font-medium' : 'text-gray-500']">
                            English
                        </button>
                        <button @click="switchLanguage('ru')"
                            :class="['text-xs', language === 'ru' ? 'text-un-blue font-medium' : 'text-gray-500']">
                            Русский
                        </button>
                        <button @click="switchLanguage('uz')"
                            :class="['text-xs', language === 'uz' ? 'text-un-blue font-medium' : 'text-gray-500']">
                            O'zbekcha
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- About MUN Modal -->
        <TransitionRoot appear :show="showAboutModal" as="template">
            <Dialog as="div" class="relative z-10" @close="showAboutModal = false">
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
                                class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                                    About Model United Nations
                                </DialogTitle>

                                <div class="mt-4">
                                    <p class="text-sm text-gray-500 mb-4">
                                        Model United Nations (MUN) is an educational simulation where students learn
                                        about diplomacy, international relations, and the United Nations.
                                    </p>
                                    <p class="text-sm text-gray-500 mb-4">
                                        Participants in MUN conferences, known as delegates, are placed in committees
                                        and assigned countries to represent. They are presented with their assignments
                                        in advance, along with a topic or topics that their committee will discuss.
                                    </p>
                                    <p class="text-sm text-gray-500">
                                        MUN.UZ provides a comprehensive platform for organizing and conducting Model UN
                                        events, helping administrators, presidium members, and delegates focus on the
                                        educational experience rather than procedural complexities.
                                    </p>
                                </div>

                                <div class="mt-6 flex justify-end">
                                    <button type="button" class="btn btn-primary" @click="showAboutModal = false">
                                        Close
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { EnvelopeIcon, GlobeAltIcon } from '@heroicons/vue/24/outline'

// Current year for copyright
const currentYear = computed(() => new Date().getFullYear())

// Language selection
const language = ref('en')
function switchLanguage(lang) {
    language.value = lang
    // This is where you'd implement actual language switching logic
    // For example, using i18n or a similar localization library
}

// About modal
const showAboutModal = ref(false)
function openAboutModal() {
    showAboutModal.value = true
}
</script>