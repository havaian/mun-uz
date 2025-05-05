import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/delegate/auth',
        name: 'delegate-auth',
        component: () => import('../views/DelegateAuthView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('../views/admin/DashboardView.vue'),
        meta: { requiresAuth: true, role: 'admin' },
        children: [
            {
                path: '',
                name: 'admin-dashboard',
                component: () => import('../views/admin/DashboardView.vue')
            },
            {
                path: 'events',
                name: 'admin-events',
                component: () => import('../views/admin/EventsView.vue')
            },
            {
                path: 'committees',
                name: 'admin-committees',
                component: () => import('../views/admin/CommitteesView.vue')
            },
            {
                path: 'presidium',
                name: 'admin-presidium',
                component: () => import('../views/admin/PresidiumView.vue')
            },
            {
                path: 'statistics',
                name: 'admin-statistics',
                component: () => import('../views/admin/StatisticsView.vue')
            }
        ]
    },
    {
        path: '/presidium',
        name: 'presidium',
        component: () => import('../views/presidium/DashboardView.vue'),
        meta: { requiresAuth: true, role: 'presidium' },
        children: [
            {
                path: '',
                name: 'presidium-dashboard',
                component: () => import('../views/presidium/DashboardView.vue')
            },
            {
                path: 'resolutions',
                name: 'presidium-resolutions',
                component: () => import('../views/presidium/ResolutionsView.vue')
            },
            {
                path: 'amendments',
                name: 'presidium-amendments',
                component: () => import('../views/presidium/AmendmentsView.vue')
            },
            {
                path: 'voting',
                name: 'presidium-voting',
                component: () => import('../views/presidium/VotingView.vue')
            },
            {
                path: 'statistics',
                name: 'presidium-statistics',
                component: () => import('../views/presidium/StatisticsView.vue')
            }
        ]
    },
    {
        path: '/delegate',
        name: 'delegate',
        component: () => import('../views/delegate/DashboardView.vue'),
        meta: { requiresAuth: true, role: 'delegate' },
        children: [
            {
                path: '',
                name: 'delegate-dashboard',
                component: () => import('../views/delegate/DashboardView.vue')
            },
            {
                path: 'resolutions',
                name: 'delegate-resolutions',
                component: () => import('../views/delegate/ResolutionsView.vue')
            },
            {
                path: 'amendments',
                name: 'delegate-amendments',
                component: () => import('../views/delegate/AmendmentsView.vue')
            },
            {
                path: 'statistics',
                name: 'delegate-statistics',
                component: () => import('../views/delegate/StatisticsView.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role

    if (requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (requiredRole && authStore.user?.role !== requiredRole) {
        next(authStore.getDefaultRoute)
    } else {
        next()
    }
})

export default router