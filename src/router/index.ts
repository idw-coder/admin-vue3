import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', component: () => import('@/views/Dashboard.vue') },
        { path: 'notes/new', component: () => import('@/views/NoteCreate.vue') },
        { path: 'notes/:noteId', component: () => import('@/views/NoteDetail.vue') },
        { path: 'quizzes', component: () => import('@/views/QuizList.vue') },
        { path: 'quizzes/new', component: () => import('@/views/QuizEdit.vue') },
        { path: 'quizzes/:id/edit', component: () => import('@/views/QuizEdit.vue') },
        { path: 'quiz-categories', component: () => import('@/views/QuizCategoryManage.vue') },
        { path: 'quiz-tags', component: () => import('@/views/QuizTagManage.vue') },
        { path: 'users', component: () => import('@/views/UserManage.vue') },
      ],
    },
    { path: '/signin', component: () => import('@/views/Signin.vue') },
    { path: '/signup', component: () => import('@/views/Signup.vue') },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/signin')
  } else {
    next()
  }
})

export default router
