import { createRouter, createWebHistory } from 'vue-router'

// Import view components
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AdminDashboardView from '../views/admin/DashboardView.vue'
import PresidiumDashboardView from '../views/presidium/DashboardView.vue'
import DelegateAuthView from '../views/DelegateAuthView.vue'
import DelegateDashboardView from '../views/delegate/DashboardView.vue'

// Define routes
const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/delegate/auth',
        name: 'delegate-auth',
        component: DelegateAuthView
    },
    {
        path: '/admin',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/presidium',
        name: 'presidium-dashboard',
        component: PresidiumDashboardView,
        meta: { requiresAuth: true, role: 'presidium' }
    },
    {
        path: '/delegate',
        name: 'delegate-dashboard',
        component: DelegateDashboardView,
        meta: { requiresAuth: true, role: 'delegate' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guards for authentication
router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role
    const user = JSON.parse(localStorage.getItem('user'))
    const token = localStorage.getItem('token')

    if (requiresAuth && (!user || !token)) {
        next('/login')
    } else if (requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'admin') {
            next('/admin')
        } else if (user?.role === 'presidium') {
            next('/presidium')
        } else if (user?.role === 'delegate') {
            next('/delegate')
        } else {
            next('/login')
        }
    } else {
        next()
    }
})

export default router