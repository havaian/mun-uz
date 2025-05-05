<template>
    <footer class="bg-white shadow mt-8 py-4">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center text-gray-500">
                <p>&copy; {{ currentYear }} MUN.UZ - Platform for Model UN Events</p>
            </div>
        </div>
    </footer>
</template>

<script>
import { computed } from 'vue'

export default {
    name: 'AppFooter',
    setup() {
        const currentYear = computed(() => new Date().getFullYear())

        return {
            currentYear
        }
    }
}
</script>