import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Create app instance
const app = createApp(App)

// Use pinia for state management
app.use(createPinia())

// Use vue-router
app.use(router)

// Mount the app
app.mount('#app')