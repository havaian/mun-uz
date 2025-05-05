<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader v-if="showHeader" />
    <main class="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>
    <AppFooter v-if="showFooter" />
    <Vue3Toastify position="bottom-right" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()

// Hide header/footer on delegate auth page (QR code scan page)
const showHeader = computed(() => route.name !== 'delegate-auth')
const showFooter = computed(() => route.name !== 'delegate-auth')
</script>