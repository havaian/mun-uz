<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>
    <AppFooter />
    <Vue3Toastify position="bottom-right" />
  </div>
</template>

<script setup>
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
</script>