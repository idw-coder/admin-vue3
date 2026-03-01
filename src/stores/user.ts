import { defineStore } from 'pinia'
import api from '@/lib/api'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface UserUpdateParams {
  name?: string
  email?: string
  role?: 'admin' | 'user'
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/users')
        this.users = res.data.users
      } catch {
        this.error = 'ユーザーの取得に失敗しました'
      } finally {
        this.loading = false
      }
    },
    async updateUser(id: string, params: UserUpdateParams) {
      const res = await api.patch(`/users/${id}`, params)
      this.users = this.users.map((u) => (u.id === id ? res.data : u))
      return res.data
    },
    async deleteUser(id: string) {
      await api.delete(`/users/${id}`)
      this.users = this.users.filter((u) => u.id !== id)
    },
  },
})
