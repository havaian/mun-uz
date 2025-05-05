<template>
  <div class="min-h-screen bg-gray-100">
    <AppHeader v-if="showHeader" />
    <main class="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>
    <AppFooter v-if="showFooter" />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter
  },
  setup() {
    const route = useRoute()

    // Hide header/footer on delegate auth page (QR code scan page)
    const showHeader = computed(() => route.name !== 'delegate-auth')
    const showFooter = computed(() => route.name !== 'delegate-auth')

    return {
      showHeader,
      showFooter
    }
  }
}
</script>