import { defineStore } from 'pinia'
import api from '@/lib/api'

type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthState = {
  user: User | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
  }),
  actions: {
    setAuth(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
    clearAuth() {
      localStorage.removeItem('token')
      this.user = null
      this.isAuthenticated = false
    },
    async initAuth() {
      if (!this.isAuthenticated) return
      try {
        const res = await api.get('/auth/me')
        this.setAuth(res.data.user)
      } catch {
        this.clearAuth()
      }
    },
  },
})
