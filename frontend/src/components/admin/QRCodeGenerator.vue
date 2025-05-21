<template>
    <div class="qr-generation">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Committee QR Codes</h3>

        <div class="card p-6 mb-6">
            <p class="text-gray-700 mb-4">
                Generate QR codes for all delegates in this committee. Delegates will use these
                QR codes to access the platform and participate in committee activities.
            </p>

            <div class="flex justify-end">
                <button @click="generateQRCodes" class="btn btn-primary" :disabled="generating">
                    {{ generating ? 'Generating...' : 'Generate QR Codes' }}
                </button>
            </div>
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded p-4 my-3 text-red-700">
            {{ error }}
        </div>

        <div v-if="qrCodesGenerated" class="mt-6 text-center">
            <a :href="pdfUrl" download="committee_qrcodes.pdf"
                class="btn bg-green-600 hover:bg-green-700 text-white inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
                    <path d="M12 17v-6"></path>
                    <path d="M9 14l3 3 3-3"></path>
                </svg>
                Download QR Codes PDF
            </a>
            <p class="mt-2 text-sm text-gray-500">
                Print these QR codes and distribute to delegates
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { committeesService } from '../../services/api'
import { toast } from 'vue3-toastify'

const props = defineProps({
    committeeId: {
        type: String,
        required: true
    }
})

const generating = ref(false)
const qrCodesGenerated = ref(false)
const pdfUrl = ref('')
const error = ref('')

async function generateQRCodes() {
    if (!props.committeeId) {
        error.value = 'No committee selected'
        return
    }

    error.value = ''
    generating.value = true

    try {
        // Revoke previous URL if exists to prevent memory leaks
        if (pdfUrl.value) {
            URL.revokeObjectURL(pdfUrl.value)
        }

        const response = await committeesService.generateQRCodes(props.committeeId)

        // Create a blob URL for the PDF
        const blob = new Blob([response.data], { type: 'application/pdf' })
        pdfUrl.value = URL.createObjectURL(blob)

        qrCodesGenerated.value = true
        toast.success('QR codes generated successfully')
    } catch (err) {
        console.error('Error generating QR codes:', err)
        error.value = 'Failed to generate QR codes. Please try again later.'
        toast.error('Failed to generate QR codes')
    } finally {
        generating.value = false
    }
}
</script>