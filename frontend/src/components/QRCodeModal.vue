<template>
    <TransitionRoot appear :show="isOpen" as="template">
        <Dialog as="div" class="relative z-10" @close="closeModal">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black bg-opacity-25" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4 text-center">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel
                            class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 text-center">
                                QR Code Access
                            </DialogTitle>

                            <div class="mt-4 flex flex-col items-center">
                                <p class="text-sm text-gray-500 mb-4">
                                    Scan this QR code to log in as {{ userData.username }}
                                </p>

                                <div v-if="loading" class="flex justify-center py-8">
                                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>

                                <div v-else-if="error" class="text-red-500 py-4">
                                    {{ error }}
                                </div>

                                <div v-else-if="qrData" class="bg-white p-4 rounded-lg">
                                    <qrcode-vue :value="qrData" :size="200" level="H" />

                                    <div class="mt-4 text-center">
                                        <p class="text-xs text-gray-500 break-all">Token: {{ qrData }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-6 flex justify-center">
                                <button type="button" class="btn btn-outline" @click="closeModal">
                                    Close
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import QrcodeVue from 'qrcode.vue'
import { authService } from '../services/api'
import { toast } from 'vue3-toastify'

const props = defineProps({
    isOpen: Boolean,
    username: String
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')
const qrData = ref('')
const userData = ref({})

// Watch for changes in the isOpen prop
watch(() => props.isOpen, async (newValue) => {
    if (newValue && props.username) {
        await generateQRCode()
    }
})

// Also watch for username changes when modal is open
watch(() => props.username, async (newValue) => {
    if (props.isOpen && newValue) {
        await generateQRCode()
    }
})

async function generateQRCode() {
    loading.value = true
    error.value = ''
    qrData.value = ''

    try {
        const response = await authService.generateToken(props.username)
        qrData.value = response.data.token
        userData.value = {
            username: response.data.username,
            role: response.data.role
        }
    } catch (err) {
        error.value = 'Failed to generate QR code. Please try again.'
        toast.error('Failed to generate QR code')
    } finally {
        loading.value = false
    }
}

function closeModal() {
    emit('close')
}
</script>